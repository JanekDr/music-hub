from django.contrib import admin
from .models import CustomUser
from spotify.models import SpotifyToken


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "get_spotify_token")
    readonly_fields = ("get_spotify_token",)

    def get_spotify_token(self, obj):
        try:
            return obj.spotifytoken
        except SpotifyToken.DoesNotExist:
            return "-"

    get_spotify_token.short_description = "Spotify token"

    # def get_soundcloud_token(self, obj):
    #     try:
    #         return obj.soundcloudtoken
    #     except SoundcloudToken.DoesNotExist:
    #         return '-'
    # get_soundcloud_token.short_description = 'Soundcloud token'
