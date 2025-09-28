from django.urls import path
from .views import spotify_login, spotify_callback

urlpatterns = [
    path('login/', spotify_login, name='spotify_login'),
    path('callback/', spotify_callback, name='spotify_callback'),
]