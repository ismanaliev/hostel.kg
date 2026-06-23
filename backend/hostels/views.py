from django.shortcuts import render
from django.http import HttpResponse

from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
from .models import Hostel
from .serializers import HostelSerializer
from .permissions import IsHostelOwnerOrReadOnly


class HostelViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsHostelOwnerOrReadOnly]
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer

    def get_queryset(self):
        # Owners see their own (even drafts), Clients see only Active
        if self.request.user.is_authenticated and self.request.user.role == 'owner':
            return Hostel.objects.filter(owner=self.request.user)
        return Hostel.objects.filter(status='active')

    def perform_create(self, serializer):
        # New hostels default to 'pending' for your team to check
        serializer.save(owner=self.request.user, status='pending')