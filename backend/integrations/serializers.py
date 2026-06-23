from rest_framework import serializers
from .models import TelegramSession


class TelegramSessionSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = TelegramSession
        fields = ['id', 'user', 'user_username', 'current_state', 'last_interaction']
        read_only_fields = ['last_interaction']
