from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VerificationVisit
from .serializers import VerificationVisitSerializer
from hostels.models import Hostel


class IsStaff(permissions.BasePermission):
    """Permission to allow only staff/admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class VerificationVisitViewSet(viewsets.ModelViewSet):
    """
    Internal staff only: Create and manage hostel verification visits.
    Includes an action to approve a hostel (sets status to 'active').
    """
    queryset = VerificationVisit.objects.all()
    serializer_class = VerificationVisitSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def perform_create(self, serializer):
        # Set the auditor to the current user
        serializer.save(auditor=self.request.user)

    @action(detail=True, methods=['post'])
    def approve_hostel(self, request, pk=None):
        """Approve a hostel and set its status to 'active'"""
        verification_visit = self.get_object()
        
        try:
            hostel = verification_visit.hostel
            hostel.status = 'active'
            hostel.save()
            verification_visit.is_approved = True
            verification_visit.save()
            
            serializer = self.get_serializer(verification_visit)
            return Response({
                'message': f'Hostel "{hostel.name}" has been approved and is now active.',
                'verification_visit': serializer.data
            }, status=status.HTTP_200_OK)
        except Hostel.DoesNotExist:
            return Response(
                {'error': 'Hostel not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
