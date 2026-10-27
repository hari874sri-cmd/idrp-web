from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser, OrganizationProfile, ReceiverPreference
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    OrganizationProfileSerializer, ReceiverPreferenceSerializer
)
from .permissions import IsAdminUserRole

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class OrganizationProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = OrganizationProfile.objects.get_or_create(user=self.request.user)
        return profile

class ReceiverPreferenceUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ReceiverPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pref, _ = ReceiverPreference.objects.get_or_create(receiver=self.request.user)
        return pref

class AdminUserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
    filterset_fields = ['role', 'is_verified', 'organization_type']

class AdminVerifyUserView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.is_verified = not user.is_verified
            user.save()
            return Response({
                "message": f"User verification status updated to {user.is_verified}",
                "is_verified": user.is_verified
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

