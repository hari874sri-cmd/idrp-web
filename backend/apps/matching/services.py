import math
from datetime import datetime
from django.utils import timezone
from apps.accounts.models import CustomUser, ReceiverPreference
from apps.donations.models import FoodDonation

def haversine_distance(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 999.0  # Unknown distance fallback
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class RecipientMatchingEngine:
    """
    Intelligent multi-factor scoring engine for recipient recommendation.
    Combines rule-based safety validation with weighted algorithmic scoring.
    """
    WEIGHTS = {
        'distance': 0.30,
        'capacity': 0.25,
        'category_compatibility': 0.20,
        'urgency_and_timing': 0.15,
        'verification': 0.10
    }

    @classmethod
    def recommend_recipients(cls, donation: FoodDonation, max_results=5):
        # Find all active receiver organizations
        receivers = CustomUser.objects.filter(
            role=CustomUser.Role.RECEIVER,
            is_active=True
        ).select_related('profile', 'preferences')

        scored_candidates = []

        d_lat = donation.latitude or (donation.donor.latitude if donation.donor else None)
        d_lon = donation.longitude or (donation.donor.longitude if donation.donor else None)
        cat_name = donation.category.name.lower()
        declared_allergens = [a.strip().lower() for a in donation.allergens.split(',') if a.strip()]

        now = timezone.now()
        hours_until_expiry = max(0.5, (donation.pickup_window_end - now).total_seconds() / 3600.0)

        for receiver in receivers:
            pref = getattr(receiver, 'preferences', None)
            profile = getattr(receiver, 'profile', None)

            # 1. HARD SAFETY CHECK: Allergen avoidance
            if pref and pref.allergens_to_exclude:
                excluded = [a.strip().lower() for a in pref.allergens_to_exclude.split(',') if a.strip()]
                conflict = any(allergen in excluded for allergen in declared_allergens)
                if conflict:
                    # Skip incompatible receiver due to declared allergen conflict
                    continue

            # 2. HARD SAFETY CHECK: Vegetarian constraint
            if pref and pref.dietary_vegetarian_only and donation.dietary_type == FoodDonation.DietaryType.NON_VEG:
                continue

            # 3. Factor: Distance Score (0-100)
            r_lat = receiver.latitude
            r_lon = receiver.longitude
            dist_km = haversine_distance(d_lat, d_lon, r_lat, r_lon)
            
            max_dist = pref.max_pickup_distance_km if pref else 15.0
            if dist_km <= max_dist:
                dist_score = max(0, 100 - (dist_km / max_dist) * 80)
            else:
                dist_score = max(5, 100 - (dist_km / max_dist) * 95)

            # 4. Factor: Capacity Score (0-100)
            daily_cap = pref.daily_capacity_kg if pref else 100.0
            ratio = donation.quantity / daily_cap if daily_cap > 0 else 0.5
            if 0.1 <= ratio <= 0.8:
                cap_score = 100.0  # Perfect fit for daily volume
            elif ratio <= 1.0:
                cap_score = 80.0
            else:
                cap_score = max(20.0, 100.0 - (ratio - 1.0) * 50)

            # 5. Factor: Category Compatibility Score (0-100)
            compat_score = 85.0
            if pref:
                if 'cooked' in cat_name and not pref.accepts_cooked_meals:
                    compat_score = 10.0
                elif 'bakery' in cat_name and not pref.accepts_bakery:
                    compat_score = 10.0
                elif 'produce' in cat_name and not pref.accepts_raw_produce:
                    compat_score = 10.0
                elif 'dairy' in cat_name and not pref.accepts_dairy:
                    compat_score = 10.0
                elif 'package' in cat_name and not pref.accepts_packaged:
                    compat_score = 10.0

            # 6. Factor: Urgency & Timing (0-100)
            # High score if receiver has transport and urgency is high
            has_transport = profile.has_transportation if profile else True
            if hours_until_expiry < 4:
                urgency_score = 95.0 if has_transport and dist_km < 8.0 else 40.0
            elif hours_until_expiry < 12:
                urgency_score = 90.0 if has_transport else 70.0
            else:
                urgency_score = 80.0

            # 7. Factor: Verification Score (0-100)
            verif_score = 100.0 if receiver.is_verified else 50.0

            # Calculate total weighted score
            total_score = (
                dist_score * cls.WEIGHTS['distance'] +
                cap_score * cls.WEIGHTS['capacity'] +
                compat_score * cls.WEIGHTS['category_compatibility'] +
                urgency_score * cls.WEIGHTS['urgency_and_timing'] +
                verif_score * cls.WEIGHTS['verification']
            )

            total_score = round(total_score, 1)

            # Estimated transit time
            est_transit_minutes = int(dist_km * 2.5 + 10) if dist_km < 999 else None

            # Generate structured rationale
            reasons = []
            if dist_km < 5.0:
                reasons.append(f"Located only {dist_km} km away")
            elif dist_km < 12.0:
                reasons.append(f"Within comfortable transit radius ({dist_km} km)")
            
            if receiver.is_verified:
                reasons.append("Verified organization with compliant food safety credentials")
            
            if has_transport:
                reasons.append(f"Equipped with private pickup transport ({profile.vehicle_types if profile else 'Van'})")

            if cap_score >= 80.0:
                reasons.append(f"Capacity matches required donation load ({donation.quantity}{donation.quantity_unit})")

            scored_candidates.append({
                'receiver_id': receiver.id,
                'organization_name': receiver.organization_name or receiver.email,
                'organization_type': receiver.get_organization_type_display(),
                'is_verified': receiver.is_verified,
                'phone': receiver.phone,
                'address': receiver.address,
                'distance_km': dist_km,
                'estimated_transit_minutes': est_transit_minutes,
                'overall_score': total_score,
                'breakdown': {
                    'distance_score': round(dist_score, 1),
                    'capacity_score': round(cap_score, 1),
                    'compatibility_score': round(compat_score, 1),
                    'urgency_score': round(urgency_score, 1),
                    'verification_score': round(verif_score, 1),
                },
                'primary_reasons': reasons,
                'generated_explanation': f"Top match: {receiver.organization_name} is located {dist_km}km from your kitchen with active verified capacity to redistribute {donation.quantity}{donation.quantity_unit} of {donation.category.name}."
            })

        scored_candidates.sort(key=lambda x: x['overall_score'], reverse=True)
        return scored_candidates[:max_results]

