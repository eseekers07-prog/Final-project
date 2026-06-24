import React, { useState } from "react";
import { Pet, Appointment, Veterinarian, Vaccination, HealthRecord, Prescription, Invoice, InventoryItem } from "../types";
import { 
  Plus, Calendar, ShieldAlert, HeartPulse, FileText, Check, Award, Eye, 
  ClipboardList, Info, ShoppingBag, CreditCard, CheckCircle, Trash2, 
  TrendingUp, Coins, Bell, Package, Clock, ShieldCheck, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PetOwnerDashboardProps {
  pets: Pet[];
  onAddPet: (pet: Omit<Pet, "petID">) => void;
  appointments: Appointment[];
  veterinarians: Veterinarian[];
  vaccinations: Vaccination[];
  healthRecords: HealthRecord[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  onBookAppointment: (petID: string, vetID: number, dateStr: string, type: string, reason: string) => void;
  currentOwnerID: number;
  inventory: InventoryItem[];
  onPayInvoice: (invoiceID: number, paymentMethod: "Card" | "Online") => void;
  onPurchaseProduct: (itemID: number, quantity: number) => void;
  onCancelInvoice: (invoiceID: number) => void;
  materialTheme: "blue" | "lavender" | "terracotta" | "green";
}

// Material You Palette generator for Android 13 theme matching
const getThemeClasses = (theme: "blue" | "lavender" | "terracotta" | "green") => {
  switch(theme) {
    case "lavender":
      return {
        primary: "bg-[#7C4DFF]",
        primaryBorder: "border-[#7C4DFF]",
        textPrimary: "text-[#7C4DFF]",
        bgLight: "bg-[#F3E5F5]",
        borderLight: "border-[#E1BEE7]",
        textLight: "text-[#5E35B1]",
        accent: "bg-[#E040FB]",
        gradient: "from-[#7C4DFF] to-[#E040FB]",
        buttonHover: "hover:bg-[#6200EA]",
        accentText: "text-[#E040FB]",
        shadow: "shadow-purple-100",
        badge: "bg-purple-50 text-purple-700 border border-purple-200"
      };
    case "terracotta":
      return {
        primary: "bg-[#E64A19]",
        primaryBorder: "border-[#E64A19]",
        textPrimary: "text-[#E64A19]",
        bgLight: "bg-[#FBE9E7]",
        borderLight: "border-[#FFCCBC]",
        textLight: "text-[#D84315]",
        accent: "bg-[#FF5722]",
        gradient: "from-[#E64A19] to-[#FF5722]",
        buttonHover: "hover:bg-[#BF360C]",
        accentText: "text-[#FF5722]",
        shadow: "shadow-orange-100",
        badge: "bg-orange-50 text-orange-700 border border-orange-200"
      };
    case "green":
      return {
        primary: "bg-[#2E7D32]",
        primaryBorder: "border-[#2E7D32]",
        textPrimary: "text-[#2E7D32]",
        bgLight: "bg-[#E8F5E9]",
        borderLight: "border-[#C8E6C9]",
        textLight: "text-[#1B5E20]",
        accent: "bg-[#4CAF50]",
        gradient: "from-[#2E7D32] to-[#4CAF50]",
        buttonHover: "hover:bg-[#1B5E20]",
        accentText: "text-[#4CAF50]",
        shadow: "shadow-green-100",
        badge: "bg-green-50 text-green-700 border border-green-200"
      };
    case "blue":
    default:
      return {
        primary: "bg-[#1A73E8]",
        primaryBorder: "border-[#1A73E8]",
        textPrimary: "text-[#1A73E8]",
        bgLight: "bg-blue-50",
        borderLight: "border-blue-100",
        textLight: "text-[#155cb4]",
        accent: "bg-[#FFB300]",
        gradient: "from-[#1A73E8] to-[#155cb4]",
        buttonHover: "hover:bg-[#155cb4]",
        accentText: "text-[#FFB300]",
        shadow: "shadow-blue-100",
        badge: "bg-blue-50 text-blue-700 border border-blue-200"
      };
  }
};

export default function PetOwnerDashboard({
  pets,
  onAddPet,
  appointments,
  veterinarians,
  vaccinations,
  healthRecords,
  prescriptions,
  invoices,
  onBookAppointment,
  currentOwnerID,
  inventory = [],
  onPayInvoice,
  onPurchaseProduct,
  onCancelInvoice,
  materialTheme = "blue"
}: PetOwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"pets" | "appointments" | "health" | "book" | "shop" | "billing">("pets");
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ record: HealthRecord; pet: Pet; vet: Veterinarian } | null>(null);

  // Android 13 notification permission simulator state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(() => {
    return localStorage.getItem("petcare_notif_prompt_seen") !== "true";
  });
  const [notificationPermission, setNotificationPermission] = useState(() => {
    return localStorage.getItem("petcare_notif_allowed") || "prompt";
  });

  // Shopping States
  const [shopSearch, setShopSearch] = useState("");
  const [shopCategory, setShopCategory] = useState<string>("All");
  const [checkoutItem, setCheckoutItem] = useState<InventoryItem | null>(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Billing & Payment States
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Online" | "eZCash">("Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [viewedReceipt, setViewedReceipt] = useState<Invoice | null>(null);
  const [billingFilter, setBillingFilter] = useState<"All" | "Pending" | "Paid">("All");

  // Form states for adding pet
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("Dog");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetDob, setNewPetDob] = useState("2025-01-01");
  const [newPetSex, setNewPetSex] = useState<"Male" | "Female">("Male");
  const [newPetWeight, setNewPetWeight] = useState(10);
  const [newPetMicrochip, setNewPetMicrochip] = useState("");
  const [newPetAllergies, setNewPetAllergies] = useState("");

  // Form states for booking appointment
  const [bookPetID, setBookPetID] = useState("");
  const [bookVetID, setBookVetID] = useState(1);
  const [bookDate, setBookDate] = useState("2026-06-25T10:00");
  const [bookType, setBookType] = useState("Consultation");
  const [bookReason, setBookReason] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const themeStyles = getThemeClasses(materialTheme);
  const ownerPets = pets.filter((p) => p.ownerID === currentOwnerID);

  // Handle adding pet
  const handleCreatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName || !newPetBreed) return;
    onAddPet({
      ownerID: currentOwnerID,
      petName: newPetName,
      species: newPetSpecies,
      breed: newPetBreed,
      dateOfBirth: newPetDob,
      sex: newPetSex,
      weightKg: Number(newPetWeight),
      microchipNumber: newPetMicrochip || "N/A",
      knownAllergies: newPetAllergies || "None"
    });
    // Reset
    setNewPetName("");
    setNewPetBreed("");
    setNewPetAllergies("");
    setNewPetMicrochip("");
    setShowAddPetModal(false);
  };

  // Handle booking appointment
  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPetID || !bookVetID || !bookDate || !bookReason) {
      setBookingError("Please fill out all booking fields.");
      return;
    }

    // Process availability check
    const selectedDateTime = new Date(bookDate);
    const hasConflict = appointments.some(appt => {
      if (appt.vetID === Number(bookVetID) && appt.appointmentStatus !== "Cancelled") {
        const apptTime = new Date(appt.scheduledDateTime);
        const timeDiff = Math.abs(selectedDateTime.getTime() - apptTime.getTime());
        return timeDiff < 60 * 60 * 1000; // Conflict if less than 1 hour apart
      }
      return false;
    });

    if (hasConflict) {
      setBookingError("That veterinarian is fully booked or unavailable at this specific slot. Please choose another time or doctor.");
      return;
    }

    onBookAppointment(bookPetID, Number(bookVetID), bookDate, bookType, bookReason);
    setBookingSuccess(true);
    setBookingError("");
    setBookReason("");
    
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveTab("appointments");
    }, 1500);
  };

  // Handle checkout purchase execution
  const handleCheckoutConfirm = () => {
    if (!checkoutItem) return;
    onPurchaseProduct(checkoutItem.itemID, checkoutQty);
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setCheckoutItem(null);
      // Route to billing so the pet owner can immediately pay the new pending invoice!
      setActiveTab("billing");
    }, 1500);
  };

  // Handle payment processing authorization simulation
  const handleAuthorizePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;

    setPaymentProcessing(true);
    setTimeout(() => {
      onPayInvoice(selectedInvoiceToPay.invoiceID, paymentMethod === "Card" ? "Card" : "Online");
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      
      setTimeout(() => {
        setPaymentSuccess(false);
        setSelectedInvoiceToPay(null);
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
      }, 1500);
    }, 2000); // 2-second mock processing delay for smooth feedback
  };

  // Get outstanding billing balance
  const pendingInvoices = invoices.filter(inv => {
    // Direct product purchases belong to Nimal in this simulation, and we match Nimal's pets for appointment invoices
    if (inv.paymentStatus !== "Pending") return false;
    if (inv.purchaseDetails) return true; // Direct purchase belongs to active owner
    if (inv.appointmentID) {
      const appt = appointments.find(a => a.appointmentID === inv.appointmentID);
      if (appt && ownerPets.some(p => p.petID === appt.petID)) return true;
    }
    return false;
  });

  const totalOutstandingBalance = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.discountApplied), 0);

  // Shop filter calculations
  const filteredProducts = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(shopSearch.toLowerCase());
    const matchesCategory = shopCategory === "All" || item.category === shopCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F7FB] relative" id="pet-owner-dashboard-root">
      
      {/* Android 13 Notification Permission Modal Prompt */}
      <AnimatePresence>
        {showNotificationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50 rounded-inner"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FAF9F6] text-slate-800 rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4"
              id="android13-permission-prompt"
            >
              <div className={`w-12 h-12 rounded-full ${themeStyles.bgLight} ${themeStyles.textLight} flex items-center justify-center`}>
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold tracking-tight text-gray-900">Allow Pet Care OS to send you notifications?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Required on Android 13+ to deliver immediate alerts for upcoming rabies boosters, pet vaccine updates, and veterinarian checkup notices.
                </p>
              </div>
              <div className="w-full pt-2 flex flex-col gap-2">
                <button
                  id="notif-allow-btn"
                  onClick={() => {
                    setNotificationPermission("granted");
                    localStorage.setItem("petcare_notif_allowed", "granted");
                    localStorage.setItem("petcare_notif_prompt_seen", "true");
                    setShowNotificationPrompt(false);
                  }}
                  className={`w-full py-2.5 ${themeStyles.primary} text-white font-bold rounded-full text-xs shadow hover:opacity-90 transition`}
                >
                  Allow Notifications
                </button>
                <button
                  id="notif-deny-btn"
                  onClick={() => {
                    setNotificationPermission("denied");
                    localStorage.setItem("petcare_notif_allowed", "denied");
                    localStorage.setItem("petcare_notif_prompt_seen", "true");
                    setShowNotificationPrompt(false);
                  }}
                  className="w-full py-2.5 bg-gray-200 hover:bg-gray-200/90 text-gray-700 font-bold rounded-full text-xs transition"
                >
                  Don't Allow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Screen Panel with animations */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-12" id="owner-content-panel">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PETS TAB */}
          {activeTab === "pets" && (
            <motion.div
              id="pets-tab"
              key="pets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Your Registered Pets</h2>
                  <p className="text-xs text-gray-500">Provide medical details and monitor active vaccine schedules</p>
                </div>
                <button
                  id="add-pet-btn"
                  onClick={() => setShowAddPetModal(true)}
                  className={`px-3 py-1.5 ${themeStyles.primary} text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform hover:scale-[1.02]`}
                >
                  <Plus className="w-3.5 h-3.5" /> Register Pet
                </button>
              </div>

              {/* Beautiful Banner Card at the top of Pets tab */}
              <div className="relative bg-slate-900 rounded-[24px] overflow-hidden shadow-md text-white h-32 md:h-40 flex items-center p-6">
                <img 
                  src="/src/assets/images/clinic_hero_1782311820571.jpg" 
                  alt="Cozy Vet Clinic" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10 max-w-sm">
                  <h3 className="text-xs md:text-sm font-extrabold tracking-widest uppercase text-[#FFB300]">Matara Pet Care OS</h3>
                  <p className="text-[11px] text-blue-50 leading-relaxed mt-1.5">
                    Connecting you to expert veterinary consultations, automated immunization trackers, and direct pharmacy orders.
                  </p>
                </div>
              </div>

              {ownerPets.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/60 shadow-sm">
                  <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold">No registered pets found.</p>
                  <p className="text-xs text-gray-400 mt-1">Register your first dog or cat profile to secure appointments and booster records.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="pets-grid">
                  {ownerPets.map((pet) => {
                    const petVaccines = vaccinations.filter((v) => v.petID === pet.petID);
                    const petAppts = appointments.filter((a) => a.petID === pet.petID);
                    
                    return (
                      <div 
                        key={pet.petID} 
                        className="bg-white rounded-[24px] border border-gray-200/50 shadow-sm overflow-hidden flex flex-col justify-between" 
                        id={`pet-card-${pet.petID}`}
                      >
                        {/* Pet Header */}
                        <div className="p-4 border-b border-gray-100 bg-slate-50/80 flex justify-between items-start gap-2">
                          <div className="flex gap-3 items-center">
                            <img 
                              src={pet.species.toLowerCase() === "dog" ? "/src/assets/images/cute_puppy_1782311834428.jpg" : "/src/assets/images/cute_kitten_1782311849464.jpg"} 
                              alt={pet.petName} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${themeStyles.badge}`}>
                                {pet.species}
                              </span>
                              <h3 className="text-sm font-extrabold text-gray-800 mt-1">{pet.petName}</h3>
                              <p className="text-[11px] text-gray-500">{pet.breed} • {pet.sex}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono text-gray-400 font-bold">
                            #{pet.petID}
                          </div>
                        </div>

                        {/* Pet Details */}
                        <div className="p-4 space-y-4 flex-1">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 uppercase block font-semibold">Weight</span>
                              <span className="font-bold text-gray-700">{pet.weightKg} kg</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 uppercase block font-semibold">Born</span>
                              <span className="font-bold text-gray-700">{new Date(pet.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-gray-100 col-span-1">
                              <span className="text-[10px] text-gray-400 uppercase block font-semibold">Microchip</span>
                              <span className="font-mono text-[9px] font-bold text-gray-700 block truncate" title={pet.microchipNumber}>
                                {pet.microchipNumber}
                              </span>
                            </div>
                          </div>

                          {/* Allergies Alert Box */}
                          <div className={`p-2.5 rounded-xl text-xs flex gap-2 items-center ${
                            pet.knownAllergies.toLowerCase() !== "none" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
                            <div>
                              <span className="font-bold">Known Allergies:</span>{" "}
                              <span className="italic">{pet.knownAllergies}</span>
                            </div>
                          </div>

                          {/* Vaccine list */}
                          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex justify-between">
                              <span>Vaccination Calendar</span>
                              <span className="lowercase font-normal text-slate-400">{petVaccines.length} registered</span>
                            </h4>
                            {petVaccines.length === 0 ? (
                              <p className="text-[11px] text-gray-400 italic">No vaccines recorded yet.</p>
                            ) : (
                              <div className="space-y-1 max-h-[90px] overflow-y-auto">
                                {petVaccines.map((v) => (
                                  <div key={v.vaccineRecordID} className="flex justify-between items-center text-xs p-1.5 bg-white border border-gray-100 rounded-lg">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-1.5 h-1.5 ${themeStyles.primary} rounded-full`}></div>
                                      <span className="font-semibold text-gray-700">{v.vaccineName}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      Next: {v.nextDueDateCalculated}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: APPOINTMENTS TAB */}
          {activeTab === "appointments" && (
            <motion.div
              id="appointments-tab"
              key="appointments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Clinical Care Visits</h2>
                  <p className="text-xs text-gray-500">Monitor active bookings, clinical statuses, and invoice details</p>
                </div>
                <button
                  onClick={() => setActiveTab("book")}
                  className={`px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-slate-700 transition`}
                >
                  <Plus className="w-3.5 h-3.5" /> Book Consultation
                </button>
              </div>

              {appointments.filter((a) => ownerPets.some((p) => p.petID === a.petID)).length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold">No appointments scheduled.</p>
                  <p className="text-xs text-gray-400 mt-1">Tap 'Book Care' to reserve a slot with our expert veterinary team.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-200/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Patient Pet</th>
                          <th className="p-3">Veterinarian</th>
                          <th className="p-3">Schedule Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-center">Visit Status</th>
                          <th className="p-3 text-right">Billing Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appointments
                          .filter((a) => ownerPets.some((p) => p.petID === a.petID))
                          .sort((a, b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime())
                          .map((appt) => {
                            const pet = pets.find((p) => p.petID === appt.petID);
                            const vet = veterinarians.find((v) => v.vetID === appt.vetID);
                            const invoice = invoices.find((i) => i.appointmentID === appt.appointmentID);

                            return (
                              <tr key={appt.appointmentID} className="hover:bg-slate-50/50" id={`owner-appt-row-${appt.appointmentID}`}>
                                <td className="p-3 font-semibold text-gray-800">{pet?.petName || "Unknown Pet"}</td>
                                <td className="p-3 text-gray-600">{vet?.fullName || "General Vet"}</td>
                                <td className="p-3 font-mono text-gray-500">
                                  {new Date(appt.scheduledDateTime).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-[3px] text-[10px] font-bold uppercase">
                                    {appt.appointmentType}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                    appt.appointmentStatus === "Completed" ? "bg-green-100 text-green-800" :
                                    appt.appointmentStatus === "Confirmed" ? "bg-blue-100 text-blue-800" :
                                    appt.appointmentStatus === "Cancelled" ? "bg-red-100 text-red-800" :
                                    "bg-amber-100 text-amber-800"
                                  }`}>
                                    {appt.appointmentStatus}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {invoice ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                        invoice.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                      }`}>
                                        {invoice.paymentStatus} • LKR {invoice.totalAmount}
                                      </span>
                                      {invoice.paymentStatus === "Pending" && (
                                        <button
                                          onClick={() => {
                                            setSelectedInvoiceToPay(invoice);
                                            setActiveTab("billing");
                                          }}
                                          className={`text-[10px] font-extrabold ${themeStyles.textPrimary} hover:underline flex items-center gap-0.5`}
                                        >
                                          Pay Now <ChevronRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic text-[10px]">Processing</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: HEALTH RECORDS TAB */}
          {activeTab === "health" && (
            <motion.div
              id="health-tab"
              key="health"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Electronic Medical Records</h2>
                <p className="text-xs text-gray-500">Official diagnoses, treatment protocols, and prescription history</p>
              </div>

              {healthRecords.filter((r) => ownerPets.some((p) => p.petID === r.petID)).length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold">No medical records documented yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Once our veterinarians diagnose and treat your pets, reports will lock here.</p>
                </div>
              ) : (
                <div className="space-y-3" id="records-list">
                  {healthRecords
                    .filter((r) => ownerPets.some((p) => p.petID === r.petID))
                    .map((record) => {
                      const pet = pets.find((p) => p.petID === record.petID)!;
                      const vet = veterinarians.find((v) => v.vetID === record.vetID)!;
                      const prescription = prescriptions.find((p) => p.recordID === record.recordID);

                      return (
                        <div 
                          key={record.recordID} 
                          className="bg-white rounded-2xl border border-gray-200/50 p-4 shadow-sm hover:border-gray-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          id={`owner-record-${record.recordID}`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 text-sm">{pet?.petName}</span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Record #{record.recordID}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 font-medium">
                              <strong className="text-gray-900">Diagnosis:</strong> {record.diagnosisCode}
                            </p>
                            <p className="text-xs text-gray-500 italic max-w-xl truncate">
                              "{record.clinicalFindings}"
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-semibold text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(record.visitDate).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>Attending: {vet?.fullName}</span>
                              {prescription && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                                    💊 Prescription Generated
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                              id={`view-doc-btn-${record.recordID}`}
                              onClick={() => setSelectedRecord({ record, pet, vet })}
                              className={`w-full md:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold border border-gray-200 text-gray-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-transform`}
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View Document
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: BOOK CARE FORM */}
          {activeTab === "book" && (
            <motion.div
              id="book-tab"
              key="book"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 max-w-lg mx-auto"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Reserve Veterinary Attention</h2>
                <p className="text-xs text-gray-500 mt-0.5">Submit patient info to schedule an active slot with live conflict check</p>
              </div>

              {ownerPets.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm space-y-3">
                  <ShieldAlert className="w-12 h-12 text-rose-300 mx-auto" />
                  <p className="text-gray-700 font-bold">Registration Required</p>
                  <p className="text-xs text-gray-400">Please register a pet profile first before booking clinical attention.</p>
                  <button
                    onClick={() => setActiveTab("pets")}
                    className={`px-4 py-2 ${themeStyles.primary} text-white font-bold rounded-xl text-xs shadow`}
                  >
                    Go to Pets Section
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] border border-gray-200/50 p-5 shadow-md">
                  <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
                    
                    {bookingError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium leading-relaxed">
                        {bookingError}
                      </div>
                    )}

                    {bookingSuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-center flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                        <div>
                          <p className="text-sm">Appointment Scheduled Successfully!</p>
                          <p className="text-[10px] font-normal text-emerald-600 mt-0.5">Redirecting to your active clinical bookings...</p>
                        </div>
                      </div>
                    )}

                    {!bookingSuccess && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Select Patient Pet</label>
                            <select
                              id="book-select-pet"
                              value={bookPetID}
                              onChange={(e) => setBookPetID(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {ownerPets.map(p => (
                                <option key={p.petID} value={p.petID}>{p.petName} ({p.breed})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Assigned Doctor</label>
                            <select
                              id="book-select-vet"
                              value={bookVetID}
                              onChange={(e) => setBookVetID(Number(e.target.value))}
                              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {veterinarians.map(v => (
                                <option key={v.vetID} value={v.vetID}>{v.fullName} - {v.specialisation}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Date & Time</label>
                            <input
                              id="book-datetime"
                              type="datetime-local"
                              value={bookDate}
                              onChange={(e) => setBookDate(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Visit Category</label>
                            <select
                              id="book-type"
                              value={bookType}
                              onChange={(e) => setBookType(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Consultation">General Consultation</option>
                              <option value="Vaccination">Vaccination Booster</option>
                              <option value="Surgery">Surgical Operation</option>
                              <option value="Grooming">Therapeutic Grooming</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Reason for consultation</label>
                          <textarea
                            id="book-reason"
                            value={bookReason}
                            onChange={(e) => setBookReason(e.target.value)}
                            placeholder="Describe primary symptoms, e.g., 'Coughing and showing lethargy for past 2 days...'"
                            className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none h-20 resize-none"
                            required
                          ></textarea>
                        </div>

                        {/* Estimated Fee Card */}
                        <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl flex justify-between items-center text-[11px]">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-amber-800 uppercase text-[9px] block">Estimated Base Fee</span>
                            <span className="text-slate-600 font-medium">Included: clinical diagnosis & standard sanitization.</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-slate-800 block">
                              LKR {bookType === "Vaccination" ? "3,000" : "2,500"}
                            </span>
                            <span className="text-[9px] text-amber-600 block font-bold uppercase">Before treatment</span>
                          </div>
                        </div>

                        <button
                          id="submit-book-btn"
                          type="submit"
                          className={`w-full py-2.5 ${themeStyles.primary} ${themeStyles.buttonHover} text-white font-bold rounded-xl text-xs shadow-md transition-transform active:scale-[0.98]`}
                        >
                          Confirm Clinical Booking
                        </button>
                      </>
                    )}
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: PRODUCTS STORE & SHOP */}
          {activeTab === "shop" && (
            <motion.div
              id="shop-tab"
              key="shop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Direct Purchase Store</h2>
                  <p className="text-xs text-gray-500">Order recommended pet food, supplements, shampoos, and supplies directly</p>
                </div>
                
                {/* Search Bar */}
                <div className="w-full md:w-60 shrink-0">
                  <input
                    type="text"
                    placeholder="Search product inventory..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filters conforming to Material 3 tabs/pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
                {["All", "Supplies", "Medication", "Vaccine"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setShopCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      shopCategory === cat 
                        ? `${themeStyles.primary} text-white ${themeStyles.primaryBorder}` 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {cat === "All" ? "All Products" : cat === "Supplies" ? "Food & Toys" : cat}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/60 shadow-sm">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold">No products match your filters.</p>
                  <p className="text-xs text-gray-400 mt-1">Try modifying your search term or selecting another category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="products-grid">
                  {filteredProducts.map((item) => {
                    const isLowStock = item.quantityInStock <= item.reorderLevel;
                    const isOutOfStock = item.quantityInStock === 0;

                    return (
                      <div 
                        key={item.itemID} 
                        className="bg-white rounded-[24px] border border-gray-200/40 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
                        id={`product-card-${item.itemID}`}
                      >
                        {/* Category badge */}
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          
                          {isOutOfStock ? (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md uppercase">
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase animate-pulse">
                              Low stock: {item.quantityInStock} left
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-md uppercase">
                              In stock: {item.quantityInStock}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 my-2">
                          <h3 className="font-extrabold text-sm text-gray-800 leading-tight">
                            {item.itemName}
                          </h3>
                          <p className="text-[10px] text-gray-400">
                            Unit measurement: <span className="font-semibold">{item.unit}</span>
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-3">
                          <div>
                            <span className="text-[9px] block text-gray-400 uppercase font-extrabold">Price</span>
                            <span className={`text-base font-extrabold ${themeStyles.textPrimary}`}>
                              LKR {(item.price ?? 0).toLocaleString()}
                            </span>
                          </div>

                          <button
                            disabled={isOutOfStock}
                            onClick={() => {
                              setCheckoutItem(item);
                              setCheckoutQty(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-transform ${
                              isOutOfStock 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : `${themeStyles.primary} text-white hover:opacity-90 active:scale-[0.97]`
                            }`}
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: PAYMENTS & BILLING TAB */}
          {activeTab === "billing" && (
            <motion.div
              id="billing-tab"
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              
              {/* Top Outstanding balance overview banner */}
              <div className="bg-slate-900 text-white rounded-[28px] p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 select-none">
                  <Coins className="w-40 h-40 transform translate-x-10 translate-y-10" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block">Account Balance Due</span>
                  <h3 className="text-3xl font-extrabold font-display tracking-tight text-white">
                    LKR {(totalOutstandingBalance ?? 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-gray-400">
                    For outstanding treatments, appointments, and store products ordered
                  </p>
                </div>

                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs text-slate-200">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] block uppercase text-slate-400 font-extrabold">Total Invoices</span>
                      <span className="font-bold text-white">
                        {invoices.filter(inv => {
                          if (inv.purchaseDetails) return true;
                          if (inv.appointmentID) {
                            const appt = appointments.find(a => a.appointmentID === inv.appointmentID);
                            return appt && ownerPets.some(p => p.petID === appt.petID);
                          }
                          return false;
                        }).length}
                      </span>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <span className="text-[9px] block uppercase text-slate-400 font-extrabold">Pending Bills</span>
                      <span className="font-bold text-amber-300">
                        {pendingInvoices.length} outstanding
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Invoice History & Billing Receipts</h3>
                  <p className="text-[10px] text-gray-500">Track and pay bills instantly through secured LankaPay Gateway</p>
                </div>
                <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl">
                  {(["All", "Pending", "Paid"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setBillingFilter(f)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        billingFilter === f ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Invoices belonging to user */}
              {invoices.filter(inv => {
                // filter by ownership
                let belongs = false;
                if (inv.purchaseDetails) belongs = true; // direct purchase matches current owner
                if (inv.appointmentID) {
                  const appt = appointments.find(a => a.appointmentID === inv.appointmentID);
                  if (appt && ownerPets.some(p => p.petID === appt.petID)) belongs = true;
                }
                
                if (!belongs) return false;

                // filter by status
                if (billingFilter === "Pending" && inv.paymentStatus !== "Pending") return false;
                if (billingFilter === "Paid" && inv.paymentStatus !== "Paid") return false;

                return true;
              }).length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/60 shadow-sm">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold">No invoices found for this section.</p>
                  <p className="text-xs text-gray-400 mt-1">If you book a consultation or check out a pet product, invoices will lock here.</p>
                </div>
              ) : (
                <div className="space-y-3" id="billing-list">
                  {invoices
                    .filter(inv => {
                      let belongs = false;
                      if (inv.purchaseDetails) belongs = true;
                      if (inv.appointmentID) {
                        const appt = appointments.find(a => a.appointmentID === inv.appointmentID);
                        if (appt && ownerPets.some(p => p.petID === appt.petID)) belongs = true;
                      }
                      if (!belongs) return false;
                      if (billingFilter === "Pending" && inv.paymentStatus !== "Pending") return false;
                      if (billingFilter === "Paid" && inv.paymentStatus !== "Paid") return false;
                      return true;
                    })
                    .sort((a, b) => b.invoiceID - a.invoiceID)
                    .map((invoice) => {
                      const isProduct = !!invoice.purchaseDetails;
                      const appt = !isProduct ? appointments.find(a => a.appointmentID === invoice.appointmentID) : null;
                      const petName = appt ? (pets.find(p => p.petID === appt.petID)?.petName || "Pet") : "Store Direct";

                      return (
                        <div 
                          key={invoice.invoiceID} 
                          className="bg-white rounded-2xl border border-gray-200/50 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                          id={`invoice-item-${invoice.invoiceID}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-gray-800 text-xs">
                                {isProduct ? "Pharmacy / Store Item" : `Clinical Visit (${petName})`}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                Invoice #{invoice.invoiceID}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {isProduct ? invoice.purchaseDetails : `Consultation & booster diagnosis fee under care session #${invoice.appointmentID}`}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Issued Date: <span className="font-semibold">{invoice.dateIssued}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0 border-gray-100">
                            <div className="text-left sm:text-right">
                              <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Bill Amount</span>
                              <span className="text-sm font-extrabold text-gray-800 block">
                                LKR {(invoice.totalAmount ?? 0).toLocaleString()}
                              </span>
                            </div>

                            {invoice.paymentStatus === "Paid" && (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[9px] uppercase">
                                  PAID via {invoice.paymentMethod || "Online"}
                                </span>
                                <button
                                  onClick={() => setViewedReceipt(invoice)}
                                  className="p-1 text-slate-500 hover:text-slate-800 transition"
                                  title="View digital receipt"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {invoice.paymentStatus === "Cancelled" && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-extrabold text-[9px] uppercase">
                                CANCELLED
                              </span>
                            )}

                            {invoice.paymentStatus === "Pending" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to cancel this order/invoice?")) {
                                      onCancelInvoice(invoice.invoiceID);
                                    }
                                  }}
                                  className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => setSelectedInvoiceToPay(invoice)}
                                  className={`px-4 py-1.5 ${themeStyles.primary} text-white font-extrabold rounded-xl text-xs shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98]`}
                                >
                                  Pay Now
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Android 13 Interactive Gesture Navigation Bar Bar overlay */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-400/70 rounded-full z-40 select-none pointer-events-none" id="android-gesture-indicator"></div>

      {/* Modal: Add Pet Profile Form */}
      {showAddPetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 rounded-inner" id="add-pet-modal">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100">
            <div className={`${themeStyles.primary} text-white p-4`}>
              <span className="text-[9px] uppercase font-bold text-white/70 block tracking-wider">Patient Administration</span>
              <h3 className="font-extrabold text-base">Register New Pet Profile</h3>
            </div>

            <form onSubmit={handleCreatePet} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Pet Name</label>
                  <input
                    id="add-pet-name"
                    type="text"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="e.g., Buster, Lucy"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Species</label>
                  <select
                    id="add-pet-species"
                    value={newPetSpecies}
                    onChange={(e) => setNewPetSpecies(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Bird">Bird</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Breed</label>
                  <input
                    id="add-pet-breed"
                    type="text"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                    placeholder="e.g., Persian, Golden Ret."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Date of Birth</label>
                  <input
                    id="add-pet-dob"
                    type="date"
                    value={newPetDob}
                    onChange={(e) => setNewPetDob(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Sex</label>
                  <select
                    id="add-pet-sex"
                    value={newPetSex}
                    onChange={(e) => setNewPetSex(e.target.value as "Male" | "Female")}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Weight (kg)</label>
                  <input
                    id="add-pet-weight"
                    type="number"
                    step="0.1"
                    value={newPetWeight}
                    onChange={(e) => setNewPetWeight(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Microchip No.</label>
                  <input
                    id="add-pet-microchip"
                    type="text"
                    value={newPetMicrochip}
                    onChange={(e) => setNewPetMicrochip(e.target.value)}
                    placeholder="e.g. 9810..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Known Allergies</label>
                <input
                  id="add-pet-allergies"
                  type="text"
                  value={newPetAllergies}
                  onChange={(e) => setNewPetAllergies(e.target.value)}
                  placeholder="Leave empty or type 'None' if none"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  id="add-pet-cancel"
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  id="add-pet-save"
                  type="submit"
                  className={`px-4 py-2 ${themeStyles.primary} text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-sm`}
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detailed Medical Record */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 rounded-inner" id="record-detail-modal">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-4">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-widest">Official Clinic Record</span>
              <h3 className="font-extrabold text-sm">Consultation Medical Document</h3>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="border border-gray-100 p-3 rounded-2xl bg-slate-50/80 flex justify-between text-[11px] font-medium text-gray-600">
                <div>
                  <span className="text-[9px] block text-gray-400 font-extrabold uppercase">Patient Profile</span>
                  <span className="font-bold text-gray-800">{selectedRecord.pet.petName}</span> ({selectedRecord.pet.breed})
                </div>
                <div className="text-right">
                  <span className="text-[9px] block text-gray-400 font-extrabold uppercase">Attending Doctor</span>
                  <span className="font-bold text-gray-800">{selectedRecord.vet.fullName}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wide">Diagnosis Code</span>
                  <p className="font-mono text-gray-800 font-bold mt-0.5">{selectedRecord.record.diagnosisCode}</p>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wide">Observed Clinical Findings</span>
                  <p className="text-gray-700 leading-relaxed bg-amber-50/50 p-2.5 border border-amber-100/30 rounded-xl mt-0.5 italic">
                    "{selectedRecord.record.clinicalFindings}"
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wide">Prescribed Treatment Plan</span>
                  <p className="text-gray-800 font-bold mt-0.5 bg-slate-100 p-2 rounded-xl text-[11px]">{selectedRecord.record.treatmentPlan}</p>
                </div>

                {/* Digital Signature */}
                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] text-gray-400">Practitioner Licence</span>
                    <p className="font-mono text-gray-600 font-semibold">{selectedRecord.vet.licenceNo}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic text-gray-400 block text-xs leading-none">{selectedRecord.vet.fullName}</span>
                    <span className="text-[8px] text-gray-400 block border-t border-gray-100 mt-1 uppercase font-bold">Authorized Doctor</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button
                id="close-record-modal-btn"
                onClick={() => setSelectedRecord(null)}
                className={`px-4 py-1.5 ${themeStyles.primary} text-white rounded-xl font-bold text-xs hover:opacity-95`}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Product Direct Purchase Checkout Drawer */}
      <AnimatePresence>
        {checkoutItem && (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 rounded-inner" id="checkout-drawer-modal">
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-[#FAF9F6] text-slate-800 rounded-t-[32px] w-full max-w-md p-5 shadow-2xl border-t border-gray-200/50 flex flex-col space-y-4"
              id="android13-checkout-drawer"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-1 pointer-events-none"></div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-widest">Verify Order Summary</span>
                  <h3 className="font-extrabold text-base text-slate-800">{checkoutItem.itemName}</h3>
                  <p className="text-xs text-slate-400">Unit pricing: LKR {(checkoutItem.price ?? 0).toLocaleString()} per {checkoutItem.unit}</p>
                </div>
                <button 
                  onClick={() => setCheckoutItem(null)} 
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold"
                >
                  ×
                </button>
              </div>

              {purchaseSuccess ? (
                <div className="p-6 text-center space-y-3 flex flex-col items-center justify-center">
                  <div className={`w-14 h-14 rounded-full ${themeStyles.bgLight} ${themeStyles.textLight} flex items-center justify-center animate-bounce shadow`}>
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800">Order Placed Successfully!</h4>
                    <p className="text-xs text-slate-500 mt-1">Pending Invoice generated. We are routing you to settle payments immediately...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-gray-100 text-xs">
                    
                    {/* Quantity Selector */}
                    <div className="flex justify-between items-center py-1">
                      <span className="font-bold text-gray-700">Purchase Quantity:</span>
                      <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                        <button
                          disabled={checkoutQty <= 1}
                          onClick={() => setCheckoutQty(prev => prev - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 font-extrabold shadow-xs flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-sm text-slate-800 w-6 text-center">{checkoutQty}</span>
                        <button
                          disabled={checkoutQty >= checkoutItem.quantityInStock}
                          onClick={() => setCheckoutQty(prev => prev + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 font-extrabold shadow-xs flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Calculated Billing */}
                    <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between text-gray-500 font-medium">
                        <span>Subtotal:</span>
                        <span>LKR {((checkoutItem.price ?? 0) * checkoutQty).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 font-medium">
                        <span>Clinic Service tax (0%):</span>
                        <span>LKR 0</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-1 border-t border-gray-100">
                        <span>Total Due Amount:</span>
                        <span className={themeStyles.accentText}>LKR {((checkoutItem.price ?? 0) * checkoutQty).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleCheckoutConfirm}
                      className={`w-full py-2.5 ${themeStyles.primary} text-white font-bold rounded-2xl text-xs shadow-md transition-transform active:scale-[0.98]`}
                    >
                      Confirm Order & Issue Invoice
                    </button>
                    <button
                      onClick={() => setCheckoutItem(null)}
                      className="w-full py-2.5 bg-gray-200/80 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition"
                    >
                      Cancel Checkout
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Android 13 Secured Payment Processing Bottom Drawer */}
      <AnimatePresence>
        {selectedInvoiceToPay && (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 rounded-inner" id="payment-gate-modal">
            <motion.div 
              initial={{ y: 350 }}
              animate={{ y: 0 }}
              exit={{ y: 350 }}
              className="bg-[#FAF9F6] text-slate-800 rounded-t-[32px] w-full max-w-md p-5 shadow-2xl border-t border-gray-200/50 flex flex-col space-y-4"
              id="payment-portal-drawer"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-1 pointer-events-none"></div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-emerald-600 block tracking-widest font-mono flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Secured LankaPay Gateway
                  </span>
                  <h3 className="font-extrabold text-base text-slate-800">Authorize Digital Billing Settle</h3>
                  <p className="text-xs text-slate-400">Settling Invoice ID #{selectedInvoiceToPay.invoiceID}</p>
                </div>
                <button 
                  disabled={paymentProcessing}
                  onClick={() => setSelectedInvoiceToPay(null)} 
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold"
                >
                  ×
                </button>
              </div>

              {paymentSuccess ? (
                <div className="p-6 text-center space-y-3 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce shadow">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800">Authorized & Settle Completed!</h4>
                    <p className="text-xs text-slate-500 mt-1">LKR {(selectedInvoiceToPay.totalAmount ?? 0).toLocaleString()} has been securely settled. Receipt updated.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthorizePayment} className="space-y-4 text-xs">
                  
                  {/* Payment Mode Selector */}
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1.5">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "Card", label: "Credit/Debit" },
                        { id: "Online", label: "Bank Transfer" },
                        { id: "eZCash", label: "eZ Cash / Wallet" }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMethod(mode.id as any)}
                          className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                            paymentMethod === mode.id 
                              ? `${themeStyles.primary} text-white ${themeStyles.primaryBorder}` 
                              : "bg-white border-gray-200 text-slate-600 hover:bg-gray-50"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === "Card" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Name on Card</label>
                        <input
                          type="text"
                          defaultValue="NIMAL PERERA"
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4503 9012 3456 7890"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19))}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono text-slate-800 font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="09/29"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono text-slate-800 font-bold focus:outline-none text-center"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">CVV / CVN</label>
                          <input
                            type="password"
                            placeholder="***"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.slice(0, 3))}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono text-slate-800 font-bold focus:outline-none text-center"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : paymentMethod === "Online" ? (
                    <div className="p-3 bg-slate-50 border border-gray-200 rounded-2xl space-y-1 text-slate-600">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 block">Bank Link Verification</span>
                      <p className="font-medium leading-relaxed">
                        Redirects dynamically to LankaPay Bank portal to complete instant transfer authorization from:
                      </p>
                      <p className="font-extrabold text-slate-800 font-mono">NIMAL PERERA - Sampath Bank A/C ****8201</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase block mb-1">Mobile Dialog Number</label>
                      <input
                        type="text"
                        defaultValue="0775522668"
                        placeholder="077XXXXXXX"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none"
                        required
                      />
                      <p className="text-[10px] text-gray-400 italic">eZ Cash mobile balance will be charged instantly upon PIN validation.</p>
                    </div>
                  )}

                  {/* Pricing Total Due block */}
                  <div className="bg-slate-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-600">Authorizing Payment:</span>
                    <span className={`text-base font-extrabold ${themeStyles.textPrimary}`}>
                      LKR {(selectedInvoiceToPay.totalAmount ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className={`w-full py-2.5 ${themeStyles.primary} text-white font-extrabold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2`}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Authorizing Transaction...</span>
                      </>
                    ) : (
                      <span>Settle & Pay LKR {(selectedInvoiceToPay.totalAmount ?? 0).toLocaleString()}</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Interactive Digital Receipt Detail */}
      <AnimatePresence>
        {viewedReceipt && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 rounded-inner" id="receipt-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] max-w-xs w-full shadow-2xl border border-gray-100 overflow-hidden text-xs text-slate-800"
              id="digital-receipt-document"
            >
              {/* Receipt Header */}
              <div className="bg-slate-900 text-white p-5 text-center space-y-1 relative">
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold block">Official Billing Receipt</span>
                <h4 className="text-sm font-extrabold">Matara Veterinary Clinic</h4>
                <p className="text-[10px] text-slate-400">Sri Lanka • Tel: 041-2223094</p>
                <div className="absolute top-2 right-2">
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded">
                    PAID
                  </span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-5 space-y-4 font-sans">
                <div className="space-y-1.5 pb-3 border-b border-gray-100 text-[11px]">
                  <div className="flex justify-between text-gray-500">
                    <span>Invoice Ref:</span>
                    <span className="font-mono font-bold text-gray-800">#INV-{viewedReceipt.invoiceID}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Payment Mode:</span>
                    <span className="font-bold text-gray-800">{viewedReceipt.paymentMethod || "Online / LankaPay"}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Transaction Date:</span>
                    <span className="font-bold text-gray-800">{viewedReceipt.dateIssued}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Billed To:</span>
                    <span className="font-bold text-gray-800">Nimal Perera</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase text-slate-400 font-extrabold block tracking-wider">Item Details</span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100/50 space-y-1.5">
                    <div className="flex justify-between font-bold text-gray-800 text-[11px]">
                      <span>
                        {viewedReceipt.purchaseDetails 
                          ? "Direct Store Product Purchase" 
                          : `Clinical consultation session #${viewedReceipt.appointmentID}`}
                      </span>
                      <span>LKR {(viewedReceipt.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    {viewedReceipt.purchaseDetails && (
                      <p className="text-[10px] text-gray-500 italic">
                        {viewedReceipt.purchaseDetails}
                      </p>
                    )}
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>Discounts applied:</span>
                      <span>LKR 0</span>
                    </div>
                  </div>
                </div>

                {/* Big Total */}
                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-sm font-extrabold text-slate-800">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">LKR {(viewedReceipt.totalAmount ?? 0).toLocaleString()}</span>
                </div>

                {/* Footer QR code symbol representation */}
                <div className="text-center pt-2 space-y-2">
                  <div className="w-16 h-16 bg-slate-100 border border-gray-200/50 rounded-lg mx-auto flex flex-wrap p-1 gap-1 items-center justify-center opacity-60">
                    {/* Mock QR dots */}
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
                  </div>
                  <p className="text-[9px] text-gray-400 italic">
                    Digital token secured via LankaPay Core API
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-3 bg-slate-50 border-t border-gray-100 text-center">
                <button
                  onClick={() => setViewedReceipt(null)}
                  className="w-full py-1.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tab Navigation styled as a modern Material 3 Bottom Navigation bar */}
      <nav 
        className="bg-white border-t border-slate-100 flex justify-around items-center h-16 shrink-0 z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] px-1 overflow-x-auto scrollbar-none"
        id="owner-navbar"
      >
        {[
          { id: "pets", label: "My Pets", icon: HeartPulse },
          { id: "appointments", label: "Appointments", icon: Calendar },
          { id: "health", label: "Health", icon: FileText },
          { id: "book", label: "Book", icon: ClipboardList },
          { id: "shop", label: "Store", icon: ShoppingBag },
          { id: "billing", label: "Bills", icon: CreditCard }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "book" && ownerPets.length > 0 && !bookPetID) {
                  setBookPetID(ownerPets[0].petID);
                }
              }}
              className="flex-1 min-w-[52px] h-full flex flex-col items-center justify-center relative transition-all"
            >
              <div className={`px-4 py-1.5 rounded-full transition-all flex items-center justify-center relative ${
                isActive 
                  ? "bg-blue-100/80 text-[#1A73E8]" 
                  : "text-slate-400 hover:bg-slate-100/50 hover:text-slate-600"
              }`}>
                <IconComponent className="w-5 h-5 shrink-0" />
                {tab.id === "billing" && pendingInvoices.length > 0 && (
                  <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className={`text-[9px] mt-1 tracking-tight font-bold transition-all ${
                isActive ? "text-[#1A73E8] font-black" : "text-slate-500"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
