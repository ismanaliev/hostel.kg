from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import TelegramSession
from .serializers import TelegramSessionSerializer


class TelegramSessionViewSet(viewsets.ModelViewSet):
    """Staff only: Manage Telegram sessions"""
    queryset = TelegramSession.objects.all()
    serializer_class = TelegramSessionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def telegram_webhook(request):
    """
    Handle Telegram webhook data and map it to a TelegramSession.
    This endpoint is called by Telegram when users interact with the bot.
    """
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        data = json.loads(request.body)
        
        # Extract user info from Telegram update
        message = data.get('message', {})
        from_user = message.get('from', {})
        telegram_id = from_user.get('id')
        
        if not telegram_id:
            return JsonResponse({'error': 'Invalid Telegram webhook data'}, status=400)
        
        # Try to find user by telegram_id
        try:
            user = User.objects.get(telegram_id=telegram_id)
            session, created = TelegramSession.objects.get_or_create(
                user=user,
                defaults={'current_state': 'start'}
            )
        except User.DoesNotExist:
            # User not found - can implement auto-registration here if needed
            return JsonResponse({
                'status': 'success',
                'message': f'User with telegram_id {telegram_id} not registered yet. Auto-registration can be implemented.'
            }, status=status.HTTP_200_OK)
        
        # You can update the session state based on the message
        # For example:
        # if message.get('text') == '/start':
        #     session.current_state = 'awaiting_name'
        # session.save()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Telegram session {"created" if created else "updated"} for user {telegram_id}'
        }, status=status.HTTP_200_OK)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_or_create_telegram_session(telegram_id, user=None):
    """
    Utility function to get or create a TelegramSession for a given Telegram ID.
    
    Args:
        telegram_id: The Telegram user ID
        user: Optional User object to associate with the session
    
    Returns:
        TelegramSession object or None if user not found
    """
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    if user is None:
        try:
            user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            return None
    
    session, created = TelegramSession.objects.get_or_create(
        user=user,
        defaults={'current_state': 'start'}
    )
    return session
