from django.db import models
from django.conf import settings

class VerificationVisit(models.Model):
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE)
    auditor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    visit_date = models.DateTimeField()
    report_data = models.JSONField(default=dict) # Checklist details
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)