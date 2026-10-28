export type UserRole = 'farmer' | 'buyer' | 'fpo' | 'admin';

export interface User {
  id: number;
  email: string;
  phone?: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  profile_photo_url?: string;
  created_at: string;
  farmer_profile?: any;
  buyer_profile?: any;
  fpo_profile?: any;
}

export interface FPO {
  id: number;
  name: string;
  registration_number: string;
  state?: string;
  district?: string;
  members?: any[];
  collective_lots?: any[];
}

export interface Commodity {
  id: number;
  name: string;
  code: string;
  category: string;
  standard_unit: string;
  min_support_price?: number;
  shelf_life_days?: number;
  image_url?: string;
  description?: string;
  variety?: string;
}

export interface Market {
  id: number;
  name: string;
  code?: string;
  state: string;
  district: string;
  is_apmc: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface MarketPrice {
  id: number;
  commodity_id: number;
  commodity_name?: string;
  market_id: number;
  market_name?: string;
  state?: string;
  district?: string;
  price_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_volume?: number;
  unit: string;
  source: string;
}

export interface HistoricalTrendPoint {
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_volume?: number;
}

export interface PriceComparisonItem {
  market_id: number;
  market_name: string;
  state: string;
  district: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  arrival_volume: number;
  source: string;
  last_updated: string;
}

export interface PriceComparisonResponse {
  commodity_id: number;
  commodity_name: string;
  reference_date: string;
  average_modal_price: number;
  highest_market?: string;
  highest_price?: number;
  lowest_market?: string;
  lowest_price?: number;
  markets: PriceComparisonItem[];
}

export interface Lot {
  id: number;
  lot_code: string;
  farmer_id?: number;
  fpo_id?: number;
  commodity_id: number;
  commodity_name?: string;
  quantity: number;
  unit: string;
  harvest_date: string;
  variety?: string;
  storage_type?: string;
  storage_address?: string;
  district?: string;
  state?: string;
  is_aggregated: boolean;
  status: string;
  created_at: string;
  inspections: Inspection[];
}

export interface Inspection {
  id: number;
  grade_assigned: string;
  moisture_percentage?: number;
  foreign_matter_percentage?: number;
  certificate_number?: string;
  status: string;
  remarks?: string;
}

export interface Listing {
  id: number;
  lot_id: number;
  seller_id: number;
  seller_name?: string;
  seller_role?: string;
  title: string;
  description?: string;
  commodity_id: number;
  commodity_name?: string;
  quantity_available: number;
  min_order_quantity: number;
  unit: string;
  asking_price_per_unit: number;
  currency: string;
  quality_grade: string;
  pickup_address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  status: string;
  featured: boolean;
  created_at: string;
}

export interface Offer {
  id: number;
  listing_id: number;
  listing_title?: string;
  commodity_name?: string;
  seller_id?: number;
  seller_name?: string;
  buyer_id: number;
  buyer_company_name?: string;
  offered_quantity: number;
  offered_price_per_unit: number;
  total_amount: number;
  counter_price_per_unit?: number;
  proposed_delivery_date?: string;
  notes?: string;
  seller_notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
  created_at: string;
}

export interface Transaction {
  id: number | string;
  transaction_code?: string;
  transaction_number?: string;
  offer_id?: number | string;
  listing_id?: number | string;
  listing_title?: string;
  commodity_name?: string;
  buyer_id?: number | string;
  buyer_name?: string;
  seller_id?: number | string;
  farmer_id?: number | string;
  seller_name?: string;
  agreed_quantity: number;
  agreed_price_per_unit: number;
  total_amount: number;
  payment_status: string;
  fulfillment_status?: string;
  status?: string;
  delivery_address?: string;
  completed_at?: string;
  created_at: string;
  listing?: any;
  farmer?: any;
  buyer?: any;
  payments?: Payment[];
  reviews?: Review[];
  disputes?: Dispute[];
}

export interface Payment {
  id: number;
  payment_code: string;
  transaction_id: number;
  amount: number;
  currency: string;
  payment_gateway_order_id?: string;
  payment_gateway_payment_id?: string;
  payment_method: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paid_at?: string;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  created_at: string;
}

export interface Dispute {
  id: number;
  dispute_reason: string;
  description: string;
  resolution_status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
  resolution_notes?: string;
  raised_by_name?: string;
  created_at: string;
}

export interface Recommendation {
  id?: number;
  commodity_id: number;
  commodity_name: string;
  suggested_market_id: number;
  suggested_market_name: string;
  suggested_market_state: string;
  observed_current_price: number;
  modal_price: number;
  min_expected_price: number;
  max_expected_price: number;
  suggested_action: 'SELL_NOW' | 'HOLD_FOR_BETTER_PRICE' | 'DIVERT_TO_ANOTHER_MANDI';
  suggested_selling_window: string;
  transport_cost_estimate: number;
  net_realization_estimate: number;
  confidence_score: number;
  explanation: string;
  reasoning_factors: Record<string, any>;
  data_source_info: string;
  generated_at: string;
}

export interface KYCVerification {
  id: number;
  user_id?: number;
  user?: any;
  user_name?: string;
  user_role?: string;
  user_email?: string;
  document_type: string;
  document_number: string;
  document_url?: string;
  status: string;
  remarks?: string;
  admin_notes?: string;
  submitted_at?: string;
  created_at?: string;
}

export interface StorageFacility {
  id: number;
  name: string;
  facility_type: string;
  capacity_metric_tonnes?: number;
  capacity_quintals?: number;
  available_capacity_tonnes?: number;
  available_quintals?: number;
  rate_per_quintal_per_month?: number;
  rate_per_day_per_quintal?: number;
  cold_storage?: boolean;
  temperature_celsius?: number;
  humidity_percentage?: number;
  address: string;
  district: string;
  state: string;
  contact_number?: string;
  is_wdra_accredited?: boolean;
  features?: string;
}

export interface LogisticsBooking {
  id: number;
  booking_code?: string;
  booking_number?: string;
  provider_name?: string;
  vehicle_type: string;
  origin_address?: string;
  destination_address?: string;
  pickup_location?: string;
  dropoff_location?: string;
  quantity?: number;
  pickup_date?: string;
  distance_km?: number;
  estimated_cost?: number;
  tracking_number?: string;
  status: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  reference_type?: string;
  reference_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_farmers: number;
  total_buyers: number;
  total_fpos: number;
  pending_kyc_count: number;
  active_listings_count: number;
  total_transactions_count: number;
  total_gmv_inr: number;
  open_disputes_count: number;
  market_data_records_count: number;
  last_market_data_sync?: string;
}

export interface BuyerRequirement {
  id: number;
  buyer_id: number;
  company_name?: string;
  commodity_id: number;
  commodity_name?: string;
  preferred_quality_grade?: string;
  target_quantity: number;
  unit: string;
  target_price_per_unit?: number;
  delivery_state?: string;
  delivery_district?: string;
  needed_by_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface FPOMember {
  id: number;
  fpo_id: number;
  farmer_id: number;
  farmer_name: string;
  farmer_phone?: string;
  farmer_district?: string;
  membership_number?: string;
  joined_date: string;
  shares_held: number;
  status: string;
}

export interface DailyForecast {
  date: string;
  max_temp: number;
  min_temp: number;
  precipitation_mm: number;
  condition: string;
}

export interface WeatherData {
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  temperature_celsius: number;
  temp_min_celsius: number;
  temp_max_celsius: number;
  humidity_percentage: number;
  precipitation_mm: number;
  rainfall_forecast_mm: number;
  wind_speed_kmh: number;
  weather_code: number;
  condition: string;
  harvest_suitability: string;
  storage_humidity_risk: string;
  source: string;
  forecast: DailyForecast[];
}
