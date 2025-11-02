import requests
from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponseRedirect
from django.conf import settings
from urllib.parse import urlencode
from django.shortcuts import redirect
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import SpotifyToken

User = get_user_model()


def get_valid_spotify_token(user):
    try:
        token_obj = SpotifyToken.objects.get(user=user)
    except SpotifyToken.DoesNotExist:
        return None
    if token_obj.expires_at <= timezone.now():
        refresh_spotify_token(user)
        token_obj.refresh_from_db()
    return token_obj.access_token

def spotify_login(request):
    scopes = 'user-read-email user-read-private user-read-playback-state user-modify-playback-state streaming playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private app-remote-control'
    user_token = request.GET.get('token')
    params = {
        'client_id': settings.SOCIAL_AUTH_SPOTIFY_KEY,
        'response_type': 'code',
        'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
        'scope': scopes,
        'state': user_token,
        'show_dialog': 'true',
    }
    url = f'https://accounts.spotify.com/authorize?{urlencode(params)}'
    return HttpResponseRedirect(url)

def spotify_callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')
    state = request.GET.get('state')  # to jest token JWT
    if error:
        return JsonResponse({'error': error}, status=400)

    try:
        UntypedToken(state)
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(state)
        user = jwt_auth.get_user(validated_token)
    except (InvalidToken, TokenError):
        return JsonResponse({'error': 'Invalid token'}, status=401)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    token_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
        'client_id': settings.SOCIAL_AUTH_SPOTIFY_KEY,
        'client_secret': settings.SOCIAL_AUTH_SPOTIFY_SECRET,
    }
    response = requests.post(token_url, data=payload)
    token_info = response.json()

    access_token = token_info.get('access_token')
    refresh_token = token_info.get('refresh_token')
    expires_in = token_info.get('expires_in')  # w sekundach

    expires_at = timezone.now() + timedelta(seconds=expires_in)
    obj, created = SpotifyToken.objects.update_or_create(
        user=user,
        defaults={'access_token': access_token,
                  'refresh_token': refresh_token,
                  'expires_at': expires_at}
    )

    user.spotify_token = obj
    user.save()

    return redirect('http://localhost:3000/dashboard')


def refresh_spotify_token(user):
    token_obj = SpotifyToken.objects.get(user=user)
    if token_obj.expires_at > timezone.now():
        return token_obj.access_token

    refresh_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'refresh_token',
        'refresh_token': token_obj.refresh_token,
        'client_id': settings.SOCIAL_AUTH_SPOTIFY_KEY,
        'client_secret': settings.SOCIAL_AUTH_SPOTIFY_SECRET,
    }
    response = requests.post(refresh_url, data=payload)
    token_info = response.json()
    new_access_token = token_info.get('access_token')
    expires_in = token_info.get('expires_in')
    token_obj.access_token = new_access_token
    token_obj.expires_at = timezone.now() + timedelta(seconds=expires_in)
    token_obj.save()
    return new_access_token

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_playlists(request):
        spotify_token = get_valid_spotify_token(request.user)
        if not spotify_token:
            return JsonResponse({'error': 'Spotify account not connected'}, status=400)
        headers = {'Authorization': f'Bearer {spotify_token.access_token}'}
        response = requests.get('https://api.spotify.com/v1/me/playlists', headers=headers)
        return JsonResponse(response.json())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_spotify_connection_status(request):
    try:
        user_spotify_token = SpotifyToken.objects.get(user=request.user)
        connected = True
        expires_at = user_spotify_token.expires_at
    except SpotifyToken.DoesNotExist:
        connected = False
        expires_at = None
    print("Connected", connected, request.user)
    return JsonResponse({
        'connected': connected,
        'expires_at': expires_at,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def spotify_disconnect(request):
    try:
        token_obj = SpotifyToken.objects.get(user=request.user)
        token_obj.delete()
        print("disconnected", request.user)
        return JsonResponse({'message': 'Spotify account disconnected'})
    except SpotifyToken.DoesNotExist:
        return JsonResponse({'error': 'Spotify account not connected'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search(request):
    query = request.GET.get('q')
    if not query:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    token = get_valid_spotify_token(request.user)
    if not token:
        return JsonResponse({'error': 'Spotify account not connected'}, status=400)

    url = "https://api.spotify.com/v1/search"
    headers = {'Authorization': f'Bearer {token}'}
    params = {
        'q': query,
        'type': 'track',
        'limit': 5
    }
    response = requests.get(url, headers=headers, params=params)
    return JsonResponse(response.json())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_spotify_token(request):
    spotify_token = get_valid_spotify_token(request.user)

    if not spotify_token:
        return JsonResponse({'error': 'Spotify account not connected'}, status=400)

    return JsonResponse({'access_token': spotify_token}, status=200)