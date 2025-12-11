from django.urls import path
from .views import (
    spotify_login,
    spotify_callback,
    get_user_spotify_connection_status,
    spotify_disconnect,
    search,
    get_spotify_token,
    get_user_playlists,
    get_user_playlist_details,
)

urlpatterns = [
    path('login/', spotify_login, name='spotify_login'),
    path('callback/', spotify_callback, name='spotify_callback'),
    path('user_status/', get_user_spotify_connection_status, name='get_user_spotify_connection_status'),
    path('disconnect/', spotify_disconnect, name='spotify_disconnect'),
    path('search/', search, name='spotify_search'),
    path('token/', get_spotify_token, name='get_spotify_token'),
    path('playlist/', get_user_playlists, name='spotify_playlists'),
    path('playlist/<str:playlist_id>/', get_user_playlist_details, name='spotify_playlist_details'),
]