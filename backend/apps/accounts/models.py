from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', CustomUser.Role.ADMIN)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        DONOR = 'DONOR', _('Food Donor (Restaurant/Bakery/Canteen/Store)')
        RECEIVER = 'RECEIVER', _('Food Receiver (NGO/Shelter/Community Kitchen)')
        ADMIN = 'ADMIN', _('Administrator')

    class OrganizationType(models.TextChoices):
        RESTAURANT = 'RESTAURANT', _('Restaurant / Cafe')
        BAKERY = 'BAKERY', _('Bakery / Confectionery')
        GROCERY = 'GROCERY', _('Supermarket / Grocery Store')
        CANTEEN = 'CANTEEN', _('College / Corporate Canteen')
        NGO = 'NGO', _('NGO / Non-Profit')
        COMMUNITY_KITCHEN = 'COMMUNITY_KITCHEN', _('Community Kitchen')
        SHELTER = 'SHELTER', _('Homeless / Welfare Shelter')
        OTHER = 'OTHER', _('Other Organization')

    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.DONOR)
    organization_name = models.CharField(max_length=255, blank=True)
    organization_type = models.CharField(
        max_length=30, choices=OrganizationType.choices, default=OrganizationType.RESTAURANT
    )
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.FloatField(null=True, blank=True, help_text="Latitude for geospatial matching")
    longitude = models.FloatField(null=True, blank=True, help_text="Longitude for geospatial matching")
    is_verified = models.BooleanField(default=False, help_text="Verification status for trust & safety")
    verification_documents = models.CharField(max_length=255, blank=True)
    fssai_or_reg_number = models.CharField(max_length=100, blank=True, help_text="Official NGO/FSSAI/Tax registration")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class OrganizationProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    description = models.TextField(blank=True)
    contact_person = models.CharField(max_length=150, blank=True)
    operating_hours = models.CharField(max_length=200, blank=True, default="09:00 - 21:00")
    
    # Storage & Logistics Capacities
    storage_refrigerated_kg = models.FloatField(default=50.0, help_text="Refrigerated storage capacity in kg")
    storage_frozen_kg = models.FloatField(default=20.0, help_text="Frozen storage capacity in kg")
    storage_dry_kg = models.FloatField(default=100.0, help_text="Dry/Ambient storage capacity in kg")
    serving_capacity_meals = models.IntegerField(default=150, help_text="Daily meals serving capacity")
    has_transportation = models.BooleanField(default=True, help_text="Can handle pickup/transportation")
    vehicle_types = models.CharField(max_length=150, blank=True, default="Van, Two-Wheeler")
    
    # Rating aggregates
    average_rating = models.FloatField(default=5.0)
    total_reviews = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Profile for {self.user.organization_name or self.user.email}"


class ReceiverPreference(models.Model):
    receiver = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='preferences')
    max_pickup_distance_km = models.FloatField(default=15.0)
    accepts_cooked_meals = models.BooleanField(default=True)
    accepts_raw_produce = models.BooleanField(default=True)
    accepts_bakery = models.BooleanField(default=True)
    accepts_dairy = models.BooleanField(default=True)
    accepts_packaged = models.BooleanField(default=True)
    
    # Allergens to avoid (comma-separated or flags)
    allergens_to_exclude = models.CharField(
        max_length=255, blank=True, help_text="Comma-separated allergens to avoid (e.g. peanuts, dairy)"
    )
    dietary_vegetarian_only = models.BooleanField(default=False)
    dietary_halal_only = models.BooleanField(default=False)
    daily_capacity_kg = models.FloatField(default=100.0)

    def __str__(self):
        return f"Preferences for {self.receiver.organization_name or self.receiver.email}"

