export enum UserRole {
  ADMIN = 'ADMIN',
  NGO = 'NGO',
  STUDENT = 'STUDENT',
}

export enum FoodStatus {
  AVAILABLE = 'AVAILABLE',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
}

export enum PickupStatus {
  PENDING = 'PENDING',
  PICKED = 'PICKED',
  DELIVERED = 'DELIVERED',
}

export enum PredictionMode {
  BASIC = 'BASIC',
  WEIGHTED = 'WEIGHTED',
  ADVANCED = 'ADVANCED'
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER'
}

export enum MealStatus {
  EATING = 'EATING',
  NOT_EATING = 'NOT_EATING',
  LATE = 'LATE',
  PENDING = 'PENDING'
}

export enum VoteOption {
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE'
}

export enum AttendanceStatus {
  ATTENDED = 'ATTENDED',
  SKIPPED = 'SKIPPED', // User said YES but didn't come (No-show)
  MISSED = 'MISSED', // User said NO and didn't come (Honest)
  UNPLANNED = 'UNPLANNED' // User said NO but came
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  location: string;
  created_at: string;
}

export interface DailyMenu {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface AttendanceRecord {
  id: number;
  admin_id: string;
  date: string; // ISO Date string YYYY-MM-DD
  expected_count: number;
  actual_count: number;
}

export interface SurplusFood {
  id: number;
  admin_id: string;
  admin_name?: string; // Joined field for UI
  food_name: string;
  quantity: number;
  cooked_time: string; // ISO Timestamp
  expiry_time: string; // ISO Timestamp
  status: FoodStatus;
  location?: string; // Joined field for UI
  distance_km?: number; // Mock distance for UI
}

export interface Pickup {
  id: number;
  food_id: number;
  ngo_id: string;
  pickup_status: PickupStatus;
  food?: SurplusFood; // Joined data
  proof_url?: string;
  proof_uploaded_at?: string;
}

export interface DigitalReceipt {
  id: string; // Format: NGO-YYYYMM-XXXX
  pickup_id: number;
  ngo_id: string;
  ngo_name: string;
  admin_id: string;
  donor_name: string;
  food_name: string;
  quantity: number;
  pickup_location: string;
  pickup_time: string; // ISO
  generated_at: string; // ISO
  verification_status: 'VERIFIED' | 'PENDING';
}

export interface StudentConfirmation {
  id: number;
  student_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  status: MealStatus;
  timestamp: string;
  synced?: boolean; // For offline support
}

export interface StudentVote {
  id: number;
  student_id: string;
  date: string;
  vote: VoteOption;
  voted_at: string;
}

// New Generic Poll Interface
export interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  active: boolean;
}

export interface PollVote {
  poll_id: string;
  student_id: string;
  option_id: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awarded_at: string;
}

export interface StudentImpact {
  meals_saved: number;
  streak_days: number;
  no_show_count: number;
  badges: Badge[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PredictionResult {
  predicted_count: number;
  recommended_food_quantity: number;
  is_weekend: boolean;
  average_last_7_days: number;
  vote_summary?: {
    yes: number;
    no: number;
    maybe: number;
    total: number;
  };
}

export interface AdvancedPredictionResult {
  predicted_attendance: number;
  recommended_food: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  logic_used: string;
  mode: PredictionMode;
}

// NGO Specific Types
export interface NgoCapacity {
  ngo_id: string;
  date: string;
  max_capacity: number;
  remaining_capacity: number;
  volunteers_available: number;
}

export interface NgoReliability {
  score: number;
  on_time_percentage: number;
  missed_pickups: number;
}

export interface NgoStats {
  total_collected: number;
  people_fed: number;
  co2_saved: number;
  capacity: NgoCapacity;
  reliability: NgoReliability;
}