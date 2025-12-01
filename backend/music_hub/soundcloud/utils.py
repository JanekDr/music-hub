import time
import requests
from django.conf import settings

SC_CLIENT_ID = settings.SOUNDCLOUD_CLIENT_ID
SC_CLIENT_SECRET = settings.SOUNDCLOUD_CLIENT_SECRET

SC_TOKEN = None
SC_EXPIRES_AT = 0

def get_app_sc_token():
    global SC_TOKEN, SC_EXPIRES_AT
    now = time.time()

    if SC_TOKEN and now < SC_EXPIRES_AT - 60:
        return SC_TOKEN

    resp = requests.post(
        "https://api.soundcloud.com/oauth2/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "client_credentials",
            "client_id": SC_CLIENT_ID,
            "client_secret": SC_CLIENT_SECRET,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    SC_TOKEN = data["access_token"]
    SC_EXPIRES_AT = now + data.get("expires_in", 3600)
    return SC_TOKEN