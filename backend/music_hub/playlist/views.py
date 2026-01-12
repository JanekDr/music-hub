from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import Playlist, QueueTrack, Track, Queue
from .serializers import PlaylistSerializer, QueueSerializer, TrackSerializer
from .permissions import IsOwnerOrCollaboratorOrReadOnly, IsOwnerOrStaffOnly


class PlaylistViewSet(viewsets.ModelViewSet):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrCollaboratorOrReadOnly]

    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'owner__username']

    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        queryset = Playlist.objects.all()

        access_condition = Q(owner=user) | Q(collaborators=user) | Q(followers=user)

        if self.action == 'list':
            return queryset.filter(
                access_condition | Q(visibility="public")
            ).distinct()
        else:
            return queryset.filter(
                access_condition |
                Q(visibility="public") |
                Q(visibility="unlisted")
            ).distinct()


    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def user(self, request):
        user = self.request.user

        playlists = Playlist.objects.filter(
            Q(owner=user) |
            Q(followers=user)
        ).distinct()

        serializer = PlaylistSerializer(playlists, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow_toggle(self, request, slug):
        user = request.user
        playlist = self.get_object()

        if playlist.owner == user:
            return Response({"error": "You cannot follow your`s playlist"}, status=status.HTTP_403_FORBIDDEN)

        if playlist.visibility == "private":
            return Response({"error": "You cannot follow private playlists"}, status=status.HTTP_403_FORBIDDEN)

        if user in playlist.followers.all():
            playlist.followers.remove(user)
            message = "unfollowed"
        else:
            playlist.followers.add(user)
            message = "followed"

        return Response({"status": message, "followers_count": playlist.followers.count()}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_track(self, request, slug=None):
        playlist = self.get_object()

        track_id = request.data.get('track_id')
        if not track_id:
            return Response(
                {"error": "Track id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        track = Track.objects.filter(
            track_id=track_id,
        ).first()

        if not track:
            track_data = request.data
            try:
                track = Track.objects.create(
                    track_id=track_id,
                    name=track_data['name'],
                    author=track_data['author'],
                    url=track_data['url'],
                    track_duration=track_data['track_duration'],
                    image_url=track_data['image_url']
                )
            except Exception as e:
                return Response(
                {"error - missing track's arguments": str(e)},
                      status=status.HTTP_400_BAD_REQUEST
                )

        playlist.tracks.add(track)
        return Response({"status": "success"}, status=status.HTTP_200_OK)


class QueueViewSet(viewsets.ModelViewSet):
    serializer_class = QueueSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffOnly]

    def get_queryset(self):
        return Queue.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"])
    def reorder_queue(self, request):
        queue = Queue.objects.get(user=request.user)
        new_order = request.data.get("queue_track_ids", [])
        if not isinstance(new_order, list):
            return Response(
                {"error": "queue_track_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for position, qt_id in enumerate(new_order):
            qt = QueueTrack.objects.get(pk=qt_id, queue=queue)
            qt.to(position)

        return Response(
            {"detail": "Queue reordered successfully"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["post"])
    def add_to_queue(self, request):
        queue = Queue.objects.get(user=self.request.user)
        track_id = request.data.get("track_id")
        if not track_id:
            return Response(
                {"error": "Track id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        track = get_object_or_404(Track, pk=track_id)

        qt = QueueTrack.objects.create(queue=queue, track=track)
        qt.bottom()
        return Response({"success": True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["delete"])
    def remove_from_queue(self, request):
        queue = Queue.objects.get(user=self.request.user)
        queue_track_id = request.data.get("queue_track_id")

        if not queue_track_id:
            return Response(
                {"error": "Track id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        qt = get_object_or_404(QueueTrack, pk=queue_track_id, queue=queue)
        qt.delete()
        return Response({"track": None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def move_track_relative(self, request):
        queue = Queue.objects.get(user=self.request.user)
        queue_track_id = request.data.get("track_id")
        target_track_id = request.data.get("target_track_id")

        if not queue_track_id or not target_track_id:
            return Response(
                {"error": "Track id or target track id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qt = get_object_or_404(QueueTrack, pk=queue_track_id, queue=queue)
        target_qt = get_object_or_404(QueueTrack, pk=target_track_id, queue=queue)
        qt.below(target_qt)

        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def replace_queue(self, request):
        tracks_data = request.data.get("tracks", [])
        if not tracks_data and isinstance(request.data, list):
            tracks_data = request.data

        if not isinstance(tracks_data, list):
            return Response(
                {"error": "Data must be a list of tracks"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queue = get_object_or_404(Queue, user=self.request.user)

        try:
            with transaction.atomic():
                QueueTrack.objects.filter(queue=queue).delete()

                for track_data in tracks_data:
                    track = Track.objects.filter(
                        track_id=track_data['track_id'],
                        platform=track_data['platform']
                    ).first()
                    if not track:
                        track = Track.objects.create(
                            track_id=track_data['track_id'],
                            platform=track_data['platform'],
                            name=track_data['name'],
                            author=track_data['author'],
                            url=track_data['url'],
                            track_duration=track_data['track_duration'],
                            image_url=track_data['image_url']
                        )

                    QueueTrack.objects.create(queue=queue, track=track)

            return Response({"status": "success", "count": len(tracks_data)}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Something went wrong while replacing queue"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def add_track(request):
    serializer = TrackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
