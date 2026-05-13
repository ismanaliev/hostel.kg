from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AmenityViewSet, HostelAmenityViewSet

router = DefaultRouter()
router.register(r'amenities', AmenityViewSet, basename='amenity')
router.register(r'hostel-amenities', HostelAmenityViewSet, basename='hostel-amenity')

urlpatterns = [
    path('', include(router.urls)),
]
