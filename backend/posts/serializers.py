from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    """Serializer for a listing (Post) with the hostel and owner contact info
    that the public client feed needs.

    Writable by owners: content, price, room_type, image.
    Everything derived from the hostel/owner is read-only.
    """

    hostel = serializers.PrimaryKeyRelatedField(read_only=True)
    hostel_name = serializers.ReadOnlyField(source='hostel.name')
    hostel_verified = serializers.ReadOnlyField(source='hostel.is_verified')
    hostel_category = serializers.ReadOnlyField(source='hostel.category')
    hostel_address = serializers.ReadOnlyField(source='hostel.address')
    hostel_latitude = serializers.ReadOnlyField(source='hostel.latitude')
    hostel_longitude = serializers.ReadOnlyField(source='hostel.longitude')
    owner_username = serializers.ReadOnlyField(source='hostel.owner.username')
    owner_telegram_username = serializers.ReadOnlyField(source='hostel.owner.telegram_username')
    owner_telegram_id = serializers.ReadOnlyField(source='hostel.owner.telegram_id')
    owner_phone = serializers.ReadOnlyField(source='hostel.owner.phone_number')

    class Meta:
        model = Post
        fields = [
            'id',
            'hostel',
            'hostel_name',
            'hostel_verified',
            'hostel_category',
            'hostel_address',
            'hostel_latitude',
            'hostel_longitude',
            'owner_username',
            'owner_telegram_username',
            'owner_telegram_id',
            'owner_phone',
            'content',
            'price',
            'room_type',
            'image',
            'is_featured',
            'bumped_at',
            'is_active',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'hostel',
            'hostel_name',
            'hostel_verified',
            'hostel_category',
            'hostel_address',
            'hostel_latitude',
            'hostel_longitude',
            'owner_username',
            'owner_telegram_username',
            'owner_telegram_id',
            'owner_phone',
            'is_featured',
            'bumped_at',
            'created_at',
        ]
