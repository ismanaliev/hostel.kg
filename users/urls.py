from django.urls import path
from .views import TelegramAuthView, CurrentUserProfileView, BecomeOwnerView

urlpatterns = [
    path('auth/', TelegramAuthView.as_view(), name='telegram-auth'),
    path('profile/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('become-owner/', BecomeOwnerView.as_view(), name='become-owner'),
]
