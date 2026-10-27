from django.urls import path
from .views import FoodListingAssistantView

urlpatterns = [
    path('analyze-food/', FoodListingAssistantView.as_view(), name='ai_analyze_food'),
]

