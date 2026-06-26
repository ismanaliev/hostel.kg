from django.db.models import F, Q
from django.utils import timezone
from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Post
from .serializers import PostSerializer
from .permissions import IsOwnerOrReadOnly


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and getattr(user, 'role', None) == 'owner':
            queryset = Post.objects.filter(hostel__owner=user)
        else:
            # Public listing feed: only active listings from active hostels.
            queryset = Post.objects.filter(is_active=True, hostel__status='active')

        return self.apply_filters(queryset).order_by(
            '-is_featured',
            F('bumped_at').desc(nulls_last=True),
            '-created_at',
        )

    def apply_filters(self, queryset):
        params = self.request.query_params

        hostel_id = params.get('hostel')
        if hostel_id:
            queryset = queryset.filter(hostel_id=hostel_id)

        category = params.get('category')
        if category:
            queryset = queryset.filter(hostel__category__iexact=category)

        room_type = params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)

        min_price = params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) | Q(hostel__name__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if not user.is_authenticated or getattr(user, 'role', None) != 'owner':
            raise PermissionDenied('Only hostel owners can create posts.')

        hostels = user.hostel_set.all()
        if not hostels.exists():
            raise PermissionDenied('You must register a hostel before creating posts.')

        if hostels.count() > 1:
            raise PermissionDenied(
                'Multiple hostels were found for your account. Create posts from the specific hostel management page.'
            )

        serializer.save(hostel=hostels.first())

    def perform_update(self, serializer):
        post = serializer.instance
        if post.hostel.owner != self.request.user:
            raise PermissionDenied('You can only update posts from your own hostel.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.hostel.owner != self.request.user:
            raise PermissionDenied('You can only delete posts from your own hostel.')
        instance.delete()

    @action(detail=True, methods=['post'])
    def bump(self, request, pk=None):
        """Lalafo-style bump: move the listing back to the top of the feed."""
        post = self.get_object()
        if post.hostel.owner != request.user:
            raise PermissionDenied('You can only bump posts from your own hostel.')
        post.bumped_at = timezone.now()
        post.save(update_fields=['bumped_at'])
        return Response(self.get_serializer(post).data)
