from django.contrib import admin

from .models import Playlist, Queue, Track

# Register your models here.
admin.site.register(Playlist)
admin.site.register(Queue)
admin.site.register(Track)