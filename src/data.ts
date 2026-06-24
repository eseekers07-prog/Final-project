import { User, PetOwner, Veterinarian, Pet, Vaccination, Appointment, HealthRecord, Prescription, Invoice, InventoryItem, AuditLog } from "./types";

// Initial data corresponding to the Object Diagram and Class Diagram
export const INITIAL_USERS: User[] = [
  {
    userID: 1,
    username: "Nimal222",
    emailAddress: "nimal@gmail.com",
    phoneNumber: "0715522668",
    role: "PetOwner",
    accountStatus: "Active",
    createdAt: "2026-06-20T10:00:00-07:00"
  },
  {
    userID: 2,
    username: "DrSilva",
    emailAddress: "dr.silva@clinic.com",
    phoneNumber: "0771234567",
    role: "Veterinarian",
    accountStatus: "Active",
    createdAt: "2026-06-15T08:00:00-07:00"
  },
  {
    userID: 3,
    username: "ClinicAdmin",
    emailAddress: "admin@petcare.com",
    phoneNumber: "0779876543",
    role: "ClinicAdmin",
    accountStatus: "Active",
    createdAt: "2026-06-01T09:00:00-07:00"
  },
  {
    userID: 4,
    username: "SystemAdmin",
    emailAddress: "sys.admin@petcare.com",
    phoneNumber: "0770000000",
    role: "SystemAdmin",
    accountStatus: "Active",
    createdAt: "2026-06-01T08:00:00-07:00"
  }
];

export const INITIAL_PET_OWNERS: PetOwner[] = [
  {
    ownerID: 1, // 001
    userID: 1,
    fullName: "Nimal Perera",
    address: "Matara"
  }
];

export const INITIAL_VETERINARIANS: Veterinarian[] = [
  {
    vetID: 1, // 01
    userID: 2,
    fullName: "Dr. Silva",
    specialisation: "General Veterinary",
    licenceNo: "VET309"
  },
  {
    vetID: 2,
    userID: 5, // We can represent another doctor
    fullName: "Dr. Alwis",
    specialisation: "Feline Specialist",
    licenceNo: "VET412"
  }
];

export const INITIAL_PETS: Pet[] = [
  {
    petID: "P001",
    ownerID: 1,
    petName: "Roxy",
    species: "Dog",
    breed: "Labrador",
    dateOfBirth: "2024-03-16",
    sex: "Male",
    weightKg: 25,
    microchipNumber: "981022300456123",
    knownAllergies: "Penicillin, Strawberries"
  },
  {
    petID: "P002",
    ownerID: 1,
    petName: "Mimi",
    species: "Cat",
    breed: "Persian",
    dateOfBirth: "2025-01-10",
    sex: "Female",
    weightKg: 4.2,
    microchipNumber: "981022300789456",
    knownAllergies: "None"
  }
];

