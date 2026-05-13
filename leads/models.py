from django.db import models
from django.conf import settings

class Lead(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('visited', 'Visited'),
        ('cancelled', 'Cancelled'),
    )
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)