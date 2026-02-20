import json
from openai import AsyncOpenAI
from django.conf import settings

client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


class AIAnalyzer:
    @staticmethod
    async def get_suggestions(tracks_data):
        formatted_tracks = ", ".join([f"{t['name']} - {t['author']}" for t in tracks_data])

        prompt = f"""
        Analyze the following playlist: [{formatted_tracks}].
        1. Identify the main genre and mood.
        2. Suggest 5 similar songs that are NOT on the list.
        Return ONLY a JSON object with this structure:
        {{
            "mood": "string",
            "genre": "string",
            "suggestions": [
                {{"title": "song title", "artist": "artist name"}}
            ]
        }}
        """

        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print("blad")
            print(e)
            return {"mood": "Unknown", "genre": "Unknown", "suggestions": []}