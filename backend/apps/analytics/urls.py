from django.urls import path
from .views import PlatformImpactAnalyticsView, AdminDashboardAnalyticsView

urlpatterns = [
    path('impact/', PlatformImpactAnalyticsView.as_view(), name='platform_impact'),
    path('admin-summary/', AdminDashboardAnalyticsView.as_view(), name='admin_summary'),
]

