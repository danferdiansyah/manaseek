export type User = {
  id: string;
  name: string | null;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: "JAMAAH" | "MUTAWIF" | "ADMIN";
  needsOnboarding?: boolean;
};
export type Page<T> = {
  items: T[];
  meta: { page: number; total: number; totalPages: number; limit: number };
};
export type Topic = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  phase: string;
  categories: string[];
  status: string;
  readingMinutes: number;
  obligation: string;
  steps?: { id: string; text: string }[];
  prayers?: Prayer[];
  references?: {
    id: string;
    citation: string;
    gloss?: string;
    verifiedAt?: string;
  }[];
  prohibitions?: { id: string; text: string; consequence?: string }[];
  next?: { slug: string; title: string };
};
export type Prayer = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  context?: string;
};
export type Checklist = {
  items: {
    id: string;
    title: string;
    description?: string;
    category: string;
    completed: boolean;
  }[];
  meta: { total: number; completed: number };
};
export type Service = "IBADAH_GUIDANCE" | "MOBILITY_ASSISTANCE" | "EMERGENCY";
export type Mutawif = {
  id: string;
  name?: string;
  avatarUrl?: string;
  user?: { name: string; avatarUrl?: string };
  bio?: string;
  city?: string;
  languages: string[];
  yearsExperience: number;
  ratingAverage: number;
  ratingCount: number;
  distanceKm?: number;
  hourlyRate?: number;
  rates?: { serviceType: Service; hourlyRate: string; active?: boolean }[];
  availabilityStatus?: string;
  verificationStatus?: string;
  verificationNote?: string;
  documents?: { id: string; type: string; fileUrl: string }[];
};
export type Booking = {
  id: string;
  code: string;
  status: string;
  serviceType: Service;
  scheduledStartAt: string;
  durationHours: number;
  meetingPointLabel: string;
  notes?: string;
  totalAmount: string;
  jamaah?: { name: string };
  mutawif?: { user: { name: string } };
  review?: { id: string; rating: number };
  events?: { id: string; toStatus: string; createdAt: string; note?: string }[];
};
export type ChatSession = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
};
export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citedSlugs: string[];
  escalated: boolean;
  createdAt: string;
};
export type ChatResult = {
  sessionId: string;
  userMessage: ChatMessage;
  message: ChatMessage;
};
export type PackageDetails = {
  flights: {
    direction: string;
    airline: string;
    flightNumber: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    baggage: string;
    cabin: string;
    transit: string;
  }[];
  hotels: {
    city: string;
    name: string;
    nights: number;
    stars: number;
    distanceMeters: number;
    landmark: string;
    mealPlan: string;
  }[];
  included: string[];
  excluded: string[];
  itinerary: { days: string; title: string; description: string }[];
};
export type UmrahPackage = {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  summary?: string;
  durationDays: number;
  departureCity: string;
  basePrice: string;
  tripleSupplement: string;
  doubleSupplement: string;
  details: PackageDetails;
  departures: {
    id: string;
    departureDate: string;
    returnDate: string;
    availableSeats: number;
  }[];
};
export type Room = "QUAD" | "TRIPLE" | "DOUBLE";
export type Traveler = {
  fullName: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
};
export type Checkout = {
  requestId: string;
  departureId: string;
  roomType: Room;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  travelers: Traveler[];
  acceptDemo: true;
};
export type UmrahOrder = {
  id: string;
  code: string;
  status: string;
  roomType: Room;
  travelerCount: number;
  unitPrice: string;
  totalAmount: string;
  createdAt: string;
  contactName: string;
  packageSnapshot: {
    name: string;
    durationDays: number;
    departureDate: string;
    returnDate: string;
    details: PackageDetails;
  };
  travelers?: Traveler[];
  payment?: { status: string; reference: string; amount: string };
};
export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  data?: Record<string, string>;
};
export type Review = {
  id: string;
  rating: number;
  comment?: string;
  author?: { name: string };
  createdAt: string;
};
