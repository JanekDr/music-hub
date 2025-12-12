from django.contrib import admin
from .models import Playlist, Queue, Track, QueueTrack
from ordered_model.admin import OrderedStackedInline, OrderedInlineModelAdminMixin

# Register your models here.
admin.site.register(Playlist)
admin.site.register(Track)


class QueueTrackStackedInline(OrderedStackedInline):
    model = QueueTrack
    fields = (
        "track",
        "move_up_down_links",
    )
    readonly_fields = ("move_up_down_links",)
    extra = 1


class QueueAdmin(OrderedInlineModelAdminMixin, admin.ModelAdmin):
    list_display = ("user",)
    inlines = (QueueTrackStackedInline,)


admin.site.register(Queue, QueueAdmin)
