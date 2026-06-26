from django.db.models import Min
from rest_framework import serializers
from .models import Hostel, HostelImage


class HostelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelImage
        fields = ['id', 'image', 'image_type', 'is_official', 'created_at']
        read_only_fields = ['id', 'created_at']


class HostelSerializer(serializers.ModelSerializer):
    images = HostelImageSerializer(many=True, read_only=True)
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_telegram_username = serializers.ReadOnlyField(source='owner.telegram_username')
    owner_telegram_id = serializers.ReadOnlyField(source='owner.telegram_id')
    owner_phone = serializers.ReadOnlyField(source='owner.phone_number')
    min_price = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id',
            'owner',
            'owner_telegram_username',
            'owner_telegram_id',
            'owner_phone',
            'name',
            'category',
            'address',
            'latitude',
            'longitude',
            'description',
            'status',
            'is_verified',
            'min_price',
            'images',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'is_verified',
            'min_price',
            'owner_telegram_username',
            'owner_telegram_id',
            'owner_phone',
            'created_at',
        ]

    def get_min_price(self, obj):
        result = obj.post_set.filter(
            is_active=True, price__isnull=False
        ).aggregate(value=Min('price'))
        return result['value']
