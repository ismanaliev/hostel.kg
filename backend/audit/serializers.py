from rest_framework import serializers
from .models import VerificationVisit


class VerificationVisitSerializer(serializers.ModelSerializer):
    auditor_username = serializers.ReadOnlyField(source='auditor.username')
    hostel_name = serializers.ReadOnlyField(source='hostel.name')

    class Meta:
        model = VerificationVisit
        fields = ['id', 'hostel', 'hostel_name', 'auditor', 'auditor_username', 
                  'visit_date', 'report_data', 'is_approved']
        read_only_fields = ['auditor']
