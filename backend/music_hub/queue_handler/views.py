from rest_framework import viewsets, permissions
from .models import Playlist
from .serializers import PlaylistSerializer
from .permissions import IsOwnerOrCollaboratorOrReadOnly

class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrCollaboratorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
