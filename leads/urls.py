from django.urls import path
from .views import LeadCreateView

urlpatterns = [
    path('reserve/', LeadCreateView.as_view(), name='reserve'),
]