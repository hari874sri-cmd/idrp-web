export type UserRole = 'DONOR' | 'RECEIVER' | 'ADMIN';

export type OrganizationType = 
  | 'RESTAURANT'
  | 'BAKERY'
  | 'GROCERY'
  | 'CANTEEN'
  | 'NGO'
  | 'COMMUNITY_KITCHEN'
  | 'SHELTER'
  | 'OTHER';

export type DonationStatus = 
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type DietaryType = 'VEG' | 'NON_VEG' | 'VEGAN' | 'HALAL' | 'KOSHER' | 'OTHER';
export type StorageCondition = 'AMBIENT' | 'REFRIGERATED' | 'FROZEN' | 'HOT_HOLDING';

export interface OrganizationProfile {
  id: number;
  description: string;
  contact_person: string;
  operating_hours: string;
  storage_refrigerated_kg: number;
  storage_frozen_kg: number;
  storage_dry_kg: number;
  serving_capacity_meals: number;
  has_transportation: boolean;
  vehicle_types: string;
  average_rating: number;
  total_reviews: number;
}

export interface ReceiverPreference {
  id: number;
  max_pickup_distance_km: number;
  accepts_cooked_meals: boolean;
  accepts_raw_produce: boolean;
  accepts_bakery: boolean;
  accepts_dairy: boolean;
  accepts_packaged: boolean;
  allergens_to_exclude: string;
  dietary_vegetarian_only: boolean;
  dietary_halal_only: boolean;
  daily_capacity_kg: number;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  organization_name: string;
  organization_type: OrganizationType;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  fssai_or_reg_number: string;
  avatar: string | null;
  profile?: OrganizationProfile;
  preferences?: ReceiverPreference;
}

export interface FoodCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  perishability_hours: number;
  storage_requirement: string;
}

export interface DonationImage {
  id: number;
  image: string;
  caption: string;
  uploaded_at: string;
}

export interface DonationClaim {
  id: number;
  donation: number;
  receiver: User;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'READY' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';
  claimed_at: string;
  estimated_pickup_time: string | null;
  actual_pickup_time: string | null;
  completed_time: string | null;
  pickup_verification_code: string;
  is_code_verified: boolean;
  receiver_notes: string;
  cancellation_reason: string;
}

export interface DonationStatusHistory {
  id: number;
  from_status: string;
  to_status: string;
  changed_by: number | null;
  changed_by_name?: string;
  notes: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  donation: number;
  reviewer: number;
  reviewer_name: string;
  reviewee: number;
  reviewee_name: string;
  rating: number;
  food_condition_rating: number;
  punctuality_rating: number;
  comment: string;
  created_at: string;
}

export interface FoodDonation {
  id: number;
  title: string;
  donor: User;
  category: FoodCategory;
  description: string;
  quantity: number;
  quantity_unit: string;
  estimated_meals: number;
  preparation_time?: string;
  expiry_time: string;
  pickup_window_start: string;
  pickup_window_end: string;
  dietary_type: DietaryType;
  allergens: string;
  storage_condition: StorageCondition;
  storage_temperature_celsius?: number;
  packaging_details?: string;
  status: DonationStatus;
  pickup_address: string;
  latitude: number | null;
  longitude: number | null;
  special_instructions?: string;
  images: DonationImage[];
  claim?: DonationClaim;
  active_claim?: {
    id: number;
    status: string;
    receiver_name: string;
    receiver_id: number;
    estimated_pickup_time: string | null;
  };
  status_history?: DonationStatusHistory[];
  feedbacks?: Feedback[];
  created_at: string;
  distance_km?: number;
}

export interface DailyForecast {
  date: string;
  day_name: string;
  predicted_surplus_kg: number;
  uncertainty_lower_kg: number;
  uncertainty_upper_kg: number;
  confidence: number;
  model_type: string;
  top_factors: Record<string, number>;
}

export interface CategoryForecast {
  category_id: number;
  category_name: string;
  sample_count: number;
  is_ml_trained: boolean;
  daily_forecasts: DailyForecast[];
  waste_reduction_tips: string[];
}

export interface RecipientRecommendation {
  receiver_id: number;
  organization_name: string;
  organization_type: string;
  is_verified: boolean;
  phone: string;
  address: string;
  distance_km: number;
  estimated_transit_minutes: number | null;
  overall_score: number;
  breakdown: {
    distance_score: number;
    capacity_score: number;
    compatibility_score: number;
    urgency_score: number;
    verification_score: number;
  };
  primary_reasons: string[];
  generated_explanation: string;
}

export interface PlatformImpact {
  headline_metrics: {
    total_completed_donations: number;
    active_available_listings: number;
    total_meals_redistributed: number;
    total_kg_redistributed: number;
    total_co2_saved_kg: number;
    total_water_saved_liters: number;
  };
  category_distribution: {
    category_id: number;
    name: string;
    total_kg: number;
    donation_count: number;
  }[];
  monthly_trend: {
    month: string;
    kg_redistributed: number;
    meals_served: number;
    co2_saved_kg: number;
  }[];
}

export interface AdminSummary {
  users: {
    total_users: number;
    donors: number;
    receivers: number;
    admins: number;
    pending_verifications: number;
  };
  donations: {
    total_listings: number;
    available: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    expired: number;
  };
  recent_claims: {
    id: number;
    donation_title: string;
    receiver: string;
    donor: string;
    status: string;
    claimed_at: string;
  }[];
}

export interface InAppNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  related_donation_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface AIAnalysisResult {
  provider: string;
  is_demo_mode: boolean;
  category_id: number;
  suggested_category: string;
  suggested_title: string;
  suggested_description: string;
  estimated_quantity_range: string;
  suggested_dietary: string;
  suggested_tags: string[];
  suggested_prep_hours_ago: number;
  missing_information_checklist: { field: string; label: string }[];
  safety_disclaimer: string;
}