export const INITIAL_VACCINATIONS: Vaccination[] = [
  {
    vaccineRecordID: 110,
    petID: "P001",
    vaccineName: "Rabies",
    administrationDate: "2026-06-21",
    nextDueDateCalculated: "2027-06-21",
    adverseReactionNoted: "None"
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    appointmentID: 205,
    petID: "P001",
    vetID: 1,
    scheduledDateTime: "2026-06-21T10:30:00",
    appointmentType: "Vaccination",
    appointmentStatus: "Completed",
    reasonForVisit: "Annual Rabies booster and checkup",
    consultationFee: 3000
  },
  {
    appointmentID: 206,
    petID: "P002",
    vetID: 1,
    scheduledDateTime: "2026-06-25T14:00:00",
    appointmentType: "Consultation",
    appointmentStatus: "Scheduled",
    reasonForVisit: "Persian Cat coughing and eye discharge",
    consultationFee: 2500
  }
];

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [
  {
    recordID: 100,
    petID: "P001",
    vetID: 1,
    appointmentID: 205,
    visitDate: "2026-06-21",
    clinicalFindings: "Healthy and active. Temperature and respiration normal.",
    diagnosisCode: "Normal Physical - N/A",
    treatmentPlan: "No treatment needed. Keep active."
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    prescriptionID: 10001,
    recordID: 100,
    issueDate: "2026-06-21",
    items: [
      {
        itemID: 10010,
        prescriptionID: 10001,
        drugName: "Vitamin syrup",
        dosage: "5ml",
        frequency: "Twice a day"
      }
    ]
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    invoiceID: 1010,
    appointmentID: 205,
    totalAmount: 3000,
    discountApplied: 0,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    dateIssued: "2026-06-21"
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    itemID: 1,
    itemName: "Amoxicillin 250mg",
    category: "Medication",
    quantityInStock: 8,
    reorderLevel: 10,
    unit: "tablets",
    price: 150
  },
  {
    itemID: 2,
    itemName: "Canaural Ear Drops",
    category: "Medication",
    quantityInStock: 15,
    reorderLevel: 5,
    unit: "bottles",
    price: 1200
  },
  {
    itemID: 3,
    itemName: "Carprofen 50mg (Rimadyl)",
    category: "Medication",
    quantityInStock: 4,
    reorderLevel: 10,
    unit: "tablets",
    price: 200
  },
  {
    itemID: 4,
    itemName: "Rabies Vaccine (Nobivac)",
    category: "Vaccine",
    quantityInStock: 25,
    reorderLevel: 15,
    unit: "vials",
    price: 1800
  },
  {
    itemID: 5,
    itemName: "Feline Leukemia Vaccine",
    category: "Vaccine",
    quantityInStock: 3,
    reorderLevel: 5,
    unit: "vials",
    price: 2400
  },
  {
    itemID: 6,
    itemName: "Disposable Syringes 3ml",
    category: "Supplies",
    quantityInStock: 150,
    reorderLevel: 50,
    unit: "pieces",
    price: 50
  },
  {
    itemID: 7,
    itemName: "Pedigree Adult Dog Food 1.5kg",
    category: "Supplies",
    quantityInStock: 40,
    reorderLevel: 10,
    unit: "bags",
    price: 1850
  },
  {
    itemID: 8,
    itemName: "Whiskas Tuna Cat Food 1.2kg",
    category: "Supplies",
    quantityInStock: 30,
    reorderLevel: 8,
    unit: "bags",
    price: 1650
  },
  {
    itemID: 9,
    itemName: "Fleas & Ticks Grooming Shampoo",
    category: "Supplies",
    quantityInStock: 18,
    reorderLevel: 5,
    unit: "bottles",
    price: 1100
  },
  {
    itemID: 10,
    itemName: "Interactive Rubber Chew Toy",
    category: "Supplies",
    quantityInStock: 25,
    reorderLevel: 5,
    unit: "pieces",
    price: 650
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    logID: 1,
    timestamp: "2026-06-20T10:05:00",
    user: "SystemAdmin",
    action: "System Setup",
    details: "Initialized database tables for User, Pet, Veterinarian and Medicine configurations."
  },
  {
    logID: 2,
    timestamp: "2026-06-21T09:15:00",
    user: "ClinicAdmin",
    action: "Register User",
    details: "Created Pet Owner profile for Nimal Perera (userID: 1)."
  },
  {
    logID: 3,
    timestamp: "2026-06-21T09:30:00",
    user: "Nimal222",
    action: "Register Pet",
    details: "Added pet Roxy (Species: Dog, Breed: Labrador) to owner 1."
  },
  {
    logID: 4,
    timestamp: "2026-06-21T11:00:00",
    user: "DrSilva",
    action: "Record Consultation",
    details: "Recorded health record 100 for Roxy (P001) under appointment 205."
  },
  {
    logID: 5,
    timestamp: "2026-06-21T11:15:00",
    user: "ClinicAdmin",
    action: "Process Billing",
    details: "Generated invoice 1010 for appointment 205. Status marked PAID by Cash."
  }
];

// LocalStorage helpers
export const loadData = <T>(key: string, initial: T): T => {
  const data = localStorage.getItem(`petcare_${key}`);
  if (!data) {
    localStorage.setItem(`petcare_${key}`, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

export const saveData = <T>(key: string, value: T): void => {
  localStorage.setItem(`petcare_${key}`, JSON.stringify(value));
};
