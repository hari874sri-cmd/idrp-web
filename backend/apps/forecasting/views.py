from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsDonorUser
from .models import FoodPreparationRecord
from .serializers import FoodPreparationRecordSerializer
from .services import SurplusForecastingEngine

class FoodPreparationRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodPreparationRecordSerializer
    permission_classes = [IsDonorUser]

    def get_queryset(self):
        return FoodPreparationRecord.objects.filter(donor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)

class FoodPreparationRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodPreparationRecordSerializer
    permission_classes = [IsDonorUser]

    def get_queryset(self):
        return FoodPreparationRecord.objects.filter(donor=self.request.user)

class SurplusForecastView(APIView):
    permission_classes = [IsDonorUser]

    def get(self, request):
        category_id = request.query_params.get('category')
        days = int(request.query_params.get('days', 7))
        forecasts = SurplusForecastingEngine.train_and_forecast(
            donor=request.user,
            category_id=category_id,
            days_ahead=min(days, 14)
        )
        return Response({
            "forecasts": forecasts,
            "disclaimer": "Forecasts are statistical projections based on historical logs. Always verify with actual kitchen counts before purchasing or meal staging."
        }, status=status.HTTP_200_OK)

