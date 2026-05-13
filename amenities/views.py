from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Amenity, HostelAmenity
from .serializers import AmenitySerializer, HostelAmenitySerializer


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    """List available amenities"""
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.IsAuthenticated]


class HostelAmenityViewSet(viewsets.ModelViewSet):
    """Link amenities to hostels"""
    queryset = HostelAmenity.objects.all()
    serializer_class = HostelAmenitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Owners see amenities for their hostels
        if self.request.user.is_authenticated and self.request.user.role == 'owner':
            return HostelAmenity.objects.filter(hostel__owner=self.request.user)
        # Staff can see all
        if self.request.user.is_staff:
            return HostelAmenity.objects.all()
        return HostelAmenity.objects.none()

    def perform_create(self, serializer):
        # Get hostel from query params or from the authenticated user's hostels
        hostel_id = self.request.data.get('hostel')
        if hostel_id:
            serializer.save(hostel_id=hostel_id)
