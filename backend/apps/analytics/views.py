from datetime import timedelta
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdminUserRole
from apps.donations.models import FoodDonation, FoodCategory, DonationClaim
from .models import ImpactRecord

class PlatformImpactAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Overall aggregates
        totals = ImpactRecord.objects.aggregate(
            total_meals=Sum('meals_redistributed'),
            total_kg=Sum('kilograms_redistributed'),
            total_co2_kg=Sum('co2_saved_kg'),
            total_water_liters=Sum('water_saved_liters'),
        )

        completed_count = FoodDonation.objects.filter(status=FoodDonation.Status.COMPLETED).count()
        active_count = FoodDonation.objects.filter(status=FoodDonation.Status.AVAILABLE).count()

        # Category breakdown
        category_breakdown = []
        for cat in FoodCategory.objects.all():
            cat_donations = FoodDonation.objects.filter(category=cat, status=FoodDonation.Status.COMPLETED)
            cat_kg = cat_donations.aggregate(Sum('quantity'))['quantity__sum'] or 0.0
            category_breakdown.append({
                'category_id': cat.id,
                'name': cat.name,
                'total_kg': round(cat_kg, 1),
                'donation_count': cat_donations.count()
            })

        # Monthly time series trend (last 6 months)
        now = timezone.now()
        monthly_trend = []
        for i in range(5, -1, -1):
            start_date = (now - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=30)
            month_label = start_date.strftime('%b %Y')

            records = ImpactRecord.objects.filter(recorded_at__gte=start_date, recorded_at__lt=end_date)
            m_agg = records.aggregate(
                kg=Sum('kilograms_redistributed'),
                meals=Sum('meals_redistributed'),
                co2=Sum('co2_saved_kg')
            )
            monthly_trend.append({
                'month': month_label,
                'kg_redistributed': round(m_agg['kg'] or 0, 1),
                'meals_served': m_agg['meals'] or 0,
                'co2_saved_kg': round(m_agg['co2'] or 0, 1),
            })

        return Response({
            "headline_metrics": {
                "total_completed_donations": completed_count,
                "active_available_listings": active_count,
                "total_meals_redistributed": totals['total_meals'] or 0,
                "total_kg_redistributed": round(totals['total_kg'] or 0.0, 1),
                "total_co2_saved_kg": round(totals['total_co2_kg'] or 0.0, 1),
                "total_water_saved_liters": round(totals['total_water_liters'] or 0.0, 1),
            },
            "category_distribution": category_breakdown,
            "monthly_trend": monthly_trend,
        }, status=status.HTTP_200_OK)


class AdminDashboardAnalyticsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        user_counts = {
            'total_users': CustomUser.objects.count(),
            'donors': CustomUser.objects.filter(role=CustomUser.Role.DONOR).count(),
            'receivers': CustomUser.objects.filter(role=CustomUser.Role.RECEIVER).count(),
            'admins': CustomUser.objects.filter(role=CustomUser.Role.ADMIN).count(),
            'pending_verifications': CustomUser.objects.filter(is_verified=False).exclude(role=CustomUser.Role.ADMIN).count(),
        }

        donation_counts = {
            'total_listings': FoodDonation.objects.count(),
            'available': FoodDonation.objects.filter(status=FoodDonation.Status.AVAILABLE).count(),
            'in_progress': FoodDonation.objects.filter(status__in=[
                FoodDonation.Status.REQUESTED, FoodDonation.Status.ACCEPTED,
                FoodDonation.Status.READY_FOR_PICKUP, FoodDonation.Status.PICKED_UP
            ]).count(),
            'completed': FoodDonation.objects.filter(status=FoodDonation.Status.COMPLETED).count(),
            'cancelled': FoodDonation.objects.filter(status=FoodDonation.Status.CANCELLED).count(),
            'expired': FoodDonation.objects.filter(status=FoodDonation.Status.EXPIRED).count(),
        }

        recent_claims = DonationClaim.objects.select_related('donation', 'receiver').order_by('-claimed_at')[:10]
        claims_data = [{
            'id': c.id,
            'donation_title': c.donation.title,
            'receiver': c.receiver.organization_name or c.receiver.email,
            'donor': c.donation.donor.organization_name or c.donation.donor.email,
            'status': c.status,
            'claimed_at': c.claimed_at,
        } for c in recent_claims]

        return Response({
            "users": user_counts,
            "donations": donation_counts,
            "recent_claims": claims_data
        }, status=status.HTTP_200_OK)

