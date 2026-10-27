from rest_framework import serializers
from .models import FoodPreparationRecord, SurplusForecast
from apps.donations.models import FoodCategory

class FoodPreparationRecordSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FoodPreparationRecord
        fields = [
            'id', 'category', 'category_name', 'date', 'day_of_week',
            'meals_prepared', 'meals_served', 'surplus_quantity',
            'surplus_portions', 'is_weekend', 'is_holiday_or_event',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'day_of_week', 'is_weekend', 'created_at']

class SurplusForecastSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = SurplusForecast
        fields = '__all__'

