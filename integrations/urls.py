from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TelegramSessionViewSet, telegram_webhook

router = DefaultRouter()
router.register(r'telegram-sessions', TelegramSessionViewSet, basename='telegram-session')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/telegram/', telegram_webhook, name='telegram-webhook'),
]
