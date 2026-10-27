from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import CustomUser, ReceiverPreference
from apps.donations.models import FoodCategory, FoodDonation
from apps.matching.services import RecipientMatchingEngine

class MatchingEngineTests(TestCase):
    def setUp(self):
        self.donor = CustomUser.objects.create_user(
            email='donor_match@example.com',
            password='TestPassword123!',
            role=CustomUser.Role.DONOR,
            organization_name='Downtown Restaurant',
            latitude=37.7749,
            longitude=-122.4194
        )
        self.rec_near = CustomUser.objects.create_user(
            email='near_receiver@example.com',
            password='TestPassword123!',
            role=CustomUser.Role.RECEIVER,
            organization_name='Nearby Shelter',
            latitude=37.7800,
            longitude=-122.4100,
            is_verified=True
        )
        self.rec_allergic = CustomUser.objects.create_user(
            email='allergic_receiver@example.com',
            password='TestPassword123!',
            role=CustomUser.Role.RECEIVER,
            organization_name='Peanut Allergy Safe Shelter',
            latitude=37.7750,
            longitude=-122.4180
        )
        # Configure allergen exclusion
        pref_allergic = self.rec_allergic.preferences
        pref_allergic.allergens_to_exclude = 'Peanuts, Shellfish'
        pref_allergic.save()

        self.category = FoodCategory.objects.create(name='Cooked Meals')

    def test_allergen_hard_filtering(self):
        now = timezone.now()
        peanut_donation = FoodDonation.objects.create(
            donor=self.donor,
            category=self.category,
            title='Peanut Satay Noodles',
            quantity=10.0,
            quantity_unit='kg',
            allergens='Peanuts, Soy',
            pickup_window_start=now,
            pickup_window_end=now + timedelta(hours=4),
            expiry_time=now + timedelta(hours=8),
            pickup_address='123 Main St',
            latitude=37.7749,
            longitude=-122.4194
        )

        recommendations = RecipientMatchingEngine.recommend_recipients(peanut_donation)
        rec_ids = [r['receiver_id'] for r in recommendations]

        # The allergic shelter must be completely filtered out
        self.assertNotIn(self.rec_allergic.id, rec_ids)
        # The nearby shelter should be recommended
        self.assertIn(self.rec_near.id, rec_ids)

