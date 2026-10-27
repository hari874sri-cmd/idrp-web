from django.db import models
from apps.donations.models import FoodDonation

class ImpactRecord(models.Model):
    donation = models.OneToOneField(FoodDonation, on_delete=models.CASCADE, related_name='impact_record')
    meals_redistributed = models.IntegerField(default=0)
    kilograms_redistributed = models.FloatField(default=0.0)
    co2_saved_kg = models.FloatField(default=0.0, help_text="CO2 equivalent emissions averted in kg")
    water_saved_liters = models.FloatField(default=0.0, help_text="Virtual water footprint saved in liters")
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Impact for {self.donation.title}: {self.kilograms_redistributed}kg ({self.meals_redistributed} meals)"

    @classmethod
    def calculate_for_donation(cls, donation: FoodDonation):
        """
        Standard environmental impact factors:
        - 1 kg food waste averted prevents ~2.5 kg CO2e GHG emissions (FAO / EPA estimates).
        - 1 kg food waste averted saves ~800 - 1200 liters of embedded water footprint.
        """
        kg = donation.quantity if donation.quantity_unit.lower() == 'kg' else (donation.quantity * 0.4)
        meals = donation.estimated_meals or max(1, int(kg * 2.5))
        co2 = round(kg * 2.5, 2)
        water = round(kg * 1050.0, 1)

        impact, _ = cls.objects.update_or_create(
            donation=donation,
            defaults={
                'meals_redistributed': meals,
                'kilograms_redistributed': round(kg, 2),
                'co2_saved_kg': co2,
                'water_saved_liters': water
            }
        )
        return impact

