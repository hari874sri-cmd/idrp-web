from django.db import models
from apps.accounts.models import CustomUser
from apps.donations.models import FoodCategory

class FoodPreparationRecord(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MON = 0, 'Monday'
        TUE = 1, 'Tuesday'
        WED = 2, 'Wednesday'
        THU = 3, 'Thursday'
        FRI = 4, 'Friday'
        SAT = 5, 'Saturday'
        SUN = 6, 'Sunday'

    donor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='preparation_records')
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='preparation_records')
    date = models.DateField()
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    
    meals_prepared = models.IntegerField(help_text="Total meals or portions prepared")
    meals_served = models.IntegerField(help_text="Actual meals consumed/sold")
    surplus_quantity = models.FloatField(help_text="Surplus/waste in kilograms")
    surplus_portions = models.IntegerField(help_text="Surplus converted to meal portions")
    
    is_weekend = models.BooleanField(default=False)
    is_holiday_or_event = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['donor', 'category', 'date']),
        ]

    def save(self, *args, **kwargs):
        if self.date:
            self.day_of_week = self.date.weekday()
            self.is_weekend = self.day_of_week in [5, 6]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.donor.organization_name} - {self.category.name} on {self.date}: {self.surplus_quantity}kg"


class SurplusForecast(models.Model):
    donor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='forecasts')
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE)
    forecast_date = models.DateField()
    predicted_surplus_kg = models.FloatField()
    uncertainty_lower_kg = models.FloatField()
    uncertainty_upper_kg = models.FloatField()
    confidence_score = models.FloatField(default=0.85, help_text="R2 score or baseline confidence")
    model_type = models.CharField(max_length=50, default='RandomForestRegressor')
    top_contributing_factors = models.JSONField(default=dict)
    waste_reduction_tips = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['forecast_date']

    def __str__(self):
        return f"Forecast for {self.category.name} ({self.forecast_date}): {self.predicted_surplus_kg}kg"

