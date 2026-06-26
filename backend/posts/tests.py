from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

from hostels.models import Hostel
from .models import Post

User = get_user_model()


class PublicListingFeedTestCase(APITestCase):
    """The listing feed is public and only surfaces active listings from
    active hostels, ordered featured -> recently bumped -> newest."""

    def setUp(self):
        self.client = APIClient()
        self.posts_url = '/api/posts/'

        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            role='owner',
            telegram_username='owner_tg',
            phone_number='+996700000000',
        )

        self.active_hostel = Hostel.objects.create(
            owner=self.owner,
            name='Active Hostel',
            address='Bishkek',
            category='Mixed',
            status='active',
            is_verified=True,
        )
        self.pending_hostel = Hostel.objects.create(
            owner=self.owner,
            name='Pending Hostel',
            address='Osh',
            status='pending',
        )

        self.visible_post = Post.objects.create(
            hostel=self.active_hostel,
            content='Bed available',
            price='500.00',
            room_type='bed',
        )
        # Hidden: inactive listing
        Post.objects.create(
            hostel=self.active_hostel,
            content='Old bed',
            is_active=False,
        )
        # Hidden: listing on a non-active hostel
        Post.objects.create(
            hostel=self.pending_hostel,
            content='Pending hostel bed',
        )

    def test_anonymous_can_browse_listings(self):
        response = self.client.get(self.posts_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], 'Bed available')

    def test_listing_exposes_contact_and_price(self):
        response = self.client.get(self.posts_url)
        item = response.data[0]
        self.assertEqual(item['owner_telegram_username'], 'owner_tg')
        self.assertEqual(item['owner_phone'], '+996700000000')
        self.assertEqual(item['hostel_name'], 'Active Hostel')
        self.assertTrue(item['hostel_verified'])
        self.assertEqual(str(item['price']), '500.00')
        self.assertEqual(item['room_type'], 'bed')

    def test_filter_by_price_range(self):
        Post.objects.create(
            hostel=self.active_hostel, content='Pricey room', price='2000.00'
        )
        response = self.client.get(self.posts_url, {'max_price': '1000'})
        contents = [p['content'] for p in response.data]
        self.assertIn('Bed available', contents)
        self.assertNotIn('Pricey room', contents)

    def test_filter_by_hostel(self):
        other_owner = User.objects.create_user(username='o2', role='owner')
        other_hostel = Hostel.objects.create(
            owner=other_owner, name='Other', address='X', status='active'
        )
        Post.objects.create(hostel=other_hostel, content='Other listing')

        response = self.client.get(self.posts_url, {'hostel': self.active_hostel.id})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['hostel'], self.active_hostel.id)

    def test_featured_then_bumped_then_newest_ordering(self):
        featured = Post.objects.create(
            hostel=self.active_hostel, content='Featured', is_featured=True
        )
        bumped = Post.objects.create(hostel=self.active_hostel, content='Bumped')
        bumped.bumped_at = timezone.now()
        bumped.save()

        response = self.client.get(self.posts_url)
        order = [p['content'] for p in response.data]
        self.assertEqual(order[0], 'Featured')
        self.assertEqual(order[1], 'Bumped')


class BumpActionTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username='owner', role='owner')
        self.owner_token = Token.objects.create(user=self.owner)
        self.other = User.objects.create_user(username='other', role='owner')
        self.other_token = Token.objects.create(user=self.other)

        self.hostel = Hostel.objects.create(
            owner=self.owner, name='H', address='A', status='active'
        )
        self.post = Post.objects.create(hostel=self.hostel, content='Bed')

    def test_owner_can_bump(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        response = self.client.post(f'/api/posts/{self.post.id}/bump/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertIsNotNone(self.post.bumped_at)

    def test_non_owner_cannot_bump(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')
        response = self.client.post(f'/api/posts/{self.post.id}/bump/')
        # The post is not in the other owner's queryset -> 404.
        self.assertIn(
            response.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )
        self.post.refresh_from_db()
        self.assertIsNone(self.post.bumped_at)

    def test_anonymous_cannot_bump(self):
        response = self.client.post(f'/api/posts/{self.post.id}/bump/')
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.post.refresh_from_db()
        self.assertIsNone(self.post.bumped_at)
