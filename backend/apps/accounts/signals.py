from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, OrganizationProfile, ReceiverPreference

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        OrganizationProfile.objects.create(user=instance)
        if instance.role == CustomUser.Role.RECEIVER:
            ReceiverPreference.objects.create(receiver=instance)

