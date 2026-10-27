from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import (
    FoodCategory, FoodDonation, DonationImage,
    DonationClaim, DonationStatusHistory, Feedback
)

class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'

class DonationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationImage
        fields = ['id', 'image', 'caption', 'uploaded_at']

class DonationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.organization_name', read_only=True)

    class Meta:
        model = DonationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'changed_by_name', 'notes', 'created_at']

class DonationClaimSerializer(serializers.ModelSerializer):
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = DonationClaim
        fields = [
            'id', 'donation', 'receiver', 'status', 'claimed_at',
            'estimated_pickup_time', 'actual_pickup_time', 'completed_time',
            'pickup_verification_code', 'is_code_verified',
            'receiver_notes', 'cancellation_reason'
        ]
        read_only_fields = ['id', 'claimed_at', 'actual_pickup_time', 'completed_time', 'is_code_verified']

class FeedbackSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.organization_name', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.organization_name', read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'donation', 'reviewer', 'reviewer_name', 'reviewee',
            'reviewee_name', 'rating', 'food_condition_rating',
            'punctuality_rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at']

class FoodDonationListSerializer(serializers.ModelSerializer):
    category = FoodCategorySerializer(read_only=True)
    donor = UserSerializer(read_only=True)
    images = DonationImageSerializer(many=True, read_only=True)
    active_claim = serializers.SerializerMethodField()

    class Meta:
        model = FoodDonation
        fields = [
            'id', 'title', 'donor', 'category', 'description', 'quantity',
            'quantity_unit', 'estimated_meals', 'pickup_window_start',
            'pickup_window_end', 'expiry_time', 'dietary_type', 'allergens',
            'storage_condition', 'status', 'pickup_address', 'latitude',
            'longitude', 'images', 'created_at', 'active_claim'
        ]

    def get_active_claim(self, obj):
        if hasattr(obj, 'claim'):
            return {
                'id': obj.claim.id,
                'status': obj.claim.status,
                'receiver_name': obj.claim.receiver.organization_name or obj.claim.receiver.email,
                'receiver_id': obj.claim.receiver.id,
                'estimated_pickup_time': obj.claim.estimated_pickup_time
            }
        return None

class FoodDonationDetailSerializer(serializers.ModelSerializer):
    category = FoodCategorySerializer(read_only=True)
    donor = UserSerializer(read_only=True)
    images = DonationImageSerializer(many=True, read_only=True)
    claim = DonationClaimSerializer(read_only=True)
    status_history = DonationStatusHistorySerializer(many=True, read_only=True)
    feedbacks = FeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = FoodDonation
        fields = '__all__'

class FoodDonationCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodDonation
        fields = [
            'id', 'title', 'category', 'description', 'quantity', 'quantity_unit',
            'estimated_meals', 'preparation_time', 'expiry_time',
            'pickup_window_start', 'pickup_window_end', 'dietary_type',
            'allergens', 'storage_condition', 'storage_temperature_celsius',
            'packaging_details', 'pickup_address', 'latitude', 'longitude',
            'special_instructions'
        ]

    def validate(self, data):
        if data.get('pickup_window_start') and data.get('pickup_window_end'):
            if data['pickup_window_start'] >= data['pickup_window_end']:
                raise serializers.ValidationError({"pickup_window_end": "Pickup window end must be after start."})
        if data.get('expiry_time') and data.get('pickup_window_end'):
            if data['expiry_time'] < data['pickup_window_end']:
                raise serializers.ValidationError({"expiry_time": "Expiry time cannot precede pickup window end."})
        return data

class ClaimDonationSerializer(serializers.Serializer):
    estimated_pickup_time = serializers.DateTimeField(required=False)
    receiver_notes = serializers.CharField(required=False, allow_blank=True)

class VerifyPickupCodeSerializer(serializers.Serializer):
    verification_code = serializers.CharField(max_length=6, min_length=6)

