from rest_framework import serializers
from .models import Amenity, HostelAmenity


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon_name']


class HostelAmenitySerializer(serializers.ModelSerializer):
    amenity = AmenitySerializer(read_only=True)
    amenity_id = serializers.PrimaryKeyRelatedField(
        queryset=Amenity.objects.all(),
        source='amenity',
        write_only=True
    )

    class Meta:
        model = HostelAmenity
        fields = ['id', 'hostel', 'amenity', 'amenity_id', 'details']
        read_only_fields = ['hostel']
