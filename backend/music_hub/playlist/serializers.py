from rest_framework import serializers
from .models import Track, Playlist


class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
            'id',
            'url',
            'platform'
        ]


class PlaylistSerializer(serializers.ModelSerializer):
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
        playlist = Playlist.objects.create(**validated_data)
        playlist.collaborators.set(collaborators)
        playlist.followers.set(followers)
        return playlist

    def update(self, instance, validated_data):
        collaborators_data = validated_data.pop('collaborators', None)
        followers_data = validated_data.pop('followers', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if collaborators_data is not None:
            instance.collaborators.set(collaborators_data)
        if followers_data is not None:
            instance.followers.set(followers_data)
        instance.save()
        return instance