from rest_framework import serializers
from .models import Track, Playlist


class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
            'id',
            'url',
            'name',
            'author',
            'platform'
        ]


class PlaylistSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Playlist
        fields = [
            'id',
            'name',
            'tracks',
            'owner',
            'collaborators',
            'followers',
            'is_public',
            'created_at'
        ]

    def create(self, validated_data):
        collaborators = validated_data.pop('collaborators', [])
        followers = validated_data.pop('followers', [])
        tracks = validated_data.pop('tracks', [])
        playlist = Playlist.objects.create(**validated_data)
        playlist.collaborators.set(collaborators)
        playlist.followers.set(followers)
        for track in tracks:
            track, _ = Track.objects.get_or_create(**track)
            playlist.tracks.add(track)
        return playlist

    def update(self, instance, validated_data):
        collaborators_data = validated_data.pop('collaborators', None)
        followers_data = validated_data.pop('followers', None)
        tracks_data = validated_data.pop('tracks', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if collaborators_data is not None:
            instance.collaborators.set(collaborators_data)

        if followers_data is not None:
            instance.followers.set(followers_data)

        if tracks_data is not None:
            tracks_obj = []
            for track in tracks_data:
                track, _ = Track.objects.get_or_create(**track)
                tracks_obj.append(track)
            instance.tracks.set(tracks_obj)
        instance.save()

        return instance