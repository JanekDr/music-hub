from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaylistViewSet, QueueViewSet

router = DefaultRouter()
router.register(r'', PlaylistViewSet, basename='playlist')
router.register(r'', PlaylistViewSet, basename='track')
router.register(r'', QueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
]