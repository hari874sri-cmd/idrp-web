from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsDonorUser
from .services import AIAssistantFactory

class FoodListingAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        notes = request.data.get('notes', '')

        provider = AIAssistantFactory.get_provider()
        analysis = provider.analyze_food_image(image_file, notes)

        return Response(analysis, status=status.HTTP_200_OK)

