from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodCategoryViewSet, FoodDonationViewSet

router = DefaultRouter()
router.register(r'categories', FoodCategoryViewSet, basename='category')
router.register(r'listings', FoodDonationViewSet, basename='donation')

urlpatterns = [
    path('', include(router.urls)),
]

