from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.donations.models import FoodDonation
from .models import ImpactRecord

@receiver(post_save, sender=FoodDonation)
def update_impact_on_completion(sender, instance, **kwargs):
    if instance.status == FoodDonation.Status.COMPLETED:
        ImpactRecord.calculate_for_donation(instance)

