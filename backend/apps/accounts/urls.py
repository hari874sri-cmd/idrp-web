from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, CurrentUserView,
    OrganizationProfileUpdateView, ReceiverPreferenceUpdateView,
    AdminUserListView, AdminVerifyUserView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('profile/', OrganizationProfileUpdateView.as_view(), name='user_profile'),
    path('preferences/', ReceiverPreferenceUpdateView.as_view(), name='receiver_preferences'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/verify/', AdminVerifyUserView.as_view(), name='admin_verify_user'),
]

