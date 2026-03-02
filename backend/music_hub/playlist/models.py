import uuid
from ordered_model.models import OrderedModel
from django.db import models
from users.models import CustomUser


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

    @classmethod
    def get_or_create_safe(cls, track_data):
        t_id = track_data.get('track_id')

        existing_track = cls.objects.filter(track_id=t_id).first()

        if existing_track:
            return existing_track, False

        new_track = cls.objects.create(**track_data)
        return new_track, True


class Playlist(models.Model):
    VISIBILITY_CHOICES = (
        ('public', 'Public'),
        ('private', 'Private'),
        ('unlisted', 'Only with link')
    )

    name = models.CharField(max_length=100)
    tracks = models.ManyToManyField(Track, related_name="playlists")
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    collaborators = models.ManyToManyField(
        CustomUser, related_name="collaborators", blank=True
    )
    followers = models.ManyToManyField(CustomUser, related_name="followers", blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='private'
    )
    slug = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
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
