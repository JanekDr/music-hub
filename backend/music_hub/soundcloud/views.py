from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse, StreamingHttpResponse
from django.conf import settings
from urllib.parse import urlencode
from django.shortcuts import redirect
import requests
from rest_framework.decorators import permission_classes, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from .models import SoundcloudToken
from .utils import get_app_sc_token

User = get_user_model()

def get_valid_soundcloud_token(user):
    try:
        token_obj = SoundcloudToken.objects.get(user=user)
    except SoundcloudToken.DoesNotExist:
        return None
    if token_obj.expires_at <= timezone.now():
        resp = refresh_soundcloud_token(user)
        if resp is None:
            return None
        token_obj.refresh_from_db()
    return token_obj.access_token

def soundcloud_login(request):
    user_token = request.GET.get('token')
    code_challenge = request.GET.get('code_challenge')
    state = user_token

    params = {
        'client_id': settings.SOUNDCLOUD_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': settings.SOUNDCLOUD_REDIRECT_URI,
        'state': state,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
    }
    url = f"https://secure.soundcloud.com/authorize?{urlencode(params)}"
    return HttpResponseRedirect(url)

def soundcloud_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')  # JWT
    error = request.GET.get('error')

    if error:
        return JsonResponse({'error': error}, status=400)

    return redirect(f'http://localhost:3000/soundcloud/callback?code={code}&state={state}')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soundcloud_token_exchange(request):
    code = request.data.get("code")
    code_verifier = request.data.get("code_verifier")

    if not code or not code_verifier:
        return JsonResponse({'error': 'code verification required'}, status=400)

    token_url = 'https://secure.soundcloud.com/oauth/token'

    headers = {
        'accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    payload = {
        'grant_type': 'authorization_code',
        'client_id': settings.SOUNDCLOUD_CLIENT_ID,
        'client_secret': settings.SOUNDCLOUD_CLIENT_SECRET,
        'redirect_uri': settings.SOUNDCLOUD_REDIRECT_URI,
        'code_verifier': code_verifier,
        'code': code,
    }

    response = requests.post(token_url, headers=headers, data=payload)
    token_info = response.json()

    if 'error' in token_info:
        return JsonResponse({'error': token_info['error']}, status=400)

    access_token = token_info.get('access_token')
    refresh_token = token_info.get('refresh_token')
    expires_in = token_info.get('expires_in', 3600)
    expires_at = timezone.now() + timedelta(seconds=int(expires_in))

    SoundcloudToken.objects.update_or_create(
        user=request.user,
        defaults={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_at': expires_at
        }
    )

    return Response({'access_token': access_token, 'expires_at': expires_at, 'refresh_token': refresh_token})

@permission_classes([IsAuthenticated])
def refresh_soundcloud_token(user):
    token_obj = SoundcloudToken.objects.get(user=user)
    if token_obj.expires_at > timezone.now():
        return token_obj.access_token

    refresh_url = 'https://secure.soundcloud.com/oauth/token'
    headers = {
        'accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    payload = {
        'grant_type': 'refresh_token',
        'client_id': settings.SOUNDCLOUD_CLIENT_ID,
        'client_secret': settings.SOUNDCLOUD_CLIENT_SECRET,
        'refresh_token': token_obj.refresh_token,
    }

    response = requests.post(refresh_url, data=payload, headers=headers)

    if response.status_code >= 400:
        return None

    token_info = response.json()
    new_access_token = token_info.get('access_token')
    expires_in = token_info.get('expires_in', 3600)

    token_obj.access_token = new_access_token
    token_obj.expires_at = timezone.now() + timedelta(seconds=int(expires_in))
    token_obj.save()

    return new_access_token


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_soundcloud_connection_status(request):
    try:
        user_soundcloud_token = SoundcloudToken.objects.get(user=request.user)
        connected = True
        expires_at = user_soundcloud_token.expires_at
    except SoundcloudToken.DoesNotExist:
        connected = False
        expires_at = None
    return JsonResponse({
        'connected': connected,
        'expires_at': expires_at,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soundcloud_disconnect(request):
    try:
        soundcloud_token = get_valid_soundcloud_token(request.user)

        token_obj = SoundcloudToken.objects.get(user=request.user)
        token_obj.delete()

        response = requests.post(
            "https://secure.soundcloud.com/sign-out",
            json={
                "access_token": soundcloud_token,
            }
        )

        if response.status_code >= 400:
            print(f'soundcloud error, status code: {response.status_code}, \ndetails: {response}')

        return JsonResponse({'message': 'Soundcloud account disconnected'})
    except SoundcloudToken.DoesNotExist:
        return JsonResponse({'error': 'Soundcloud account not connected'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_playlists(request):
    soundcloud_token = get_valid_soundcloud_token(request.user)

    url = "https://api.soundcloud.com/me/playlists"
    headers = {
        "accept": "application/json; charset=utf-8",
        "Authorization": f"OAuth {soundcloud_token}"
    }

    response = requests.get(url, headers=headers, timeout=10)

    try:
        user_data = response.json()
    except ValueError:
        user_data = {"error": response.text}
        return Response(user_data, status=500)

    if response.status_code == 200:
        return Response(user_data)
    else:
        return Response(user_data, status=response.status_code)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search(request):
    query = request.GET.get('q')
    if not query:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    soundcloud_token = get_valid_soundcloud_token(request.user)

    if not soundcloud_token:
        return JsonResponse({'error': 'Soundcloud account not connected'}, status=400)

    url = "https://api.soundcloud.com/tracks"
    headers = {
        'accept': 'application/json; charset=utf-8',
        'Authorization': f'OAuth {soundcloud_token}'
    }
    params = {
        'q': query,
        'access': 'playable',
        'limit': 10
    }
    response = requests.get(url, headers=headers, params=params)
    return Response(response.json())


@api_view(["GET"])
@permission_classes([AllowAny])
def soundcloud_stream(request, track_id: str):
    sc_token = get_app_sc_token()

    resp = requests.get(
        f"https://api.soundcloud.com/tracks/{track_id}/stream",
        headers={
            "accept": "application/json; charset=utf-8",
            "Authorization": f"OAuth {sc_token}",
        },
        allow_redirects=False,
        stream=True,
    )

    if resp.status_code in (301, 302, 303, 307, 308):
        loc = resp.headers.get("Location")
        if not loc:
            return HttpResponse(status=502)
        return HttpResponseRedirect(loc)

    return StreamingHttpResponse(
        resp.iter_content(chunk_size=8192),
        status=resp.status_code,
        content_type=resp.headers.get("Content-Type", "audio/mpeg"),
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_track_data(request):
    track_id = request.GET.get('track_id')
    if not track_id:
        return JsonResponse({'error': 'No track_id provided'}, status=400)

    user_access_token = get_valid_soundcloud_token(request.user)

    if not user_access_token:
        return JsonResponse({'error': 'Soundcloud account not connected'}, status=400)

    headers = {
        'accept': 'application/json; charset=utf-8',
        'Authorization': f'OAuth {user_access_token}'
    }
    response = requests.get(f"https://api.soundcloud.com/tracks/soundcloud:tracks:{track_id}", headers=headers)

    try:
        track_data = response.json()
    except ValueError:
        track_data = {"error": response.text}
        return Response(track_data, status=500)

    if response.status_code == 200:
        return Response(track_data)
    else:
        return Response(track_data, status=response.status_code)