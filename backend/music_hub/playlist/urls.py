from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaylistViewSet

router = DefaultRouter()
router.register(r'', PlaylistViewSet, basename='playlist')
router.register(r'', PlaylistViewSet, basename='track')

urlpatterns = [
    path('', include(router.urls)),
]