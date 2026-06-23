from django.db import models
from django.conf import settings

class TelegramSession(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    current_state = models.CharField(max_length=100, blank=True) # For onboarding flow
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
