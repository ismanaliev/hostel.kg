from django.db import models

class Amenity(models.Model):
    name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50, blank=True) # For frontend icons

class HostelAmenity(models.Model):
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE)
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE)
    details = models.CharField(max_length=255, blank=True) # e.g., "5G Speed"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)