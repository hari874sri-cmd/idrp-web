from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Versioned API Endpoints (/api/v1/)
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/donations/', include('apps.donations.urls')),
    path('api/v1/forecasting/', include('apps.forecasting.urls')),
    path('api/v1/matching/', include('apps.matching.urls')),
    path('api/v1/ai/', include('apps.ai_assistant.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

from django.urls import path
from apps.health.views import health

urlpatterns = [
    # … existing routes …
    path("health/", health, name="health"),
]