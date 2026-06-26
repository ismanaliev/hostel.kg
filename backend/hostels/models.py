from django.db import models
from django.conf import settings

class Hostel(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('hidden', 'Hidden'),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, blank=True)  # e.g., 'Male-only', 'Female-only', 'Mixed'
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    is_verified = models.BooleanField(default=False)
    trust_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class HostelImage(models.Model):
    IMAGE_TYPES = (
        ('entrance', 'Entrance'),
        ('dorm_room', 'Dorm Room'),
        ('common_area', 'Common Area'),
        ('other', 'Other'),
    )
    hostel = models.ForeignKey(Hostel, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='hostels/')
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPES, blank=True)
    is_official = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
