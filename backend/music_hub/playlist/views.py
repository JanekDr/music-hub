from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import Playlist, QueueTrack, Track, Queue
from .serializers import PlaylistSerializer, QueueSerializer, TrackSerializer
from .permissions import IsOwnerOrCollaboratorOrReadOnly, IsOwnerOrStaffOnly

class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrCollaboratorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class QueueViewSet(viewsets.ModelViewSet):
    serializer_class = QueueSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffOnly]

    def get_queryset(self):
        return Queue.objects.filter(user = self.request.user)

    @action(detail=False, methods=['post'])
    def add_to_queue(self, request):
        queue = Queue.objects.get(user = self.request.user)
        track_id = request.data.get('track_id')
        if not track_id:
            return JsonResponse({'error': 'Track id is required'}, status=status.HTTP_400_BAD_REQUEST)

        track = get_object_or_404(Track, pk=track_id)

        qt = QueueTrack.objects.create(queue=queue, track=track)
        qt.bottom()
        return JsonResponse({'success':True},status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def remove_from_queue(self, request):
        queue = Queue.objects.get(user = self.request.user)
        queue_track_id = request.data.get('queue_track_id')

        if not queue_track_id:
            return JsonResponse({'error': 'Track id is required'}, status=status.HTTP_400_BAD_REQUEST)

        qt = get_object_or_404(QueueTrack, pk=queue_track_id, queue=queue)
        qt.delete()
        return JsonResponse({'track': None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def move_track_relative(self, request):
        queue = Queue.objects.get(user = self.request.user)
        queue_track_id = request.data.get('track_id')
        target_track_id = request.data.get('target_track_id')

        if not queue_track_id or not target_track_id:
            return JsonResponse({'error': 'Track id or target track id is required'}, status=status.HTTP_400_BAD_REQUEST)

        qt = get_object_or_404(QueueTrack, pk=queue_track_id, queue=queue)
        target_qt = get_object_or_404(QueueTrack, pk=target_track_id, queue=queue)
        qt.below(target_qt)

        return JsonResponse({'success': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_track(request):
    serializer = TrackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)