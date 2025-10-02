from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    spotify_token = models.ForeignKey(
        'spotify.SpotifyToken',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        default=None
    )
    soundcloud_token = models.CharField(max_length=100, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
