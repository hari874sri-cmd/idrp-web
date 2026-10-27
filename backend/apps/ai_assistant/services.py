import os
import json
from abc import ABC, abstractmethod
from django.conf import settings
from apps.donations.models import FoodCategory

class BaseAIProvider(ABC):
    @abstractmethod
    def analyze_food_image(self, image_file, user_notes=""):
        pass

class DemoAIProvider(BaseAIProvider):
    """
    Deterministic offline demo provider that provides realistic suggestions
    without requiring external API keys or network access.
    """
    def analyze_food_image(self, image_file, user_notes=""):
        filename = getattr(image_file, 'name', '').lower() if image_file else ""
        notes = (user_notes or "").lower()

        # Heuristic inference from filename or notes
        if any(w in filename or w in notes for w in ['bread', 'croissant', 'cake', 'pastry', 'bakery', 'bagel']):
            cat = "Baked Goods"
            title = "Fresh Assorted Bakery Loaves & Viennoiserie"
            desc = "Surplus artisan bread loaves, baguettes, and fresh morning pastries from today's batch. Individually wrapped or boxed."
            qty_range = "8 - 14 kg (approx. 20-30 portions)"
            tags = ["Bakery", "Vegetarian", "Ambient", "Day-Fresh"]
            prep_hrs_ago = 4
        elif any(w in filename or w in notes for w in ['rice', 'curry', 'pasta', 'meal', 'biryani', 'cooked', 'soup']):
            cat = "Cooked Meals"
            title = "Prepared Hot Meal Trays (Rice & Curry)"
            desc = "Nutritious freshly cooked meal trays packaged in food-grade thermal containers. Prepared in certified commercial kitchen."
            qty_range = "15 - 25 kg (approx. 35-50 meals)"
            tags = ["Cooked Meals", "Hot Food", "High Protein", "Immediate Pickup"]
            prep_hrs_ago = 2
        elif any(w in filename or w in notes for w in ['apple', 'fruit', 'veg', 'salad', 'tomato', 'produce']):
            cat = "Produce & Fresh Vegetables"
            title = "Assorted Farm Produce & Seasonal Fresh Vegetables"
            desc = "Crisp fresh vegetables and ripe seasonal fruits sorted from surplus inventory. Ideal for community pantry distribution."
            qty_range = "20 - 35 kg (approx. 40-70 meals)"
            tags = ["Produce", "Raw", "Vegan", "Vitamin-Rich"]
            prep_hrs_ago = 6
        elif any(w in filename or w in notes for w in ['milk', 'cheese', 'yogurt', 'dairy', 'egg']):
            cat = "Dairy & Eggs"
            title = "Refrigerated Dairy Packets & Yogurt Cups"
            desc = "Cold-chain stored dairy items with sealed packaging and several days remaining before best-by date."
            qty_range = "10 - 18 kg (approx. 25-45 portions)"
            tags = ["Dairy", "Cold Chain Required", "Sealed", "High Calcium"]
            prep_hrs_ago = 8
        else:
            cat = "Cooked Meals"
            title = "Wholesome Surplus Catering Meal Portions"
            desc = "Surplus food from institutional catering, safely held at temperature and packaged for immediate community kitchen distribution."
            qty_range = "12 - 20 kg (approx. 25-40 meals)"
            tags = ["Catering Surplus", "Packaged", "Immediate Redistribution"]
            prep_hrs_ago = 3

        # Match category object
        category_obj = FoodCategory.objects.filter(name__icontains=cat.split()[0]).first()
        category_id = category_obj.id if category_obj else 1

        return {
            "provider": "Demo Fallback Mode (Deterministic Assistant)",
            "is_demo_mode": True,
            "category_id": category_id,
            "suggested_category": cat,
            "suggested_title": title,
            "suggested_description": desc,
            "estimated_quantity_range": qty_range,
            "suggested_dietary": "VEG",
            "suggested_tags": tags,
            "suggested_prep_hours_ago": prep_hrs_ago,
            "missing_information_checklist": [
                {"field": "exact_quantity", "label": "Exact weight or portion count (measured by donor)"},
                {"field": "allergens", "label": "Full allergen disclosure (e.g. Dairy, Nuts, Gluten)"},
                {"field": "storage_condition", "label": "Storage condition (Ambient, Refrigerated, or Frozen)"},
                {"field": "pickup_deadline", "label": "Safe pickup window deadline (within food safety parameters)"}
            ],
            "safety_disclaimer": "CRITICAL FOOD SAFETY NOTICE: Visual analysis cannot establish microbial safety, storage temperature compliance, internal freshness, or undeclared allergens. Every item must be verified and confirmed by the donor before publishing."
        }

class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def analyze_food_image(self, image_file, user_notes=""):
        # If API call fails or key is empty, smoothly fallback to DemoAIProvider
        if not self.api_key:
            return DemoAIProvider().analyze_food_image(image_file, user_notes)
        try:
            # We would invoke Gemini API here; if network or quota fails, return Demo
            return DemoAIProvider().analyze_food_image(image_file, user_notes)
        except Exception:
            return DemoAIProvider().analyze_food_image(image_file, user_notes)

class AIAssistantFactory:
    @staticmethod
    def get_provider() -> BaseAIProvider:
        provider_name = getattr(settings, 'AI_PROVIDER', 'demo').lower()
        gemini_key = getattr(settings, 'GEMINI_API_KEY', '')

        if provider_name == 'gemini' and gemini_key:
            return GeminiAIProvider(gemini_key)
        return DemoAIProvider()

