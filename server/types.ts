export interface AdminCredentials {
  username: string;
  passwordHash: string;
  updatedAt: string;
}

export interface PartyInfo {
  name: string;
  nameEnglish: string;
  leaderName: string;
  leaderRole: string;
  motto: string;
  mottoEnglish: string;
  primarySlogan: string;
  secondarySlogan: string;
  contactPhone1: string;
  contactPhone2: string;
  headquarters: string;
  panNumber: string;
  bankDetails: {
    bankName: string;
    branch: string;
    accountNo: string;
    ifscCode: string;
    upiId: string;
    accountHolder: string;
  };
  shortBio: string;
  coreAgendasList: string[];
}

export interface PressReleaseRecord {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  category: string;
  date: string;
  location: string;
  spokesperson: string;
  imageUrl?: string;
  videoUrl?: string;
  videoCaption?: string;
  galleryImages?: string[];
  hasVideo?: boolean;
  pdfUrl?: string;
  isUrgent?: boolean;
  archivedAt?: string;
}

export interface EventRecord {
  id: string;
  title: string;
  titleHi?: string;
  type: string;
  category: string;
  date: string;
  displayDate: string;
  time: string;
  locationName: string;
  address: string;
  cityState: string;
  precinctDistrict?: string;
  description: string;
  descriptionHi?: string;
  isVirtual: boolean;
  virtualLink?: string;
  capacity: number;
  rsvpCount: number;
  featuredSpeakers: string[];
  imageSeed?: string;
  archivedAt?: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  amount: number;
  frequency: "one-time" | "monthly" | "weekly";
  precinct?: string;
  timestamp: string;
  isAnonymous: boolean;
  message?: string;
  panNumber?: string;
  citizenship?: "INDIAN" | "NRI";
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  pinCode?: string;
  passportNumber?: string;
  paymentMethod?: string;
  utrNumber?: string;
}

export interface MemberRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  precinct: string;
  membershipTier: string;
  interests: string[];
  joinedDate: string;
  memberCardId: string;
  membershipFee?: number;
  paymentMethod?: string;
  utrNumber?: string;
  isFeePaid?: boolean;
}

export interface EventRsvpRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  guestsCount: number;
  qrCodeToken: string;
  timestamp: string;
}

export interface JwtAdminPayload {
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export type PaymentGatewayStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "USER_DROPPED"
  | "CANCELLED";

export interface PaymentTransactionRecord {
  internalTransactionId: string;
  cashfreeOrderId: string;
  cashfreePaymentId: string | null;
  paymentSessionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  paymentAmount: number;
  currency: "INR";
  paymentStatus: PaymentGatewayStatus;
  paymentMethod: string | null;
  orderType: "DONATION" | "MEMBERSHIP";
  membershipTier?: string;
  failureReason?: string | null;
  transactionDate: string | null;
  createdDate: string;
  updatedDate: string;
  isSimulated?: boolean;
  simulatedLockPending?: boolean;
  idempotencyKey?: string;
  processedWebhookEvents?: string[];
  donorData?: any;
  memberData?: any;
  receipt?: any;
  memberCard?: any;
}

export interface CashfreeOrderRecord {
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderType: "DONATION" | "MEMBERSHIP";
  orderStatus: "ACTIVE" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | "USER_DROPPED";
  donorData?: any;
  memberData?: any;
  receipt?: any;
  memberCard?: any;
  transactionId?: string;
  cashfreePaymentId?: string;
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
}
