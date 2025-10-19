from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm')


    def validate(self, attrs):
        print(f"DEBUG: Otrzymane dane: {attrs}")

        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError('Passwords must match')
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            # 'spotify_token',
            'soundcloud_token',
        )
        read_only_fields = ('id',)