import httpx
import logging
from django.conf import settings


logger = logging.getLogger(__name__)


class SoundCloudService:
    BASE_URL = "https://api.soundcloud.com"

    def __init__(self, client_id=None):
        self.client_id = client_id or getattr(settings, 'SOUNDCLOUD_CLIENT_ID', None)

    async def search_async(self, query, limit=5):
        if not self.client_id:
            logger.error("SoundCloud Client ID is missing!")
            return None

        params = {
            "q": query,
            "limit": limit,
            "client_id": self.client_id
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.BASE_URL}/tracks", params=params)
                response.raise_for_status()
                tracks = response.json()

                if not tracks:
                    return None

                track = tracks[0]

                return {
                    "id": str(track["id"]),
                    "name": track["title"],
                    "artist": track["user"]["username"],
                    "image_url": track.get("artwork_url") or track["user"].get("avatar_url"),
                    "url": track["permalink_url"],
                    "platform": "soundcloud",
                    "track_duration": track.get("duration", 0)
                }
            except Exception as e:
                logger.error(f"SoundCloud async search error for '{query}': {e}")
                return None
