from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.donations.models import FoodCategory, FoodDonation, DonationClaim, Feedback
from apps.analytics.models import ImpactRecord

class DonationWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.donor = CustomUser.objects.create_user(
            email='donor_test@reroute.ai',
            password='TestPassword123!',
            role=CustomUser.Role.DONOR,
            organization_name='Test Donor Cafe',
            latitude=37.77,
            longitude=-122.41
        )
        self.receiver1 = CustomUser.objects.create_user(
            email='rec1_test@reroute.ai',
            password='TestPassword123!',
            role=CustomUser.Role.RECEIVER,
            organization_name='Test Shelter 1',
            latitude=37.78,
            longitude=-122.40
        )
        self.receiver2 = CustomUser.objects.create_user(
            email='rec2_test@reroute.ai',
            password='TestPassword123!',
            role=CustomUser.Role.RECEIVER,
            organization_name='Test Shelter 2',
            latitude=37.76,
            longitude=-122.42
        )
        self.category = FoodCategory.objects.create(
            name='Cooked Meals',
            perishability_hours=12,
            storage_requirement=FoodCategory.StorageRequirement.ROOM_TEMP
        )
        self.now = timezone.now()
        self.donation = FoodDonation.objects.create(
            donor=self.donor,
            category=self.category,
            title='Test Rice & Veggies',
            quantity=15.0,
            quantity_unit='kg',
            estimated_meals=30,
            pickup_window_start=self.now + timedelta(hours=1),
            pickup_window_end=self.now + timedelta(hours=6),
            expiry_time=self.now + timedelta(hours=12),
            pickup_address='123 Main St',
            latitude=37.77,
            longitude=-122.41,
            status=FoodDonation.Status.AVAILABLE
        )

    def test_receiver_claims_donation_successfully(self):
        self.client.force_authenticate(user=self.receiver1)
        url = f'/api/v1/donations/listings/{self.donation.id}/claim/'
        response = self.client.post(url, {'receiver_notes': 'Arriving at 2pm'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, FoodDonation.Status.REQUESTED)
        self.assertTrue(hasattr(self.donation, 'claim'))
        self.assertEqual(self.donation.claim.receiver, self.receiver1)

    def test_prevent_double_claim_concurrency_protection(self):
        # Receiver 1 claims
        self.client.force_authenticate(user=self.receiver1)
        url = f'/api/v1/donations/listings/{self.donation.id}/claim/'
        res1 = self.client.post(url, {}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Receiver 2 tries to claim same donation
        self.client.force_authenticate(user=self.receiver2)
        res2 = self.client.post(url, {}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        error_msg = (res2.data.get('error', '') + str(res2.data)).lower()
        self.assertTrue('no longer available' in error_msg or 'already claimed' in error_msg)

    def test_full_status_transition_lifecycle(self):
        # 1. Receiver claims
        self.client.force_authenticate(user=self.receiver1)
        self.client.post(f'/api/v1/donations/listings/{self.donation.id}/claim/', {}, format='json')

        # 2. Donor accepts claim
        self.client.force_authenticate(user=self.donor)
        res_accept = self.client.post(
            f'/api/v1/donations/listings/{self.donation.id}/update_status/',
            {'status': FoodDonation.Status.ACCEPTED},
            format='json'
        )
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, FoodDonation.Status.ACCEPTED)

        # 3. Donor marks ready for pickup
        res_ready = self.client.post(
            f'/api/v1/donations/listings/{self.donation.id}/update_status/',
            {'status': FoodDonation.Status.READY_FOR_PICKUP},
            format='json'
        )
        self.assertEqual(res_ready.status_code, status.HTTP_200_OK)

        # 4. Donor verifies pickup OTP
        otp = self.donation.claim.pickup_verification_code
        res_pickup = self.client.post(
            f'/api/v1/donations/listings/{self.donation.id}/update_status/',
            {'status': FoodDonation.Status.PICKED_UP, 'verification_code': otp},
            format='json'
        )
        self.assertEqual(res_pickup.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, FoodDonation.Status.PICKED_UP)

        # 5. Mark completed
        res_complete = self.client.post(
            f'/api/v1/donations/listings/{self.donation.id}/update_status/',
            {'status': FoodDonation.Status.COMPLETED},
            format='json'
        )
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, FoodDonation.Status.COMPLETED)

        # Check impact record automatically created
        self.assertTrue(ImpactRecord.objects.filter(donation=self.donation).exists())
        impact = ImpactRecord.objects.get(donation=self.donation)
        self.assertEqual(impact.kilograms_redistributed, 15.0)
        self.assertEqual(impact.co2_saved_kg, 37.5) # 15 * 2.5
