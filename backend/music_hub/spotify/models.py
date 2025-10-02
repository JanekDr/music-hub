from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SpotifyToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f'{self.user.username}`s SpotifyToken'