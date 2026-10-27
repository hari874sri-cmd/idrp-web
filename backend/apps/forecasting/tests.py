from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.donations.models import FoodCategory
from apps.forecasting.models import FoodPreparationRecord
from apps.forecasting.services import SurplusForecastingEngine

class ForecastingEngineTests(TestCase):
    def setUp(self):
        self.donor = CustomUser.objects.create_user(
            email='chef@testkitchen.com',
            password='TestPassword123!',
            role=CustomUser.Role.DONOR,
            organization_name='Test Kitchen'
        )
        self.category = FoodCategory.objects.create(
            name='Cooked Meals',
            perishability_hours=12
        )

    def test_baseline_fallback_when_insufficient_data(self):
        # 0 records initially
        forecasts = SurplusForecastingEngine.train_and_forecast(
            donor=self.donor,
            category_id=self.category.id,
            days_ahead=7
        )
        self.assertEqual(len(forecasts), 1)
        cat_forecast = forecasts[0]
        self.assertFalse(cat_forecast['is_ml_trained'])
        self.assertEqual(len(cat_forecast['daily_forecasts']), 7)
        self.assertIn("Baseline Heuristic", cat_forecast['daily_forecasts'][0]['model_type'])

    def test_trained_ml_when_sufficient_data(self):
        # Create 10 historical records
        now = timezone.now().date()
        for i in range(10):
            FoodPreparationRecord.objects.create(
                donor=self.donor,
                category=self.category,
                date=now - timedelta(days=i + 1),
                meals_prepared=100 + i * 5,
                meals_served=90 + i * 4,
                surplus_quantity=5.0 + (i % 3),
                surplus_portions=10 + (i % 3)
            )

        forecasts = SurplusForecastingEngine.train_and_forecast(
            donor=self.donor,
            category_id=self.category.id,
            days_ahead=7
        )
        self.assertEqual(len(forecasts), 1)
        cat_forecast = forecasts[0]
        self.assertTrue(cat_forecast['is_ml_trained'])
        self.assertEqual(len(cat_forecast['daily_forecasts']), 7)
        self.assertIn("Random Forest", cat_forecast['daily_forecasts'][0]['model_type'])
        self.assertIn("meals_prepared", cat_forecast['daily_forecasts'][0]['top_factors'])

