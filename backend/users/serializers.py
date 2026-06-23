from rest_framework import serializers
from django.contrib.auth import get_user_model
from hostels.serializers import HostelSerializer, HostelImageSerializer

User = get_user_model()


class TelegramAuthSerializer(serializers.Serializer):
    initData = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    hostels = HostelSerializer(many=True, read_only=True, source='hostel_set')
    application_status = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'role',
            'is_verified',
            'application_status',
            'telegram_id',
            'hostels',
        ]
        read_only_fields = ['id', 'username', 'role', 'is_verified', 'telegram_id', 'hostels', 'application_status']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number']


class BecomeOwnerSerializer(serializers.Serializer):
    """
    Multi-step serializer for hostel onboarding application.
    Accepts hostel info and images for verification.
    """
    hostel_name = serializers.CharField(max_length=255)
    hostel_category = serializers.CharField(max_length=50, required=False, default='Mixed')
    hostel_description = serializers.CharField(required=False, default='')
    address = serializers.CharField(max_length=500)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    contact_phone = serializers.CharField(max_length=20, required=False)
    entrance_image = serializers.ImageField(required=True)
    dorm_image = serializers.ImageField(required=True)
    common_area_image = serializers.ImageField(required=True)

    def validate(self, data):
        if not data.get('hostel_name'):
            raise serializers.ValidationError('Hostel name is required.')
        if not data.get('address'):
            raise serializers.ValidationError('Address is required.')
        return data

