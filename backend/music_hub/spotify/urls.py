from django.urls import path
from .views import (
    spotify_login,
    spotify_callback,
    get_user_spotify_connection_status,
    spotify_disconnect,
    search,
    get_spotify_token,
)

urlpatterns = [
    path('login/', spotify_login, name='spotify_login'),
    path('callback/', spotify_callback, name='spotify_callback'),
    path('user_status', get_user_spotify_connection_status, name='get_user_spotify_connection_status'),
    path('disconnect', spotify_disconnect, name='spotify_disconnect'),
    path('search', search, name='spotify_search'),
    path('token', get_spotify_token, name='get_spotify_token'),
]