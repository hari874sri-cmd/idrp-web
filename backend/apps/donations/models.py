import random
import string
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import CustomUser

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

class FoodCategory(models.Model):
    class StorageRequirement(models.TextChoices):
        ROOM_TEMP = 'ROOM_TEMP', _('Room Temperature / Ambient')
        REFRIGERATED = 'REFRIGERATED', _('Refrigerated (0 - 4°C)')
        FROZEN = 'FROZEN', _('Frozen (-18°C or below)')

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default="Utensils", help_text="Lucide icon name")
    description = models.TextField(blank=True)
    perishability_hours = models.IntegerField(default=24, help_text="Typical shelf life in hours")
    storage_requirement = models.CharField(
        max_length=30, choices=StorageRequirement.choices, default=StorageRequirement.ROOM_TEMP
    )

    class Meta:
        verbose_name_plural = 'Food Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class FoodDonation(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', _('Available')
        REQUESTED = 'REQUESTED', _('Requested')
        ACCEPTED = 'ACCEPTED', _('Accepted')
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', _('Ready for Pickup')
        PICKED_UP = 'PICKED_UP', _('Picked Up')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')
        EXPIRED = 'EXPIRED', _('Expired')

    class DietaryType(models.TextChoices):
        VEG = 'VEG', _('Vegetarian')
        NON_VEG = 'NON_VEG', _('Non-Vegetarian')
        VEGAN = 'VEGAN', _('Vegan')
        HALAL = 'HALAL', _('Halal')
        KOSHER = 'KOSHER', _('Kosher')
        OTHER = 'OTHER', _('Other')

    class StorageCondition(models.TextChoices):
        AMBIENT = 'AMBIENT', _('Ambient / Shelf')
        REFRIGERATED = 'REFRIGERATED', _('Refrigerated')
        FROZEN = 'FROZEN', _('Frozen')
        HOT_HOLDING = 'HOT_HOLDING', _('Hot Holding')

    donor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='donations')
    title = models.CharField(max_length=255)
    category = models.ForeignKey(FoodCategory, on_delete=models.PROTECT, related_name='donations')
    description = models.TextField(blank=True)
    
    # Quantities & Portions
    quantity = models.FloatField(help_text="Quantity in weight or portion count")
    quantity_unit = models.CharField(max_length=20, default='kg', help_text="kg, portions, boxes, etc.")
    estimated_meals = models.IntegerField(default=10, help_text="Estimated people fed")
    
    # Timeframes & Safety
    preparation_time = models.DateTimeField(null=True, blank=True)
    expiry_time = models.DateTimeField(help_text="Safe consumption deadline")
    pickup_window_start = models.DateTimeField()
    pickup_window_end = models.DateTimeField()
    
    # Safety, Storage & Dietary flags
    dietary_type = models.CharField(max_length=20, choices=DietaryType.choices, default=DietaryType.VEG)
    allergens = models.CharField(max_length=255, blank=True, help_text="Declared allergens e.g. Dairy, Peanuts, Gluten")
    storage_condition = models.CharField(
        max_length=30, choices=StorageCondition.choices, default=StorageCondition.AMBIENT
    )
    storage_temperature_celsius = models.FloatField(null=True, blank=True)
    packaging_details = models.CharField(max_length=255, blank=True, default="Sealed containers")
    
    # Status & Logistics
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.AVAILABLE, db_index=True)
    pickup_address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    special_instructions = models.TextField(blank=True, help_text="Loading dock, security gate, contact upon arrival")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'expiry_time']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"{self.title} ({self.quantity} {self.quantity_unit}) - {self.get_status_display()}"


class DonationImage(models.Model):
    donation = models.ForeignKey(FoodDonation, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='donation_photos/%Y/%m/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.donation.title}"


class DonationClaim(models.Model):
    class ClaimStatus(models.TextChoices):
        REQUESTED = 'REQUESTED', _('Requested')
        ACCEPTED = 'ACCEPTED', _('Accepted')
        REJECTED = 'REJECTED', _('Rejected')
        READY = 'READY', _('Ready for Pickup')
        PICKED_UP = 'PICKED_UP', _('Picked Up')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    donation = models.OneToOneField(FoodDonation, on_delete=models.CASCADE, related_name='claim')
    receiver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='claims')
    status = models.CharField(max_length=20, choices=ClaimStatus.choices, default=ClaimStatus.REQUESTED)
    claimed_at = models.DateTimeField(auto_now_add=True)
    estimated_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    completed_time = models.DateTimeField(null=True, blank=True)
    
    pickup_verification_code = models.CharField(max_length=6, default=generate_otp)
    is_code_verified = models.BooleanField(default=False)
    
    receiver_notes = models.TextField(blank=True, help_text="Receiver vehicle info, contact person, or notes")
    cancellation_reason = models.TextField(blank=True)

    def __str__(self):
        return f"Claim by {self.receiver.organization_name} for {self.donation.title}"


class DonationStatusHistory(models.Model):
    donation = models.ForeignKey(FoodDonation, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Donation Status Histories'

    def __str__(self):
        return f"{self.donation.title}: {self.from_status} -> {self.to_status}"


class Feedback(models.Model):
    donation = models.ForeignKey(FoodDonation, on_delete=models.CASCADE, related_name='feedbacks')
    reviewer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='given_feedbacks')
    reviewee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_feedbacks')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="Overall rating 1-5")
    food_condition_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=5)
    punctuality_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('donation', 'reviewer')

    def __str__(self):
        return f"Feedback {self.rating}* by {self.reviewer.organization_name} for {self.reviewee.organization_name}"

