from rest_framework import viewsets, permissions, parsers
from rest_framework.exceptions import PermissionDenied
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
            return Post.objects.filter(hostel__owner=user).order_by('-created_at')

        return Post.objects.filter(is_active=True).order_by('-created_at')

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

