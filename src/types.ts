export interface PressRelease {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  category: "National Agenda" | "Press Briefing" | "Demonstration" | "Public Announcement" | "Statement" | "Karyakram" | "Rally" | string;
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
}

export interface PolicyPillar {
  id: string;
  category: "Reservation" | "Hindu Rashtra" | "Population" | "Gurukul" | "Gaumata" | "Mathura Temple";
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  iconName: string;
  keyStanceHi: string;
  keyStanceEn: string;
  detailedPointsHi: string[];
  detailedPointsEn: string[];
  billProposalsHi: string[];
  billProposalsEn: string[];
  expectedImpactHi: string;
  expectedImpactEn: string;
  faq: { q: string; a: string; qEn?: string; aEn?: string }[];
}

export interface CampaignEvent {
  id: string;
  title: string;
  titleHi?: string;
  type: "Rally" | "Town Hall" | "Fundraiser" | "Padayatra" | "Press Conference";
  date: string;
  displayDate: string;
  time: string;
  locationName: string;
  address: string;
  cityState: string;
  precinctDistrict: string;
  description: string;
  descriptionHi?: string;
  isVirtual: boolean;
  virtualLink?: string;
  capacity: number;
  rsvpCount: number;
  featuredSpeakers: string[];
  imageSeed?: string;
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
}

export interface DonationReceipt {
  receiptNumber: string;
  transactionId: string;
  amount: number;
  frequency: string;
  donorName: string;
  date: string;
  organization: string;
  fecTaxNotice: string;
  paymentStatus?: "SUCCESS" | "FAILED" | "PENDING";
  paymentMethod?: string;
  paymentRef?: string;
  panNumber?: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  donorState?: string;
  citizenship?: "INDIAN" | "NRI";
  passportNumber?: string;
  partyPan?: string;
  partyRegNumber?: string;
  bankDetails?: {
    accountNo: string;
    ifsc: string;
    upiId: string;
  };
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
  stateDistrict?: string;
  membershipFee?: number;
  paymentMethod?: string;
  utrNumber?: string;
  isFeePaid?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface EventTicket {
  ticketNumber: string;
  eventTitle: string;
  attendeeName: string;
  guestsCount: number;
  qrCodeValue: string;
  issuedDate: string;
}

