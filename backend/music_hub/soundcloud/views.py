from django.http import HttpResponseRedirect, JsonResponse
from django.conf import settings
from urllib.parse import urlencode
from django.shortcuts import redirect
import requests
from rest_framework.decorators import permission_classes, api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import SoundcloudToken


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


class SoundcloudTokenExchange(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        code = request.data.get("code")
        code_verifier = request.data.get("code_verifier")

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
    payload = {
        'grant_type': 'refresh_token',
        'refresh_token': token_obj.refresh_token,
        'client_id': settings.SOUNDCLOUD_CLIENT_ID,
        'client_secret': settings.SOUNDCLOUD_CLIENT_SECRET,
    }
    response = requests.post(refresh_url, data=payload)
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
    print("Connected", connected, request.user)
    return JsonResponse({
        'connected': connected,
        'expires_at': expires_at,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disconnect(request):
    soundcloud_token = SoundcloudToken.objects.get(user=request.user)
    response = requests.post(
        "https://secure.soundcloud.com/sign-out",
        data={
            "access_token": soundcloud_token.refresh_token,
        }
    )
    if error in response.json():
        return JsonResponse({'error': error}, status=400)
    return JsonResponse(status)