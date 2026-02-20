import httpx
import logging


logger = logging.getLogger(__name__)


class SpotifyService:
    SEARCH_URL = "https://api.spotify.com/v1/search"

    def __init__(self, access_token):
        self.headers = {"Authorization": f"Bearer {access_token}"}

    async def search_async(self, query, limit=5):
        params = {
            "q": query,
            "type": "track",
            "limit": limit
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.SEARCH_URL, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()

                tracks = data.get('tracks', {}).get('items', [])
                if not tracks:
                    return None

                track = tracks[0]
                return {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "image_url": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                    "uri": track["uri"],
                    "external_url": track["external_urls"]["spotify"]
                }
            except Exception as e:
                logger.error(f"Spotify async search error for '{query}': {e}")
                return None