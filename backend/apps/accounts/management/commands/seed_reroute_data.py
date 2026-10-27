from datetime import timedelta, date
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import CustomUser, OrganizationProfile, ReceiverPreference
from apps.donations.models import (
    FoodCategory, FoodDonation, DonationClaim,
    DonationStatusHistory, Feedback
)
from apps.forecasting.models import FoodPreparationRecord
from apps.analytics.models import ImpactRecord
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Seeds realistic demonstration data for ReRoute AI'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting ReRoute AI data seeding...'))

        # 1. Create Food Categories
        categories_data = [
            {'name': 'Cooked Meals', 'icon': 'Utensils', 'perishability_hours': 12, 'storage_requirement': FoodCategory.StorageRequirement.ROOM_TEMP, 'description': 'Prepared curries, rice dishes, pasta, casseroles held at safe temperatures'},
            {'name': 'Baked Goods', 'icon': 'Croissant', 'perishability_hours': 48, 'storage_requirement': FoodCategory.StorageRequirement.ROOM_TEMP, 'description': 'Breads, baguettes, muffins, pastries, rolls'},
            {'name': 'Produce & Fresh Vegetables', 'icon': 'Apple', 'perishability_hours': 72, 'storage_requirement': FoodCategory.StorageRequirement.ROOM_TEMP, 'description': 'Fresh vegetables, seasonal fruits, greens, roots'},
            {'name': 'Dairy & Eggs', 'icon': 'Milk', 'perishability_hours': 36, 'storage_requirement': FoodCategory.StorageRequirement.REFRIGERATED, 'description': 'Milk cartons, cheese, yogurts, butter, fresh eggs'},
            {'name': 'Packaged & Canned Foods', 'icon': 'Package', 'perishability_hours': 720, 'storage_requirement': FoodCategory.StorageRequirement.ROOM_TEMP, 'description': 'Dry pasta, canned beans, cereals, granola bars, pantry staples'},
            {'name': 'Beverages', 'icon': 'Coffee', 'perishability_hours': 48, 'storage_requirement': FoodCategory.StorageRequirement.ROOM_TEMP, 'description': 'Bottled juices, smoothies, plant milks, iced teas'},
        ]

        categories = {}
        for cdata in categories_data:
            cat, _ = FoodCategory.objects.update_or_create(name=cdata['name'], defaults=cdata)
            categories[cdata['name']] = cat
        self.stdout.write(self.style.SUCCESS(f'Created/updated {len(categories)} food categories.'))

        # 2. Create Users
        # Admin
        admin_user, _ = CustomUser.objects.update_or_create(
            email='admin@reroute.ai',
            defaults={
                'role': CustomUser.Role.ADMIN,
                'organization_name': 'ReRoute Platform Administration',
                'organization_type': CustomUser.OrganizationType.OTHER,
                'phone': '+1 (555) 019-9000',
                'address': '100 Innovation Way, Tech Hub',
                'city': 'San Francisco',
                'latitude': 37.7749,
                'longitude': -122.4194,
                'is_verified': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('AdminPass123!')
        admin_user.save()

        # Donor 1: The Green Bistro
        donor1, _ = CustomUser.objects.update_or_create(
            email='greenbistro@reroute.ai',
            defaults={
                'role': CustomUser.Role.DONOR,
                'organization_name': 'The Green Bistro & Cafe',
                'organization_type': CustomUser.OrganizationType.RESTAURANT,
                'phone': '+1 (555) 019-2001',
                'address': '452 Market Street, Downtown',
                'city': 'San Francisco',
                'latitude': 37.7897,
                'longitude': -122.4005,
                'is_verified': True,
                'fssai_or_reg_number': 'CA-HEALTH-88291',
            }
        )
        donor1.set_password('DonorPass123!')
        donor1.save()
        donor1.profile.description = 'Farm-to-table organic eatery specializing in wholesome Mediterranean bowls, soups, and artisan sourdough sandwiches.'
        donor1.profile.operating_hours = '08:00 - 22:00'
        donor1.profile.storage_refrigerated_kg = 80.0
        donor1.profile.storage_dry_kg = 150.0
        donor1.profile.average_rating = 4.9
        donor1.profile.total_reviews = 24
        donor1.profile.save()

        # Donor 2: Golden Crust Bakery
        donor2, _ = CustomUser.objects.update_or_create(
            email='artisanbakery@reroute.ai',
            defaults={
                'role': CustomUser.Role.DONOR,
                'organization_name': 'Golden Crust Artisan Bakery',
                'organization_type': CustomUser.OrganizationType.BAKERY,
                'phone': '+1 (555) 019-2002',
                'address': '812 Valencia Street, Mission District',
                'city': 'San Francisco',
                'latitude': 37.7599,
                'longitude': -122.4215,
                'is_verified': True,
                'fssai_or_reg_number': 'CA-BAKE-44102',
            }
        )
        donor2.set_password('DonorPass123!')
        donor2.save()

        # Donor 3: Metro University Canteen
        donor3, _ = CustomUser.objects.update_or_create(
            email='campusdining@reroute.ai',
            defaults={
                'role': CustomUser.Role.DONOR,
                'organization_name': 'Metro University Central Canteen',
                'organization_type': CustomUser.OrganizationType.CANTEEN,
                'phone': '+1 (555) 019-2003',
                'address': '1600 Holloway Ave, University Campus',
                'city': 'San Francisco',
                'latitude': 37.7241,
                'longitude': -122.4799,
                'is_verified': True,
                'fssai_or_reg_number': 'EDU-FOOD-90123',
            }
        )
        donor3.set_password('DonorPass123!')
        donor3.save()

        # Receiver 1: Hope Community Kitchen
        rec1, _ = CustomUser.objects.update_or_create(
            email='hopekitchen@reroute.ai',
            defaults={
                'role': CustomUser.Role.RECEIVER,
                'organization_name': 'Hope Community Kitchen & Shelter',
                'organization_type': CustomUser.OrganizationType.COMMUNITY_KITCHEN,
                'phone': '+1 (555) 019-3001',
                'address': '123 Mission Street, SoMa',
                'city': 'San Francisco',
                'latitude': 37.7915,
                'longitude': -122.3965,
                'is_verified': True,
                'fssai_or_reg_number': 'NGO-501C3-11827',
            }
        )
        rec1.set_password('ReceiverPass123!')
        rec1.save()
        rec1.profile.description = 'Providing 350+ warm nutritious meals daily to unhoused families, veterans, and low-income seniors.'
        rec1.profile.serving_capacity_meals = 350
        rec1.profile.has_transportation = True
        rec1.profile.vehicle_types = 'Temperature-Controlled Van, Cargo E-Bike'
        rec1.profile.average_rating = 5.0
        rec1.profile.total_reviews = 38
        rec1.profile.save()
        rec1.preferences.max_pickup_distance_km = 18.0
        rec1.preferences.daily_capacity_kg = 250.0
        rec1.preferences.accepts_cooked_meals = True
        rec1.preferences.accepts_bakery = True
        rec1.preferences.accepts_raw_produce = True
        rec1.preferences.save()

        # Receiver 2: City Care Food Bank
        rec2, _ = CustomUser.objects.update_or_create(
            email='cityfoodbank@reroute.ai',
            defaults={
                'role': CustomUser.Role.RECEIVER,
                'organization_name': 'City Care Regional Food Bank',
                'organization_type': CustomUser.OrganizationType.NGO,
                'phone': '+1 (555) 019-3002',
                'address': '900 Pennsylvania Avenue, Potrero Hill',
                'city': 'San Francisco',
                'latitude': 37.7550,
                'longitude': -122.3920,
                'is_verified': True,
                'fssai_or_reg_number': 'NGO-501C3-48190',
            }
        )
        rec2.set_password('ReceiverPass123!')
        rec2.save()
        rec2.profile.serving_capacity_meals = 600
        rec2.profile.storage_refrigerated_kg = 200.0
        rec2.profile.storage_dry_kg = 500.0
        rec2.profile.has_transportation = True
        rec2.profile.vehicle_types = '2x Heavy Transit Vans'
        rec2.profile.save()
        rec2.preferences.daily_capacity_kg = 400.0
        rec2.preferences.max_pickup_distance_km = 25.0
        rec2.preferences.save()

        # Receiver 3: Sanctuary Youth Shelter
        rec3, _ = CustomUser.objects.update_or_create(
            email='sanctuaryshelter@reroute.ai',
            defaults={
                'role': CustomUser.Role.RECEIVER,
                'organization_name': 'Sanctuary Youth & Family Shelter',
                'organization_type': CustomUser.OrganizationType.SHELTER,
                'phone': '+1 (555) 019-3003',
                'address': '245 Ellis Street, Tenderloin',
                'city': 'San Francisco',
                'latitude': 37.7852,
                'longitude': -122.4118,
                'is_verified': True,
                'fssai_or_reg_number': 'NGO-501C3-99381',
            }
        )
        rec3.set_password('ReceiverPass123!')
        rec3.save()
        rec3.preferences.daily_capacity_kg = 80.0
        rec3.preferences.max_pickup_distance_km = 10.0
        rec3.preferences.save()

        self.stdout.write(self.style.SUCCESS('Created/updated demo users (Admin, 3 Donors, 3 Receivers).'))

        # 3. Create Historical Preparation & Surplus Records for AI Forecasting (30 days of data!)
        now = timezone.now()
        today = now.date()

        cat_cooked = categories['Cooked Meals']
        cat_bakery = categories['Baked Goods']

        # Clear existing demo records
        FoodPreparationRecord.objects.filter(donor=donor1).delete()

        prep_records = []
        for days_back in range(30, 0, -1):
            rec_date = today - timedelta(days=days_back)
            dow = rec_date.weekday()
            is_wknd = dow in [5, 6]

            # Cooked meals: higher prep on weekends, surplus correlates with prepared
            base_prep = random.randint(140, 180) if is_wknd else random.randint(90, 130)
            served_pct = random.uniform(0.86, 0.94)
            served = int(base_prep * served_pct)
            surplus_portions = base_prep - served
            surplus_kg = round(surplus_portions * 0.45, 1)

            prep_records.append(FoodPreparationRecord(
                donor=donor1,
                category=cat_cooked,
                date=rec_date,
                day_of_week=dow,
                meals_prepared=base_prep,
                meals_served=served,
                surplus_quantity=surplus_kg,
                surplus_portions=surplus_portions,
                is_weekend=is_wknd,
                is_holiday_or_event=(dow == 4 or days_back % 11 == 0),
                notes='Standard dinner buffet service' if is_wknd else 'Weekday lunch & dinner service'
            ))

            # Bakery records
            b_prep = random.randint(70, 95) if is_wknd else random.randint(45, 65)
            b_served = int(b_prep * random.uniform(0.84, 0.92))
            b_surplus = b_prep - b_served
            b_kg = round(b_surplus * 0.35, 1)

            prep_records.append(FoodPreparationRecord(
                donor=donor1,
                category=cat_bakery,
                date=rec_date,
                day_of_week=dow,
                meals_prepared=b_prep,
                meals_served=b_served,
                surplus_quantity=b_kg,
                surplus_portions=b_surplus,
                is_weekend=is_wknd,
                is_holiday_or_event=False,
                notes='Morning pastry and bread baking'
            ))

        FoodPreparationRecord.objects.bulk_create(prep_records)
        self.stdout.write(self.style.SUCCESS(f'Created {len(prep_records)} historical preparation records for ML forecasting.'))

        # 4. Create Active Food Donations
        # Listing 1: Available Cooked Meals
        d1, _ = FoodDonation.objects.update_or_create(
            title='Warm Mediterranean Rice Bowls & Grilled Herb Veggies',
            defaults={
                'donor': donor1,
                'category': cat_cooked,
                'description': 'Freshly prepared catering surplus: organic brown rice bowls with roasted zucchini, bell peppers, chickpeas, and lemon tahini dressing. Held in commercial thermal food carriers.',
                'quantity': 18.5,
                'quantity_unit': 'kg',
                'estimated_meals': 40,
                'preparation_time': now - timedelta(hours=2),
                'expiry_time': now + timedelta(hours=10),
                'pickup_window_start': now + timedelta(minutes=30),
                'pickup_window_end': now + timedelta(hours=5),
                'dietary_type': FoodDonation.DietaryType.VEGAN,
                'allergens': 'Sesame (Tahini)',
                'storage_condition': FoodDonation.StorageCondition.HOT_HOLDING,
                'storage_temperature_celsius': 63.0,
                'packaging_details': 'Food-grade stainless insulated pans',
                'status': FoodDonation.Status.AVAILABLE,
                'pickup_address': donor1.address,
                'latitude': donor1.latitude,
                'longitude': donor1.longitude,
                'special_instructions': 'Enter via rear kitchen loading bay on Stevenson St. Ring kitchen bell.'
            }
        )

        # Listing 2: Available Artisan Bread & Pastries
        d2, _ = FoodDonation.objects.update_or_create(
            title='Artisan Sourdough Loaves, Croissants & Baguettes',
            defaults={
                'donor': donor2,
                'category': cat_bakery,
                'description': 'Baked fresh this morning. Includes 12 country sourdough boules, 20 butter croissants, and 8 whole grain baguettes.',
                'quantity': 14.0,
                'quantity_unit': 'kg',
                'estimated_meals': 32,
                'preparation_time': now - timedelta(hours=5),
                'expiry_time': now + timedelta(hours=36),
                'pickup_window_start': now + timedelta(hours=1),
                'pickup_window_end': now + timedelta(hours=8),
                'dietary_type': FoodDonation.DietaryType.VEG,
                'allergens': 'Gluten, Wheat, Dairy (Butter)',
                'storage_condition': FoodDonation.StorageCondition.AMBIENT,
                'packaging_details': 'Individual kraft paper bags packed in bakery crates',
                'status': FoodDonation.Status.AVAILABLE,
                'pickup_address': donor2.address,
                'latitude': donor2.latitude,
                'longitude': donor2.longitude,
                'special_instructions': 'Pick up directly at front counter. Ask for head baker Marco.'
            }
        )

        # Listing 3: Available Campus Produce
        d3, _ = FoodDonation.objects.update_or_create(
            title='Fresh Farm Apples, Citrus & Salad Greens Crate',
            defaults={
                'donor': donor3,
                'category': categories['Produce & Fresh Vegetables'],
                'description': 'Surplus produce delivered from regional farms: crisp Gala apples, navel oranges, romaine lettuce heads, and organic carrots.',
                'quantity': 35.0,
                'quantity_unit': 'kg',
                'estimated_meals': 65,
                'preparation_time': now - timedelta(hours=12),
                'expiry_time': now + timedelta(hours=72),
                'pickup_window_start': now + timedelta(hours=2),
                'pickup_window_end': now + timedelta(hours=12),
                'dietary_type': FoodDonation.DietaryType.VEGAN,
                'allergens': 'None',
                'storage_condition': FoodDonation.StorageCondition.AMBIENT,
                'packaging_details': 'Heavy duty stackable produce crates',
                'status': FoodDonation.Status.AVAILABLE,
                'pickup_address': donor3.address,
                'latitude': donor3.latitude,
                'longitude': donor3.longitude,
                'special_instructions': 'Security check-in at North Campus Gate. Present ReRoute QR/ID.'
            }
        )

        # Listing 4: Active Claim in READY_FOR_PICKUP state
        d4, _ = FoodDonation.objects.update_or_create(
            title='Hearty Lentil Soup & Steamed Jasmine Rice Portions',
            defaults={
                'donor': donor1,
                'category': cat_cooked,
                'description': 'Nutrient-rich spiced lentil and vegetable soup paired with fragrant jasmine rice. Ready in portioned meal boxes.',
                'quantity': 22.0,
                'quantity_unit': 'kg',
                'estimated_meals': 45,
                'preparation_time': now - timedelta(hours=3),
                'expiry_time': now + timedelta(hours=8),
                'pickup_window_start': now + timedelta(minutes=15),
                'pickup_window_end': now + timedelta(hours=4),
                'dietary_type': FoodDonation.DietaryType.VEGAN,
                'allergens': 'None',
                'storage_condition': FoodDonation.StorageCondition.HOT_HOLDING,
                'status': FoodDonation.Status.READY_FOR_PICKUP,
                'pickup_address': donor1.address,
                'latitude': donor1.latitude,
                'longitude': donor1.longitude,
            }
        )
        claim4, _ = DonationClaim.objects.update_or_create(
            donation=d4,
            defaults={
                'receiver': rec1,
                'status': DonationClaim.ClaimStatus.READY,
                'pickup_verification_code': '847291',
                'estimated_pickup_time': now + timedelta(minutes=45),
                'receiver_notes': 'Van driver David arriving around 15:30 in White Transit Van.'
            }
        )

        # Listing 5: Completed Donation with Impact and Reviews
        d5, _ = FoodDonation.objects.update_or_create(
            title='Gourmet Sandwich Platters & Fresh Fruit Salad',
            defaults={
                'donor': donor1,
                'category': cat_cooked,
                'description': 'Corporate conference lunch surplus: turkey club, caprese, and roast beef ciabatta sandwiches with side melon bowls.',
                'quantity': 28.0,
                'quantity_unit': 'kg',
                'estimated_meals': 60,
                'preparation_time': now - timedelta(days=2, hours=4),
                'expiry_time': now - timedelta(days=1, hours=20),
                'pickup_window_start': now - timedelta(days=2, hours=2),
                'pickup_window_end': now - timedelta(days=2),
                'dietary_type': FoodDonation.DietaryType.OTHER,
                'allergens': 'Gluten, Dairy',
                'storage_condition': FoodDonation.StorageCondition.REFRIGERATED,
                'status': FoodDonation.Status.COMPLETED,
                'pickup_address': donor1.address,
                'latitude': donor1.latitude,
                'longitude': donor1.longitude,
            }
        )
        claim5, _ = DonationClaim.objects.update_or_create(
            donation=d5,
            defaults={
                'receiver': rec1,
                'status': DonationClaim.ClaimStatus.COMPLETED,
                'pickup_verification_code': '193820',
                'is_code_verified': True,
                'actual_pickup_time': now - timedelta(days=2, hours=1),
                'completed_time': now - timedelta(days=2),
            }
        )
        ImpactRecord.calculate_for_donation(d5)

        # Mutual feedbacks
        Feedback.objects.update_or_create(
            donation=d5, reviewer=donor1,
            defaults={
                'reviewee': rec1,
                'rating': 5,
                'food_condition_rating': 5,
                'punctuality_rating': 5,
                'comment': 'Hope Kitchen arrived right on schedule with clean thermal carriers. Very professional team!'
            }
        )
        Feedback.objects.update_or_create(
            donation=d5, reviewer=rec1,
            defaults={
                'reviewee': donor1,
                'rating': 5,
                'food_condition_rating': 5,
                'punctuality_rating': 5,
                'comment': 'Outstanding food condition, beautifully packaged and labeled. Our shelter residents were deeply grateful.'
            }
        )

        # 5. In-App Notifications
        Notification.objects.create(
            user=donor1,
            title='Claim Ready for Pickup',
            message=f"Hope Community Kitchen confirmed pickup schedule for '{d4.title}'.",
            notification_type=Notification.NotificationType.READY_PICKUP,
            related_donation_id=d4.id
        )
        Notification.objects.create(
            user=rec1,
            title='Pickup Code Assigned',
            message=f"Your pickup OTP code for '{d4.title}' is 847291. Present this code to kitchen staff.",
            notification_type=Notification.NotificationType.CLAIM_ACCEPTED,
            related_donation_id=d4.id
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded ReRoute AI data!'))

