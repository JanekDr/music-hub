import asyncio
from asgiref.sync import sync_to_async
from django.shortcuts import get_object_or_404
from .ai import AIAnalyzer
from spotify.services.spotify import SpotifyService
from soundcloud.services.soundcloud import SoundCloudService


class RecommendationService:
    def __init__(self, spotify_token, soundcloud_token):
        self.spotify = SpotifyService(spotify_token)
        self.soundcloud = SoundCloudService(soundcloud_token)

    async def get_intelligent_proposals(self, playlist_id):
        playlist_tracks = await self._get_playlist_tracks(playlist_id)
        ai_output = await AIAnalyzer.get_suggestions(playlist_tracks)

        tasks = []
        for sug in ai_output['suggestions']:
            query = f"{sug['artist']} {sug['title']}"
            tasks.append(self.spotify.search_async(query))
            tasks.append(self.soundcloud.search_async(query))

        all_results = await asyncio.gather(*tasks)

        formatted_proposals = []

        for i in range(0, len(all_results), 2):
            formatted_proposals.append({
                "spotify": all_results[i],
                "soundcloud": all_results[i + 1]
            })

        return {
            "insight": {
                "mood": ai_output['mood'],
                "genre": ai_output['genre']
            },
            "proposals": formatted_proposals
        }

    @sync_to_async
    def _get_playlist_tracks(self, playlist_id):
        from ..models import Playlist
        playlist = get_object_or_404(Playlist, slug=playlist_id)
        return list(playlist.tracks.all().values('name', 'author'))