from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Hostel, HostelImage
from io import BytesIO
from PIL import Image

User = get_user_model()


class HostelListTestCase(APITestCase):
    """Test cases for listing hostels"""

    def setUp(self):
        self.client = APIClient()
        self.hostels_url = '/api/hostels/'
        
        # Create owner user
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Create client user
        self.client_user = User.objects.create_user(
            username='client',
            email='client@test.com',
            role='client',
        )
        self.client_token = Token.objects.create(user=self.client_user)
        
        # Create hostels with different statuses
        self.active_hostel = Hostel.objects.create(
            owner=self.owner,
            name='Active Hostel',
            address='Kyiv, Ukraine',
            status='active',
        )
        
        self.pending_hostel = Hostel.objects.create(
            owner=self.owner,
            name='Pending Hostel',
            address='Lviv, Ukraine',
            status='pending',
        )
        
        self.draft_hostel = Hostel.objects.create(
            owner=self.owner,
            name='Draft Hostel',
            address='Odesa, Ukraine',
            status='draft',
        )

    def test_list_hostels_unauthenticated_sees_only_active(self):
        """Test that unauthenticated users see only active hostels"""
        response = self.client.get(self.hostels_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Active Hostel')

    def test_list_hostels_client_sees_only_active(self):
        """Test that client users see only active hostels"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.client.get(self.hostels_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Active Hostel')

    def test_list_hostels_owner_sees_own_all_statuses(self):
        """Test that owners see all their own hostels regardless of status"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        response = self.client.get(self.hostels_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        names = [h['name'] for h in response.data]
        self.assertIn('Active Hostel', names)
        self.assertIn('Pending Hostel', names)
        self.assertIn('Draft Hostel', names)

    def test_list_hostels_pagination(self):
        """Test that hostels list can be paginated"""
        response = self.client.get(self.hostels_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF should have pagination info if configured
        self.assertIsInstance(response.data, list)


class HostelDetailTestCase(APITestCase):
    """Test cases for hostel detail endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create owner user
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Create another owner
        self.other_owner = User.objects.create_user(
            username='other_owner',
            email='other@test.com',
            role='owner',
        )
        self.other_token = Token.objects.create(user=self.other_owner)
        
        # Create active hostel
        self.hostel = Hostel.objects.create(
            owner=self.owner,
            name='Test Hostel',
            address='Kyiv, Ukraine',
            status='active',
            category='Mixed',
            description='A great hostel',
        )
        self.hostel_url = f'/api/hostels/{self.hostel.id}/'

    def test_retrieve_active_hostel_unauthenticated(self):
        """Test retrieving active hostel as unauthenticated user"""
        response = self.client.get(self.hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Hostel')

    def test_retrieve_pending_hostel_unauthenticated_forbidden(self):
        """Test that unauthenticated users cannot see pending hostels"""
        self.hostel.status = 'pending'
        self.hostel.save()
        
        response = self.client.get(self.hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_own_pending_hostel_as_owner(self):
        """Test that owner can see their own pending hostels"""
        self.hostel.status = 'pending'
        self.hostel.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        response = self.client.get(self.hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_owner_cannot_see_pending_hostel(self):
        """Test that other owners cannot see someone's pending hostel"""
        self.hostel.status = 'pending'
        self.hostel.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')
        response = self.client.get(self.hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class HostelCreateTestCase(APITestCase):
    """Test cases for creating hostels"""

    def setUp(self):
        self.client = APIClient()
        self.hostels_url = '/api/hostels/'
        
        # Create owner user
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Create client user
        self.client_user = User.objects.create_user(
            username='client',
            email='client@test.com',
            role='client',
        )
        self.client_token = Token.objects.create(user=self.client_user)

    def test_create_hostel_unauthenticated(self):
        """Test that unauthenticated users cannot create hostels"""
        data = {
            'name': 'New Hostel',
            'address': 'Kyiv, Ukraine',
        }
        response = self.client.post(self.hostels_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_hostel_as_owner(self):
        """Test that authenticated owners can create hostels"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        data = {
            'name': 'New Hostel',
            'address': 'Kyiv, Ukraine',
            'category': 'Mixed',
            'description': 'A new hostel',
        }
        response = self.client.post(self.hostels_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Hostel')
        self.assertEqual(response.data['status'], 'pending')  # Default status
        self.assertEqual(response.data['owner'], self.owner.username)  # owner returns username

    def test_create_hostel_missing_required_fields(self):
        """Test validation for required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        data = {'name': 'Incomplete Hostel'}  # Missing address
        response = self.client.post(self.hostels_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class HostelUpdateTestCase(APITestCase):
    """Test cases for updating hostels"""

    def setUp(self):
        self.client = APIClient()
        
        # Create owner user
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Create another owner
        self.other_owner = User.objects.create_user(
            username='other_owner',
            email='other@test.com',
            role='owner',
        )
        self.other_token = Token.objects.create(user=self.other_owner)
        
        # Create hostel
        self.hostel = Hostel.objects.create(
            owner=self.owner,
            name='Test Hostel',
            address='Kyiv, Ukraine',
            status='active',
        )
        self.hostel_url = f'/api/hostels/{self.hostel.id}/'

    def test_update_hostel_as_owner(self):
        """Test that owner can update their own hostel"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        data = {'name': 'Updated Hostel Name'}
        response = self.client.patch(self.hostel_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hostel.refresh_from_db()
        self.assertEqual(self.hostel.name, 'Updated Hostel Name')

    def test_update_hostel_other_owner_forbidden(self):
        """Test that other owners cannot update someone's hostel"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')
        data = {'name': 'Hacked Hostel Name'}
        response = self.client.patch(self.hostel_url, data, format='json')
        
        # Queryset filters by owner, so non-owner gets 404 (not found) rather than 403
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.hostel.refresh_from_db()
        self.assertEqual(self.hostel.name, 'Test Hostel')  # Unchanged

    def test_update_hostel_unauthenticated_forbidden(self):
        """Test that unauthenticated users cannot update hostels"""
        data = {'name': 'Hacked Hostel'}
        response = self.client.patch(self.hostel_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HostelDeleteTestCase(APITestCase):
    """Test cases for deleting hostels"""

    def setUp(self):
        self.client = APIClient()
        
        # Create owner user
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Create another owner
        self.other_owner = User.objects.create_user(
            username='other_owner',
            email='other@test.com',
            role='owner',
        )
        self.other_token = Token.objects.create(user=self.other_owner)

    def test_delete_hostel_as_owner(self):
        """Test that owner can delete their own hostel"""
        hostel = Hostel.objects.create(
            owner=self.owner,
            name='Hostel to Delete',
            address='Kyiv, Ukraine',
        )
        hostel_url = f'/api/hostels/{hostel.id}/'
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        response = self.client.delete(hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Hostel.objects.filter(id=hostel.id).exists())

    def test_delete_hostel_other_owner_forbidden(self):
        """Test that other owners cannot delete someone's hostel"""
        hostel = Hostel.objects.create(
            owner=self.owner,
            name='Hostel to Protect',
            address='Kyiv, Ukraine',
        )
        hostel_url = f'/api/hostels/{hostel.id}/'
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')
        response = self.client.delete(hostel_url)
        
        # Queryset filters by owner, so non-owner gets 404 (not found) rather than 403
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Hostel.objects.filter(id=hostel.id).exists())

    def test_delete_hostel_unauthenticated_forbidden(self):
        """Test that unauthenticated users cannot delete hostels"""
        hostel = Hostel.objects.create(
            owner=self.owner,
            name='Hostel to Protect',
            address='Kyiv, Ukraine',
        )
        hostel_url = f'/api/hostels/{hostel.id}/'
        
        response = self.client.delete(hostel_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Hostel.objects.filter(id=hostel.id).exists())
