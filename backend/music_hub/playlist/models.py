from ordered_model.models import OrderedModel
from django.db import models
from django.shortcuts import get_object_or_404
from users.models import CustomUser


# Create your models here.
class Track(models.Model):
    track_id = models.CharField(max_length=32)
    url = models.CharField(max_length=255)
    platform = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=255, default="")
    author = models.CharField(max_length=255, default="")
    track_duration = models.PositiveIntegerField(default=0, help_text="Track duration in milliseconds")
    image_url = models.URLField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.url:
            if "spotify" in self.url:
                self.platform = "spotify"
            elif "soundcloud" in self.url:
                self.platform = "soundcloud"
            else:
                self.platform = "unknown"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.platform} - {self.name} - {self.author}"


class Playlist(models.Model):
    name = models.CharField(max_length=100)
    tracks = models.ManyToManyField(Track, related_name="playlists")
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    collaborators = models.ManyToManyField(
        CustomUser, related_name="collaborators", blank=True
    )
    followers = models.ManyToManyField(CustomUser, related_name="followers", blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def can_edit(self, user):
        if user == self.owner:
            return True
        if self.collaborators.filter(id=user.id).exists():
            return True
        return False

    def __str__(self):
        return f"{self.owner}`s playlist - {self.name}"


class Queue(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="queue"
    )


class QueueTrack(OrderedModel):
    queue = models.ForeignKey(
        Queue, on_delete=models.CASCADE, related_name="queue_tracks"
    )
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    order_with_respect_to = "queue"
