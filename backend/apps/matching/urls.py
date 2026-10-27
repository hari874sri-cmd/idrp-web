from django.urls import path
from .views import RecipientRecommendationView

urlpatterns = [
    path('recommendations/', RecipientRecommendationView.as_view(), name='recipient_recommendations'),
]

