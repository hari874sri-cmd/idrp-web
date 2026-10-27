from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser

class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.donor_user = CustomUser.objects.create_user(
            email='testdonor@example.com',
            password='TestPassword123!',
            role=CustomUser.Role.DONOR,
            organization_name='Test Bakery'
        )
        self.receiver_user = CustomUser.objects.create_user(
            email='testreceiver@example.com',
            password='TestPassword123!',
            role=CustomUser.Role.RECEIVER,
            organization_name='Test Food Shelter'
        )

    def test_user_registration(self):
        url = reverse('auth_register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'role': CustomUser.Role.DONOR,
            'organization_name': 'New Cafe',
            'organization_type': CustomUser.OrganizationType.RESTAURANT,
            'phone': '1234567890'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(email='newuser@example.com').exists())

    def test_user_login_jwt(self):
        url = reverse('auth_login')
        data = {
            'email': 'testdonor@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], CustomUser.Role.DONOR)

    def test_current_user_profile(self):
        self.client.force_authenticate(user=self.donor_user)
        url = reverse('current_user')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['organization_name'], 'Test Bakery')

