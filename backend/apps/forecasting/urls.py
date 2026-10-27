from django.urls import path
from .views import (
    FoodPreparationRecordListCreateView,
    FoodPreparationRecordDetailView,
    SurplusForecastView
)

urlpatterns = [
    path('records/', FoodPreparationRecordListCreateView.as_view(), name='prep_record_list_create'),
    path('records/<int:pk>/', FoodPreparationRecordDetailView.as_view(), name='prep_record_detail'),
    path('predict/', SurplusForecastView.as_view(), name='surplus_predict'),
]

