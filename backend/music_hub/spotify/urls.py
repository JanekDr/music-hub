from django.urls import path
from .views import spotify_login, spotify_callback, get_user_spotify_connection_status

urlpatterns = [
    path('login/', spotify_login, name='spotify_login'),
    path('callback/', spotify_callback, name='spotify_callback'),
    path('user_status', get_user_spotify_connection_status, name='get_user_spotify_connection_status'),
]