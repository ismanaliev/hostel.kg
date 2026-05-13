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

    class Meta:
        model = Hostel
        fields = [
            'id',
            'owner',
            'name',
            'category',
            'address',
            'latitude',
            'longitude',
            'description',
            'status',
            'images',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']
