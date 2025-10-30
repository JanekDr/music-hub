from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaylistViewSet, QueueViewSet, add_track

router = DefaultRouter()
router.register(r'playlist', PlaylistViewSet, basename='playlist')
router.register(r'queue', QueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
    path('tracks/add_track/', add_track, name='add_track'),
]