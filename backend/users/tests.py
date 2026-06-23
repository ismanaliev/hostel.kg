from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from io import BytesIO
from PIL import Image
import hashlib
import hmac
import time
from django.conf import settings
from unittest.mock import patch

User = get_user_model()


class TelegramAuthViewTestCase(APITestCase):
    """Test cases for Telegram authentication endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.auth_url = '/api/users/auth/'

    def _generate_valid_telegram_data(self):
        """Generate valid mocked Telegram initData as URL-encoded string"""
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', 'test_bot_token')
        current_time = int(time.time())

        payload = {
            'id': '123456789',
            'first_name': 'Test',
            'last_name': 'User',
            'username': 'testuser',
            'auth_date': str(current_time),
        }

        # Create data check string
        data_check_string = '\n'.join(
            f'{key}={payload[key]}'
            for key in sorted(payload.keys())
        )

        # Generate hash
        secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
        computed_hash = hmac.new(
            secret_key,
            msg=data_check_string.encode('utf-8'),
            digestmod=hashlib.sha256,
        ).hexdigest()

        payload['hash'] = computed_hash
        
        # Convert to URL-encoded query string
        query_string = '&'.join(f'{k}={v}' for k, v in payload.items())
        return query_string

    @override_settings(TELEGRAM_BOT_TOKEN='test_bot_token')
    def test_telegram_auth_success(self):
        """Test successful Telegram authentication"""
        init_data = self._generate_valid_telegram_data()
        response = self.client.post(self.auth_url, {'initData': init_data}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('role', response.data)
        self.assertIn('is_verified', response.data)
        self.assertEqual(response.data['role'], 'client')
        self.assertEqual(response.data['is_verified'], True)

    @override_settings(TELEGRAM_BOT_TOKEN='test_bot_token')
    def test_telegram_auth_creates_user(self):
        """Test that Telegram auth creates a new user"""
        init_data = self._generate_valid_telegram_data()
        response = self.client.post(self.auth_url, {'initData': init_data}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_count = User.objects.filter(telegram_id=123456789).count()
        self.assertEqual(user_count, 1)

    @override_settings(TELEGRAM_BOT_TOKEN='test_bot_token')
    def test_telegram_auth_returns_existing_user_token(self):
        """Test that Telegram auth returns token for existing user"""
        user = User.objects.create(
            username='testuser123',
            telegram_id=123456789,
            first_name='Existing',
            is_verified=True,
        )
        user.set_unusable_password()
        user.save()
        Token.objects.create(user=user)

        init_data = self._generate_valid_telegram_data()
        response = self.client.post(self.auth_url, {'initData': init_data}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_count = User.objects.filter(telegram_id=123456789).count()
        self.assertEqual(user_count, 1)  # Still only one user

    def test_telegram_auth_missing_init_data(self):
        """Test authentication fails when initData is missing"""
        response = self.client.post(self.auth_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(TELEGRAM_BOT_TOKEN='test_bot_token')
    def test_telegram_auth_invalid_hash(self):
        """Test authentication fails with invalid hash"""
        query_string = 'id=123456789&first_name=Test&auth_date=' + str(int(time.time())) + '&hash=invalid_hash_here'
        response = self.client.post(self.auth_url, {'initData': query_string}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(TELEGRAM_BOT_TOKEN='test_bot_token')
    def test_telegram_auth_expired_data(self):
        """Test authentication fails with expired auth_date"""
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', 'test_bot_token')
        expired_time = int(time.time()) - 86401  # More than 24 hours old

        payload = {
            'id': '123456789',
            'first_name': 'Test',
            'auth_date': str(expired_time),
        }

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

        payload['hash'] = computed_hash
        query_string = '&'.join(f'{k}={v}' for k, v in payload.items())
        response = self.client.post(self.auth_url, {'initData': query_string}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileViewTestCase(APITestCase):
    """Test cases for user profile endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/api/users/profile/'
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            phone_number='+380123456789',
            role='client',
            is_verified=True,
        )
        self.token = Token.objects.create(user=self.user)

    def test_get_profile_authenticated(self):
        """Test retrieving user profile when authenticated"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['role'], 'client')

    def test_get_profile_unauthenticated(self):
        """Test that unauthenticated users cannot retrieve profile"""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_profile_update_name(self):
        """Test updating first and last name"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
        }
        response = self.client.patch(self.profile_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')

    def test_patch_profile_update_phone(self):
        """Test updating phone number"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {'phone_number': '+380987654321'}
        response = self.client.patch(self.profile_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone_number, '+380987654321')

    def test_profile_read_only_fields(self):
        """Test that certain fields cannot be modified via API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            'username': 'hacker',
            'role': 'owner',
            'is_verified': False,
        }
        response = self.client.patch(self.profile_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'testuser')  # Should not change
        self.assertEqual(self.user.role, 'client')  # Should not change
        self.assertEqual(self.user.is_verified, True)  # Should not change

    def test_put_profile_update(self):
        """Test full profile update with PUT"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            'first_name': 'NewFirst',
            'last_name': 'NewLast',
            'phone_number': '+380111111111',
        }
        response = self.client.put(self.profile_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'NewFirst')


class BecomeOwnerViewTestCase(APITestCase):
    """Test cases for become owner application endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.become_owner_url = '/api/users/become-owner/'
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='client',
            application_status='none',
        )
        self.token = Token.objects.create(user=self.user)
        
    def _create_test_image(self):
        """Helper to create a test image file"""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        image_io.name = 'test.jpg'
        return image_io

    def test_get_become_owner_status_none(self):
        """Test getting become owner status when not applied"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get(self.become_owner_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['application_status'], 'none')
        self.assertEqual(response.data['role'], 'client')
        self.assertEqual(response.data['can_apply'], True)

    def test_get_become_owner_status_owner(self):
        """Test getting become owner status when already owner"""
        self.user.role = 'owner'
        self.user.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get(self.become_owner_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['can_apply'], False)

    def test_become_owner_unauthenticated(self):
        """Test that unauthenticated users cannot apply"""
        response = self.client.get(self.become_owner_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_become_owner_post_success(self):
        """Test successful owner application submission"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        data = {
            'hostel_name': 'Test Hostel',
            'hostel_category': 'Mixed',
            'hostel_description': 'A nice hostel',
            'address': 'Kyiv, Ukraine',
            'latitude': 50.450001,
            'longitude': 30.523400,
            'contact_phone': '+380123456789',
            'entrance_image': self._create_test_image(),
            'dorm_image': self._create_test_image(),
            'common_area_image': self._create_test_image(),
        }
        response = self.client.post(self.become_owner_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('hostel_id', response.data)
        self.assertIn('message', response.data)

    def test_become_owner_updates_application_status(self):
        """Test that application status changes to pending"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        data = {
            'hostel_name': 'Test Hostel',
            'address': 'Kyiv, Ukraine',
            'entrance_image': self._create_test_image(),
            'dorm_image': self._create_test_image(),
            'common_area_image': self._create_test_image(),
        }
        response = self.client.post(self.become_owner_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.application_status, 'pending')

    def test_become_owner_non_client_cannot_apply(self):
        """Test that non-client users cannot apply"""
        self.user.role = 'owner'
        self.user.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            'hostel_name': 'Test Hostel',
            'address': 'Kyiv, Ukraine',
            'entrance_image': self._create_test_image(),
            'dorm_image': self._create_test_image(),
            'common_area_image': self._create_test_image(),
        }
        response = self.client.post(self.become_owner_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_become_owner_pending_cannot_reapply(self):
        """Test that users with pending application cannot reapply"""
        self.user.application_status = 'pending'
        self.user.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            'hostel_name': 'Test Hostel',
            'address': 'Kyiv, Ukraine',
            'entrance_image': self._create_test_image(),
            'dorm_image': self._create_test_image(),
            'common_area_image': self._create_test_image(),
        }
        response = self.client.post(self.become_owner_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_become_owner_missing_required_fields(self):
        """Test that validation fails with missing required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        data = {
            'hostel_category': 'Mixed',
            # Missing hostel_name and address
            'entrance_image': self._create_test_image(),
            'dorm_image': self._create_test_image(),
            'common_area_image': self._create_test_image(),
        }
        response = self.client.post(self.become_owner_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
