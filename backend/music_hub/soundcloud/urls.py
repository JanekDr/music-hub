from django.urls import path
from .views import (
    soundcloud_token_exchange,
    get_user_soundcloud_connection_status,
    soundcloud_disconnect,
    get_user_playlists,
    search,
    soundcloud_stream,
    get_track_data,
    get_user_playlist_details,
)

urlpatterns = [
    path("token-exchange/", soundcloud_token_exchange, name="token_exchange"),
    path(
        "user_status/",
        get_user_soundcloud_connection_status,
        name="get_user_soundcloud_connection_status",
    ),
    path("disconnect/", soundcloud_disconnect, name="soundcloud_disconnect"),
    path("playlists/", get_user_playlists, name="get_user_playlists"),
    path("search/", search, name="soundcloud_search"),
    path("stream/<str:track_id>/", soundcloud_stream, name="soundcloud_stream"),
    path("get_track_data/", get_track_data, name="get_track_data"),
    path(
        "playlists/<str:playlist_id>",
        get_user_playlist_details,
        name="get_user_playlist_details",
    ),
]
