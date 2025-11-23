from django.urls import path
from .views import soundcloud_login, soundcloud_callback, SoundcloudTokenExchange

urlpatterns = [
    path('login/', soundcloud_login),
    path('callback/', soundcloud_callback),
    path('token-exchange/', SoundcloudTokenExchange.as_view()),
]
