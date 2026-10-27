from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.donations.models import FoodDonation, FoodCategory
from .services import RecipientMatchingEngine

class RecipientRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donation_id = request.query_params.get('donation_id')
        if not donation_id:
            return Response({"error": "donation_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            donation = FoodDonation.objects.select_related('donor', 'category').get(pk=donation_id)
        except FoodDonation.DoesNotExist:
            return Response({"error": "Donation not found."}, status=status.HTTP_404_NOT_FOUND)

        recommendations = RecipientMatchingEngine.recommend_recipients(donation)
        return Response({
            "donation_id": donation.id,
            "donation_title": donation.title,
            "quantity": f"{donation.quantity} {donation.quantity_unit}",
            "recommendations": recommendations,
            "algorithm": "ReRoute AI Transparent Multi-Factor Recipient Engine v1.0",
        }, status=status.HTTP_200_OK)

