from datetime import timedelta
import numpy as np
import pandas as pd
from django.utils import timezone
from sklearn.ensemble import RandomForestRegressor
from .models import FoodPreparationRecord, SurplusForecast
from apps.donations.models import FoodCategory

DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def generate_actionable_suggestions(avg_surplus_kg, top_factors, category_name):
    tips = []
    if avg_surplus_kg > 15:
        tips.append(f"Consider reducing batch production for {category_name} by 10-15% during anticipated low-traffic periods.")
        tips.append("Pre-schedule donation alert windows with partner NGOs 2 hours prior to kitchen closing.")
    elif avg_surplus_kg > 5:
        tips.append(f"Monitor portions for {category_name}. Modest surplus can be preserved safely via immediate blast chilling.")
        tips.append("Align kitchen prep checklists with weekly historical customer demand curve.")
    else:
        tips.append(f"Excellent surplus efficiency for {category_name}! Maintain standard portioning control.")

    if 'is_weekend' in top_factors and top_factors['is_weekend'] > 0.2:
        tips.append("Weekend variance is significant: consider flexible prep schedules on Saturdays and Sundays.")
    if 'meals_prepared' in top_factors and top_factors['meals_prepared'] > 0.3:
        tips.append("Batch volume is the primary driver: implement staggered batch cooking instead of single large batches.")

    return tips

class SurplusForecastingEngine:
    MIN_TRAINING_SAMPLES = 8

    @classmethod
    def train_and_forecast(cls, donor, category_id=None, days_ahead=7):
        """
        Train ML model or apply baseline heuristic to forecast food surplus for the next `days_ahead` days.
        """
        now = timezone.now().date()
        
        # Determine categories to forecast
        categories = FoodCategory.objects.all()
        if category_id:
            categories = categories.filter(id=category_id)

        all_forecasts = []

        for category in categories:
            records = FoodPreparationRecord.objects.filter(
                donor=donor,
                category=category
            ).order_by('date')

            count = records.count()
            forecast_items = []

            if count >= cls.MIN_TRAINING_SAMPLES:
                # Train ML Model
                data = list(records.values(
                    'day_of_week', 'is_weekend', 'is_holiday_or_event',
                    'meals_prepared', 'surplus_quantity'
                ))
                df = pd.DataFrame(data)

                X = df[['day_of_week', 'is_weekend', 'is_holiday_or_event', 'meals_prepared']]
                y = df['surplus_quantity']

                model = RandomForestRegressor(n_estimators=40, random_state=42, max_depth=5)
                model.fit(X, y)

                feature_names = ['day_of_week', 'is_weekend', 'is_holiday_or_event', 'meals_prepared']
                importances = dict(zip(feature_names, [round(float(v), 3) for v in model.feature_importances_]))
                
                # Calculate residual standard error for uncertainty interval
                y_pred = model.predict(X)
                residuals = y - y_pred
                std_error = float(np.std(residuals)) if len(residuals) > 1 else 1.5
                std_error = max(std_error, 0.8)

                # Predict upcoming days
                avg_prepared = float(df['meals_prepared'].mean())

                for i in range(1, days_ahead + 1):
                    future_date = now + timedelta(days=i)
                    dow = future_date.weekday()
                    is_wknd = 1 if dow in [5, 6] else 0
                    is_hol = 0
                    
                    # Expected meals prepared adjusted slightly for weekend
                    pred_prep = avg_prepared * (1.15 if is_wknd else 1.0)
                    
                    x_future = pd.DataFrame([{
                        'day_of_week': dow,
                        'is_weekend': is_wknd,
                        'is_holiday_or_event': is_hol,
                        'meals_prepared': pred_prep
                    }])

                    pred_val = float(model.predict(x_future)[0])
                    pred_val = max(0.5, round(pred_val, 1))

                    lower = max(0.0, round(pred_val - 1.96 * std_error, 1))
                    upper = round(pred_val + 1.96 * std_error, 1)

                    forecast_items.append({
                        'date': future_date.isoformat(),
                        'day_name': DAY_NAMES[dow],
                        'predicted_surplus_kg': pred_val,
                        'uncertainty_lower_kg': lower,
                        'uncertainty_upper_kg': upper,
                        'confidence': 0.88,
                        'model_type': 'Random Forest Regressor (Trained ML)',
                        'top_factors': importances,
                    })

                avg_predicted_surplus = float(np.mean([item['predicted_surplus_kg'] for item in forecast_items]))
                tips = generate_actionable_suggestions(avg_predicted_surplus, importances, category.name)

            else:
                # Insufficient data: Baseline Heuristic Fallback
                if count > 0:
                    avg_surplus = float(records.aggregate(models.Avg('surplus_quantity'))['surplus_quantity__avg'] or 6.5)
                else:
                    avg_surplus = 7.5  # Realistic standard kitchen baseline

                importances = {
                    'day_of_week': 0.35,
                    'is_weekend': 0.40,
                    'meals_prepared': 0.25
                }

                for i in range(1, days_ahead + 1):
                    future_date = now + timedelta(days=i)
                    dow = future_date.weekday()
                    is_wknd = dow in [5, 6]
                    
                    # Weekend heuristic factor
                    factor = 1.25 if is_wknd else 0.95
                    pred_val = round(avg_surplus * factor, 1)
                    lower = max(0.0, round(pred_val * 0.7, 1))
                    upper = round(pred_val * 1.35, 1)

                    forecast_items.append({
                        'date': future_date.isoformat(),
                        'day_name': DAY_NAMES[dow],
                        'predicted_surplus_kg': pred_val,
                        'uncertainty_lower_kg': lower,
                        'uncertainty_upper_kg': upper,
                        'confidence': 0.60,
                        'model_type': 'Baseline Heuristic (Insufficient Historical Samples)',
                        'top_factors': importances,
                    })

                tips = generate_actionable_suggestions(avg_surplus, importances, category.name)
                tips.append("Tip: Log at least 8 daily preparation records to activate the trained Random Forest AI model.")

            all_forecasts.append({
                'category_id': category.id,
                'category_name': category.name,
                'sample_count': count,
                'is_ml_trained': count >= cls.MIN_TRAINING_SAMPLES,
                'daily_forecasts': forecast_items,
                'waste_reduction_tips': tips
            })

        return all_forecasts

