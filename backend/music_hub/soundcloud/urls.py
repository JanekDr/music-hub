from django.urls import path
from .views import (
    soundcloud_login,
    soundcloud_callback,
    SoundcloudTokenExchange,
    get_user_soundcloud_connection_status,
)

urlpatterns = [
    path('login/', soundcloud_login, name='soundcloud_login'),
    path('callback/', soundcloud_callback, name='soundcloud_callback'),
    path('token-exchange/', SoundcloudTokenExchange.as_view(), name='token_exchange'),
    path('user_status/', get_user_soundcloud_connection_status, name='get_user_soundcloud_connection_status'),
]
