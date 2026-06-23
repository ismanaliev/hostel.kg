from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from hostels.models import Hostel, HostelImage
from posts.models import Post
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with test data for users, hostels, and posts'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')

        # Create test users
        self.create_users()

        # Create hostels for owners
        self.create_hostels()

        # Create posts for hostels
        self.create_posts()

        self.stdout.write(self.style.SUCCESS('Test data created successfully!'))

    def create_users(self):
        """Create test users with different roles"""
        users_data = [
            {
                'username': 'client1',
                'email': 'client1@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'phone_number': '+1234567890',
                'role': 'client',
                'is_verified': True,
            },
            {
                'username': 'client2',
                'email': 'client2@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'phone_number': '+1234567891',
                'role': 'client',
                'is_verified': True,
            },
            {
                'username': 'owner1',
                'email': 'owner1@example.com',
                'first_name': 'Mike',
                'last_name': 'Johnson',
                'phone_number': '+1234567892',
                'role': 'owner',
                'is_verified': True,
            },
            {
                'username': 'owner2',
                'email': 'owner2@example.com',
                'first_name': 'Sarah',
                'last_name': 'Wilson',
                'phone_number': '+1234567893',
                'role': 'owner',
                'is_verified': True,
            },
            {
                'username': 'pending_owner',
                'email': 'pending@example.com',
                'first_name': 'Alex',
                'last_name': 'Brown',
                'phone_number': '+1234567894',
                'role': 'client',
                'application_status': 'pending',
                'is_verified': True,
            },
            {
                'username': 'rejected_owner',
                'email': 'rejected@example.com',
                'first_name': 'Emma',
                'last_name': 'Davis',
                'phone_number': '+1234567895',
                'role': 'client',
                'application_status': 'rejected',
                'is_verified': True,
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username} ({user.role})')
            else:
                self.stdout.write(f'User {user.username} already exists')

    def create_hostels(self):
        """Create hostels for owners"""
        hostels_data = [
            {
                'owner_username': 'owner1',
                'name': 'Sunny Beach Hostel',
                'category': 'Mixed',
                'address': '123 Beach Street, Miami, FL',
                'latitude': 25.7617,
                'longitude': -80.1918,
                'description': 'A vibrant hostel right on the beach with amazing ocean views. Perfect for travelers looking to meet new people and enjoy the nightlife.',
                'status': 'active',
            },
            {
                'owner_username': 'owner1',
                'name': 'Mountain View Lodge',
                'category': 'Mixed',
                'address': '456 Mountain Road, Denver, CO',
                'latitude': 39.7392,
                'longitude': -104.9903,
                'description': 'Cozy mountain hostel with stunning views and hiking trails nearby. Great for nature lovers and outdoor enthusiasts.',
                'status': 'active',
            },
            {
                'owner_username': 'owner2',
                'name': 'City Center Hub',
                'category': 'Mixed',
                'address': '789 Downtown Ave, New York, NY',
                'latitude': 40.7128,
                'longitude': -74.0060,
                'description': 'Modern hostel in the heart of the city. Walking distance to all major attractions, subway stations, and nightlife.',
                'status': 'active',
            },
            {
                'owner_username': 'pending_owner',
                'name': 'Riverside Retreat',
                'category': 'Female-only',
                'address': '321 River Lane, Austin, TX',
                'latitude': 30.2672,
                'longitude': -97.7431,
                'description': 'Peaceful female-only hostel by the river. Safe, clean, and perfect for solo female travelers.',
                'status': 'pending',
            },
        ]

        for hostel_data in hostels_data:
            try:
                owner = User.objects.get(username=hostel_data['owner_username'])
                hostel, created = Hostel.objects.get_or_create(
                    owner=owner,
                    name=hostel_data['name'],
                    defaults=hostel_data
                )
                if created:
                    self.stdout.write(f'Created hostel: {hostel.name} for {owner.username}')
                    # Create sample images for the hostel
                    self.create_sample_images(hostel)
                else:
                    self.stdout.write(f'Hostel {hostel.name} already exists')
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Owner {hostel_data["owner_username"]} not found'))

    def create_sample_images(self, hostel):
        """Create sample images for a hostel"""
        image_types = ['entrance', 'dorm_room', 'common_area']
        for image_type in image_types:
            # Create a dummy image file
            image_content = ContentFile(b'dummy image content', name=f'{hostel.name.lower().replace(" ", "_")}_{image_type}.jpg')
            HostelImage.objects.create(
                hostel=hostel,
                image=image_content,
                image_type=image_type,
                is_official=True
            )

    def create_posts(self):
        """Create sample posts for hostels"""
        posts_data = [
            {
                'hostel_name': 'Sunny Beach Hostel',
                'content': '🌅 Good morning from Sunny Beach! The waves are calling and the sun is shining. Perfect day for some beach volleyball and meeting new friends. Who\'s joining?',
                'is_active': True,
            },
            {
                'hostel_name': 'Sunny Beach Hostel',
                'content': '🎉 Beach party tonight! We\'re hosting a bonfire on the sand with live music and cold drinks. All hostel guests welcome. Don\'t miss out!',
                'is_active': True,
            },
            {
                'hostel_name': 'Mountain View Lodge',
                'content': '🏔️ Just got back from an amazing hike! The trails here are incredible and the views are breathtaking. Anyone up for a group hike tomorrow?',
                'is_active': True,
            },
            {
                'hostel_name': 'Mountain View Lodge',
                'content': '🍲 Home-cooked dinner tonight! Our chef is making traditional mountain stew with fresh local ingredients. Join us in the common area at 7 PM.',
                'is_active': True,
            },
            {
                'hostel_name': 'City Center Hub',
                'content': '🎭 Broadway show tickets available! We have a group going to see the new musical tonight. Limited spots left - first come, first served!',
                'is_active': True,
            },
            {
                'hostel_name': 'City Center Hub',
                'content': '🗽 Statue of Liberty tour tomorrow morning! We\'re organizing a group trip with discounted tickets. Meet in the lobby at 9 AM.',
                'is_active': True,
            },
            {
                'hostel_name': 'City Center Hub',
                'content': '🍕 Pizza making class tonight! Learn to make authentic New York-style pizza with our Italian chef. Fun for all skill levels!',
                'is_active': True,
            },
            {
                'hostel_name': 'Riverside Retreat',
                'content': '🌸 Spring is here! The river is beautiful with all the blooming flowers. Perfect time for a peaceful walk along the water.',
                'is_active': True,
            },
            {
                'hostel_name': 'Riverside Retreat',
                'content': '🧘‍♀️ Yoga session by the river tomorrow morning at sunrise. All levels welcome - bring your mat or use ours. Free for all guests!',
                'is_active': True,
            },
        ]

        for post_data in posts_data:
            try:
                hostel = Hostel.objects.get(name=post_data['hostel_name'])
                post, created = Post.objects.get_or_create(
                    hostel=hostel,
                    content=post_data['content'],
                    defaults=post_data
                )
                if created:
                    self.stdout.write(f'Created post for {hostel.name}: "{post.content[:50]}..."')
                else:
                    self.stdout.write(f'Post already exists for {hostel.name}')
            except Hostel.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Hostel {post_data["hostel_name"]} not found'))
