from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, OrganizationProfile, ReceiverPreference

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'description', 'contact_person', 'operating_hours',
            'storage_refrigerated_kg', 'storage_frozen_kg', 'storage_dry_kg',
            'serving_capacity_meals', 'has_transportation', 'vehicle_types',
            'average_rating', 'total_reviews'
        ]

class ReceiverPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiverPreference
        fields = [
            'id', 'max_pickup_distance_km', 'accepts_cooked_meals',
            'accepts_raw_produce', 'accepts_bakery', 'accepts_dairy',
            'accepts_packaged', 'allergens_to_exclude',
            'dietary_vegetarian_only', 'dietary_halal_only',
            'daily_capacity_kg'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = OrganizationProfileSerializer(read_only=True)
    preferences = ReceiverPreferenceSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'role', 'organization_name', 'organization_type',
            'phone', 'address', 'city', 'postal_code', 'latitude', 'longitude',
            'is_verified', 'fssai_or_reg_number', 'avatar', 'created_at',
            'profile', 'preferences'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'password_confirm', 'role',
            'organization_name', 'organization_type', 'phone',
            'address', 'city', 'latitude', 'longitude', 'fssai_or_reg_number'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['organization_name'] = user.organization_name
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

