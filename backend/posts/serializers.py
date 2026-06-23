from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    """
    Serializer for Post model with nested hostel and owner information.
    
    Read-only fields:
    - hostel: The hostel ID is assigned automatically from the owner's registered hostel
    - hostel_name: Name of the hostel
    - owner_username: Username of the hostel owner
    - owner_email: Email of the hostel owner
    - created_at: Timestamp of post creation
    """

    hostel = serializers.PrimaryKeyRelatedField(read_only=True)
    hostel_name = serializers.ReadOnlyField(source='hostel.name')
    owner_username = serializers.ReadOnlyField(source='hostel.owner.username')
    owner_email = serializers.ReadOnlyField(source='hostel.owner.email')

    class Meta:
        model = Post
        fields = [
            'id',
            'hostel',
            'hostel_name',
            'owner_username',
            'owner_email',
            'content',
            'image',
            'is_active',
            'created_at'
        ]
        read_only_fields = ['id', 'hostel', 'hostel_name', 'owner_username', 'owner_email', 'created_at']
