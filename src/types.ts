export interface User {
  userID: number;
  username: string;
  emailAddress: string;
  phoneNumber: string;
  role: "PetOwner" | "Veterinarian" | "ClinicAdmin" | "SystemAdmin";
  accountStatus: "Active" | "Pending" | "Suspended";
  createdAt: string;
}

export interface PetOwner {
  ownerID: number;
  userID: number;
  fullName: string;
  address: string;
}

export interface Veterinarian {
  vetID: number;
  userID: number;
  fullName: string;
  specialisation: string;
  licenceNo: string;
}

export interface Pet {
  petID: string;
  ownerID: number;
  petName: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  sex: "Male" | "Female";
  weightKg: number;
  microchipNumber: string;
  knownAllergies: string;
}

export interface Vaccination {
  vaccineRecordID: number;
  petID: string;
  vaccineName: string;
  administrationDate: string;
  nextDueDateCalculated: string;
  adverseReactionNoted: string;
}

export interface Appointment {
  appointmentID: number;
  petID: string;
  vetID: number;
  scheduledDateTime: string;
  appointmentType: string;
  appointmentStatus: "Scheduled" | "Confirmed" | "Completed" | "Cancelled";
  reasonForVisit: string;
  consultationFee: number;
}

export interface HealthRecord {
  recordID: number;
  petID: string;
  vetID: number;
  appointmentID: number;
  visitDate: string;
  clinicalFindings: string;
  diagnosisCode: string;
  treatmentPlan: string;
}

export interface PrescriptionItem {
  itemID: number;
  prescriptionID: number;
  drugName: string;
  dosage: string;
  frequency: string;
}

export interface Prescription {
  prescriptionID: number;
  recordID: number;
  issueDate: string;
  items: PrescriptionItem[];
}

export interface Invoice {
  invoiceID: number;
  appointmentID?: number;
  totalAmount: number;
  discountApplied: number;
  paymentStatus: "Pending" | "Paid" | "Cancelled";
  paymentMethod: "Cash" | "Card" | "Online" | "";
  dateIssued: string;
  purchaseDetails?: string;
  itemID?: number;
  quantity?: number;
}

export interface InventoryItem {
  itemID: number;
  itemName: string;
  category: "Medication" | "Vaccine" | "Supplies" | "Equipment";
  quantityInStock: number;
  reorderLevel: number;
  unit: string;
  price: number;
}

export interface AuditLog {
  logID: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
