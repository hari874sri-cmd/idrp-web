import math
from datetime import datetime
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsDonorUser, IsReceiverUser, IsAdminUserRole
from apps.notifications.models import Notification
from .models import (
    FoodCategory, FoodDonation, DonationImage,
    DonationClaim, DonationStatusHistory, Feedback
)
from .serializers import (
    FoodCategorySerializer, FoodDonationListSerializer,
    FoodDonationDetailSerializer, FoodDonationCreateUpdateSerializer,
    DonationImageSerializer, DonationClaimSerializer,
    ClaimDonationSerializer, VerifyPickupCodeSerializer,
    FeedbackSerializer
)

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Haversine formula to calculate great-circle distance between two coordinates in km."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class FoodCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

class FoodDonationViewSet(viewsets.ModelViewSet):
    queryset = FoodDonation.objects.all().select_related('donor', 'category').prefetch_related('images', 'claim')
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ['list']:
            return FoodDonationListSerializer
        elif self.action in ['retrieve']:
            return FoodDonationDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return FoodDonationCreateUpdateSerializer
        return FoodDonationDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'marketplace']:
            return [permissions.AllowAny()]
        elif self.action in ['create']:
            return [IsDonorUser()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['claim']:
            return [IsReceiverUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        lat = serializer.validated_data.get('latitude') or user.latitude
        lon = serializer.validated_data.get('longitude') or user.longitude
        addr = serializer.validated_data.get('pickup_address') or user.address or "Address on file"
        
        donation = serializer.save(
            donor=user,
            latitude=lat,
            longitude=lon,
            pickup_address=addr
        )

        DonationStatusHistory.objects.create(
            donation=donation,
            from_status='NONE',
            to_status=FoodDonation.Status.AVAILABLE,
            changed_by=user,
            notes='Donation created and published to marketplace.'
        )

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Check expired items and update their status automatically
        now = timezone.now()
        FoodDonation.objects.filter(
            status=FoodDonation.Status.AVAILABLE,
            pickup_window_end__lt=now
        ).update(status=FoodDonation.Status.EXPIRED)

        # Filters
        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        dietary = self.request.query_params.get('dietary')
        search = self.request.query_params.get('search')
        my_listings = self.request.query_params.get('my_listings')

        if my_listings and self.request.user.is_authenticated:
            if self.request.user.role == CustomUser.Role.DONOR:
                qs = qs.filter(donor=self.request.user)
            elif self.request.user.role == CustomUser.Role.RECEIVER:
                qs = qs.filter(claim__receiver=self.request.user)

        if category:
            qs = qs.filter(category_id=category)
        if status_param:
            qs = qs.filter(status=status_param)
        if dietary:
            qs = qs.filter(dietary_type=dietary)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(description__icontains=search)

        return qs

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def marketplace(self, request):
        """Active available donations list with optional proximity distance sorting."""
        now = timezone.now()
        qs = FoodDonation.objects.filter(
            status=FoodDonation.Status.AVAILABLE,
            pickup_window_end__gt=now
        ).select_related('donor', 'category').prefetch_related('images')

        user_lat = request.query_params.get('lat')
        user_lon = request.query_params.get('lon')
        category_id = request.query_params.get('category')
        urgency = request.query_params.get('urgency') # 'expiring_soon'

        if category_id:
            qs = qs.filter(category_id=category_id)
        if urgency == 'expiring_soon':
            # Expiring within next 6 hours
            qs = qs.filter(pickup_window_end__lte=now + timezone.timedelta(hours=6))

        page = self.paginate_queryset(qs)
        serializer = FoodDonationListSerializer(page or qs, many=True)
        data = serializer.data

        # Add distance if coordinates provided
        if user_lat and user_lon:
            try:
                ulat = float(user_lat)
                ulon = float(user_lon)
                for item in data:
                    item['distance_km'] = calculate_distance_km(ulat, ulon, item.get('latitude'), item.get('longitude'))
                data.sort(key=lambda x: (x.get('distance_km') is None, x.get('distance_km') or 99999))
            except ValueError:
                pass

        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsReceiverUser])
    def claim(self, request, pk=None):
        """
        Transactional claim endpoint with row-level locking (select_for_update)
        to strictly prevent race conditions and double claims.
        """
        claim_serializer = ClaimDonationSerializer(data=request.data)
        claim_serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Lock the donation row
            try:
                donation = FoodDonation.objects.select_for_update().get(pk=pk)
            except FoodDonation.DoesNotExist:
                return Response({"error": "Donation not found."}, status=status.HTTP_404_NOT_FOUND)

            if donation.status != FoodDonation.Status.AVAILABLE:
                return Response(
                    {"error": f"Donation is no longer available. Current status: {donation.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if hasattr(donation, 'claim'):
                return Response(
                    {"error": "This donation is already claimed by another receiver."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            now = timezone.now()
            if donation.pickup_window_end < now:
                donation.status = FoodDonation.Status.EXPIRED
                donation.save()
                return Response({"error": "This donation has expired."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the claim
            est_time = claim_serializer.validated_data.get('estimated_pickup_time')
            notes = claim_serializer.validated_data.get('receiver_notes', '')

            claim = DonationClaim.objects.create(
                donation=donation,
                receiver=request.user,
                status=DonationClaim.ClaimStatus.REQUESTED,
                estimated_pickup_time=est_time,
                receiver_notes=notes
            )

            # Update donation status
            prev_status = donation.status
            donation.status = FoodDonation.Status.REQUESTED
            donation.save()

            # Record status history
            DonationStatusHistory.objects.create(
                donation=donation,
                from_status=prev_status,
                to_status=FoodDonation.Status.REQUESTED,
                changed_by=request.user,
                notes=f"Claim requested by {request.user.organization_name or request.user.email}."
            )

            # Send Notification to Donor
            Notification.objects.create(
                user=donation.donor,
                title="New Donation Claim Request",
                message=f"{request.user.organization_name} has requested to claim '{donation.title}'.",
                notification_type=Notification.NotificationType.CLAIM_REQUEST,
                related_donation_id=donation.id
            )

            return Response({
                "message": "Donation claim submitted successfully.",
                "claim": DonationClaimSerializer(claim).data
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Manage state transitions:
        - ACCEPTED (Donor accepts claim)
        - READY_FOR_PICKUP (Donor readies food)
        - PICKED_UP (Requires OTP verification)
        - COMPLETED (Food received & distributed)
        - CANCELLED (By Donor or Receiver)
        """
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        verification_code = request.data.get('verification_code', '')

        with transaction.atomic():
            try:
                donation = FoodDonation.objects.select_for_update().get(pk=pk)
            except FoodDonation.DoesNotExist:
                return Response({"error": "Donation not found."}, status=status.HTTP_404_NOT_FOUND)

            user = request.user
            is_donor = donation.donor == user
            has_claim = hasattr(donation, 'claim')
            is_receiver = has_claim and (donation.claim.receiver == user)
            is_admin = user.role == CustomUser.Role.ADMIN or user.is_superuser

            if not (is_donor or is_receiver or is_admin):
                return Response({"error": "You do not have permission to update this donation."}, status=status.HTTP_403_FORBIDDEN)

            prev_status = donation.status

            if new_status == FoodDonation.Status.ACCEPTED:
                if not (is_donor or is_admin):
                    return Response({"error": "Only donor can accept claims."}, status=status.HTTP_403_FORBIDDEN)
                if not has_claim:
                    return Response({"error": "No claim exists to accept."}, status=status.HTTP_400_BAD_REQUEST)
                donation.status = FoodDonation.Status.ACCEPTED
                donation.claim.status = DonationClaim.ClaimStatus.ACCEPTED
                donation.claim.save()
                
                # Notify receiver with their pickup OTP code
                Notification.objects.create(
                    user=donation.claim.receiver,
                    title="Claim Accepted!",
                    message=f"Your claim for '{donation.title}' was accepted. Pickup OTP: {donation.claim.pickup_verification_code}",
                    notification_type=Notification.NotificationType.CLAIM_ACCEPTED,
                    related_donation_id=donation.id
                )

            elif new_status == FoodDonation.Status.READY_FOR_PICKUP:
                if not (is_donor or is_admin):
                    return Response({"error": "Only donor can mark donation ready for pickup."}, status=status.HTTP_403_FORBIDDEN)
                donation.status = FoodDonation.Status.READY_FOR_PICKUP
                if has_claim:
                    donation.claim.status = DonationClaim.ClaimStatus.READY
                    donation.claim.save()
                    Notification.objects.create(
                        user=donation.claim.receiver,
                        title="Food Ready For Pickup",
                        message=f"'{donation.title}' is packaged and ready for pickup at {donation.pickup_address}.",
                        notification_type=Notification.NotificationType.READY_PICKUP,
                        related_donation_id=donation.id
                    )

            elif new_status == FoodDonation.Status.PICKED_UP:
                # Requires verification OTP entered by donor (given by receiver) or vice-versa
                if not has_claim:
                    return Response({"error": "No claim to pick up."}, status=status.HTTP_400_BAD_REQUEST)
                
                if verification_code and verification_code.strip() == donation.claim.pickup_verification_code:
                    donation.claim.is_code_verified = True
                elif not is_admin:
                    return Response({"error": "Invalid or missing pickup verification code."}, status=status.HTTP_400_BAD_REQUEST)
                
                donation.status = FoodDonation.Status.PICKED_UP
                donation.claim.status = DonationClaim.ClaimStatus.PICKED_UP
                donation.claim.actual_pickup_time = timezone.now()
                donation.claim.save()

            elif new_status == FoodDonation.Status.COMPLETED:
                donation.status = FoodDonation.Status.COMPLETED
                if has_claim:
                    donation.claim.status = DonationClaim.ClaimStatus.COMPLETED
                    donation.claim.completed_time = timezone.now()
                    donation.claim.save()

            elif new_status == FoodDonation.Status.CANCELLED:
                cancellation_reason = request.data.get('cancellation_reason', 'Cancelled by user')
                donation.status = FoodDonation.Status.CANCELLED
                if has_claim:
                    donation.claim.status = DonationClaim.ClaimStatus.CANCELLED
                    donation.claim.cancellation_reason = cancellation_reason
                    donation.claim.save()
            else:
                return Response({"error": f"Invalid status transition to '{new_status}'."}, status=status.HTTP_400_BAD_REQUEST)

            donation.save()

            # Record audit history
            DonationStatusHistory.objects.create(
                donation=donation,
                from_status=prev_status,
                to_status=donation.status,
                changed_by=user,
                notes=notes or f"Status updated to {donation.status}"
            )

            return Response({
                "message": f"Status updated to {donation.status}.",
                "donation": FoodDonationDetailSerializer(donation).data
            }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        donation = self.get_object()
        if donation.donor != request.user and not request.user.is_superuser:
            return Response({"error": "Only the donor can upload images."}, status=status.HTTP_403_FORBIDDEN)
        
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({"error": "Image file too large. Max allowed is 5MB."}, status=status.HTTP_400_BAD_REQUEST)

        image_obj = DonationImage.objects.create(
            donation=donation,
            image=image_file,
            caption=request.data.get('caption', '')
        )
        return Response(DonationImageSerializer(image_obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def feedback(self, request, pk=None):
        donation = self.get_object()
        user = request.user

        if donation.status != FoodDonation.Status.COMPLETED:
            return Response({"error": "Feedback can only be submitted after donation is completed."}, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(donation, 'claim'):
            return Response({"error": "Donation had no receiver claim."}, status=status.HTTP_400_BAD_REQUEST)

        is_donor = donation.donor == user
        is_receiver = donation.claim.receiver == user

        if not (is_donor or is_receiver):
            return Response({"error": "Only participants can review this donation."}, status=status.HTTP_403_FORBIDDEN)

        reviewee = donation.claim.receiver if is_donor else donation.donor

        if Feedback.objects.filter(donation=donation, reviewer=user).exists():
            return Response({"error": "You have already submitted feedback for this donation."}, status=status.HTTP_400_BAD_REQUEST)

        rating = int(request.data.get('rating', 5))
        food_rating = int(request.data.get('food_condition_rating', 5))
        punctuality = int(request.data.get('punctuality_rating', 5))
        comment = request.data.get('comment', '')

        feedback = Feedback.objects.create(
            donation=donation,
            reviewer=user,
            reviewee=reviewee,
            rating=rating,
            food_condition_rating=food_rating,
            punctuality_rating=punctuality,
            comment=comment
        )

        # Update reviewee average rating
        feedbacks = Feedback.objects.filter(reviewee=reviewee)
        avg_rating = sum(f.rating for f in feedbacks) / feedbacks.count()
        profile = getattr(reviewee, 'profile', None)
        if profile:
            profile.average_rating = round(avg_rating, 2)
            profile.total_reviews = feedbacks.count()
            profile.save()

        return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)

