import hashlib
import hmac
import time
import urllib.parse

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .serializers import TelegramAuthSerializer, UserProfileSerializer, UserUpdateSerializer, BecomeOwnerSerializer
from hostels.models import Hostel, HostelImage

User = get_user_model()


class TelegramAuthView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = TelegramAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        init_data = serializer.validated_data['initData']
        payload = self.parse_init_data(init_data)
        self.validate_init_data(payload)

        telegram_id = self.get_telegram_id(payload)
        user = self.get_or_create_user(payload, telegram_id)
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                'token': token.key,
                'role': user.role,
                'is_verified': user.is_verified,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def parse_init_data(init_data):
        if isinstance(init_data, dict):
            return init_data

        try:
            parsed = urllib.parse.parse_qs(init_data, keep_blank_values=True)
        except Exception as exc:
            raise ValidationError('Unable to parse initData') from exc

        return {key: values[0] for key, values in parsed.items()}

    @staticmethod
    def get_telegram_id(payload):
        telegram_id = payload.get('id') or payload.get('user_id')
        if telegram_id is None:
            raise ValidationError('Telegram id is missing from initData')
        try:
            return int(telegram_id)
        except (TypeError, ValueError):
            raise ValidationError('Invalid telegram id format')

    def validate_init_data(self, payload):
        received_hash = payload.pop('hash', None)
        if not received_hash:
            raise ValidationError('Missing hash in initData')

        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            raise ValidationError('Telegram bot token is not configured')

        data_check_string = '\n'.join(
            f'{key}={payload[key]}'
            for key in sorted(payload.keys())
        )

        secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
        computed_hash = hmac.new(
            secret_key,
            msg=data_check_string.encode('utf-8'),
            digestmod=hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            raise ValidationError('Telegram initData hash validation failed')

        auth_date = payload.get('auth_date')
        if auth_date is None:
            raise ValidationError('auth_date is missing from initData')

        try:
            auth_timestamp = int(auth_date)
        except (TypeError, ValueError):
            raise ValidationError('Invalid auth_date in initData')

        if abs(time.time() - auth_timestamp) > 86400:
            raise ValidationError('Telegram auth data has expired')

    def make_username(self, payload, telegram_id):
        base_username = payload.get('username') or payload.get('first_name') or f'telegram_{telegram_id}'
        username = ''.join(c if c.isalnum() or c == '_' else '_' for c in base_username.lower())
        if not username:
            username = f'telegram_{telegram_id}'

        if User.objects.filter(username=username).exists():
            username = f'{username}_{telegram_id}'

        return username

    def get_or_create_user(self, payload, telegram_id):
        try:
            return User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            username = self.make_username(payload, telegram_id)
            user = User.objects.create(
                username=username,
                telegram_id=telegram_id,
                first_name=payload.get('first_name', ''),
                last_name=payload.get('last_name', ''),
                email=payload.get('email', ''),
                role='client',
                is_verified=True,
            )
            user.set_unusable_password()
            user.save()
            return user


class CurrentUserProfileView(RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = User.objects.none()

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return UserUpdateSerializer
        return UserProfileSerializer

    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


class BecomeOwnerView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'application_status': user.application_status,
            'role': user.role,
            'can_apply': user.role == 'client' and user.application_status == 'none',
        })

    def post(self, request):
        user = request.user

        if user.role != 'client':
            return Response(
                {'error': 'Only clients can apply to become owners.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.application_status == 'pending':
            return Response(
                {'error': 'Your application is already pending review.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.application_status == 'rejected':
            return Response(
                {'error': 'Your previous application was rejected. Please contact support.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BecomeOwnerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        contact_phone = data.get('contact_phone') or user.phone_number

        hostel = Hostel.objects.create(
            owner=user,
            name=data.get('hostel_name'),
            category=data.get('hostel_category', 'Mixed'),
            description=data.get('hostel_description', ''),
            address=data.get('address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            status='pending',
        )

        image_types = [
            ('entrance_image', 'entrance'),
            ('dorm_image', 'dorm_room'),
            ('common_area_image', 'common_area'),
        ]

        for field_name, image_type in image_types:
            image_file = request.FILES.get(field_name)
            if image_file:
                HostelImage.objects.create(
                    hostel=hostel,
                    image=image_file,
                    image_type=image_type,
                )

        user.application_status = 'pending'
        user.phone_number = contact_phone
        user.save()

        return Response(
            {'message': 'Application submitted for review.', 'hostel_id': hostel.id},
            status=status.HTTP_201_CREATED
        )

