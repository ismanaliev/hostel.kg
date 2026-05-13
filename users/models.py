from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('owner', 'Owner'),
        ('staff', 'Staff/Admin'),
    )
    APPLICATION_STATUS_CHOICES = (
        ('none', 'Not Applied'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    telegram_id = models.BigIntegerField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    is_verified = models.BooleanField(default=False)
    
    application_status = models.CharField(
        max_length=10, 
        choices=APPLICATION_STATUS_CHOICES, 
        default='none'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"