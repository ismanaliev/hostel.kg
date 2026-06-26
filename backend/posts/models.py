from django.db import models

class Post(models.Model):
    ROOM_TYPES = (
        ('bed', 'Bed in a shared room'),
        ('room', 'Private room'),
        ('apartment', 'Apartment'),
        ('other', 'Other'),
    )
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE)
    content = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, blank=True)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    bumped_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)