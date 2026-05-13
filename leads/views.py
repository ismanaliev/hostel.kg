from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Lead
from .serializers import LeadSerializer

class LeadCreateView(generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)