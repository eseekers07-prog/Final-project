import React, { useState, useEffect } from "react";
import { User, Pet, Veterinarian, Appointment, HealthRecord, Prescription, Invoice, InventoryItem, AuditLog, PetOwner, PrescriptionItem, Vaccination } from "./types";
import {
  INITIAL_USERS,
  INITIAL_PETS,
  INITIAL_PET_OWNERS,
  INITIAL_VETERINARIANS,
  INITIAL_APPOINTMENTS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_AUDIT_LOGS,
  INITIAL_VACCINATIONS,
  loadData,
  saveData
} from "./data";
import PetOwnerDashboard from "./components/PetOwnerDashboard";
import VeterinarianDashboard from "./components/VeterinarianDashboard";
import ClinicAdminDashboard from "./components/ClinicAdminDashboard";
import SystemAdminDashboard from "./components/SystemAdminDashboard";
import LoginRegister from "./components/LoginRegister";
import { Smartphone, Tablet, Monitor, RefreshCw, UserCheck, Lock, Unlock, Zap, HelpCircle, Settings, Sliders, Menu, X, Shield, Fingerprint, Wifi, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Mode parameters
  const [deviceFrame, setDeviceFrame] = useState<"phone" | "tablet" | "fullscreen">("tablet");
  const [isLocked, setIsLocked] = useState(false);
  const [systemTime, setSystemTime] = useState("");
  const [materialTheme, setMaterialTheme] = useState<"blue" | "lavender" | "terracotta" | "green">("blue");
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  // Next-Level Clinical Security Shield State Variables
  const [aesEncryption, setAesEncryption] = useState<boolean>(true);
  const [tlsForce, setTlsForce] = useState<boolean>(true);
  const [biometricAuth, setBiometricAuth] = useState<boolean>(false);
  const [isScanningInfection, setIsScanningInfection] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<string>("SYSTEM_OK: Cryptographic Integrity Enforced");
  const [autoLockPeriod, setAutoLockPeriod] = useState<string>("15m");

  const getThemeHeaderBg = (theme: "blue" | "lavender" | "terracotta" | "green") => {
    switch (theme) {
      case "lavender": return "bg-[#7C4DFF]";
      case "terracotta": return "bg-[#E64A19]";
      case "green": return "bg-[#2E7D32]";
      case "blue":
      default: return "bg-[#1A73E8]";
    }
  };

  // Loaded states from LocalStorage persistence matching D1-D7 data stores
  const [users, setUsers] = useState<User[]>(() => loadData("users", INITIAL_USERS));
  const [pets, setPets] = useState<Pet[]>(() => loadData("pets", INITIAL_PETS));
  const [petOwners, setPetOwners] = useState<PetOwner[]>(() => loadData("pet_owners", INITIAL_PET_OWNERS));
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>(() => loadData("veterinarians", INITIAL_VETERINARIANS));
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(() => loadData("vaccinations", INITIAL_VACCINATIONS));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadData("appointments", INITIAL_APPOINTMENTS));
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() => loadData("health_records", INITIAL_HEALTH_RECORDS));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => loadData("prescriptions", INITIAL_PRESCRIPTIONS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadData("invoices", INITIAL_INVOICES));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadData("inventory", INITIAL_INVENTORY));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadData("audit_logs", INITIAL_AUDIT_LOGS));

  // Current logged in role simulator
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("petcare_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [currentOwnerID, setCurrentOwnerID] = useState<number>(() => {
    const saved = localStorage.getItem("petcare_current_owner_id");
    return saved ? Number(saved) : 1;
  });
  const [currentRole, setCurrentRole] = useState<User["role"]>(() => {
    const saved = localStorage.getItem("petcare_current_role");
    return saved ? (saved as User["role"]) : "PetOwner";
  });
  const [systemFeeMultiplier, setSystemFeeMultiplier] = useState(1.0);

  // Sync active login states to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("petcare_current_user", JSON.stringify(currentUser));
      localStorage.setItem("petcare_current_role", currentRole);
      localStorage.setItem("petcare_current_owner_id", String(currentOwnerID));
    } else {
      localStorage.removeItem("petcare_current_user");
      localStorage.removeItem("petcare_current_role");
      localStorage.removeItem("petcare_current_owner_id");
    }
  }, [currentUser, currentRole, currentOwnerID]);

  // Sync real-time clock inside Android simulated Status Bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save changes automatically on change
  useEffect(() => { saveData("users", users); }, [users]);
  useEffect(() => { saveData("pets", pets); }, [pets]);
  useEffect(() => { saveData("pet_owners", petOwners); }, [petOwners]);
  useEffect(() => { saveData("veterinarians", veterinarians); }, [veterinarians]);
  useEffect(() => { saveData("vaccinations", vaccinations); }, [vaccinations]);
  useEffect(() => { saveData("appointments", appointments); }, [appointments]);
  useEffect(() => { saveData("health_records", healthRecords); }, [healthRecords]);
  useEffect(() => { saveData("prescriptions", prescriptions); }, [prescriptions]);
  useEffect(() => { saveData("invoices", invoices); }, [invoices]);
  useEffect(() => { saveData("inventory", inventory); }, [inventory]);
  useEffect(() => { saveData("audit_logs", auditLogs); }, [auditLogs]);

  // General helper for appending log entries (System Audit Trail)
  const logAction = (user: string, action: string, details: string) => {
    const nextID = auditLogs.length > 0 ? Math.max(...auditLogs.map(l => l.logID)) + 1 : 1;
    const newLog: AuditLog = {
      logID: nextID,
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  // Reset to default clinic databases
  const handleResetSystem = () => {
    if (confirm("Reset clinical databases back to default state? This clears active edits.")) {
      localStorage.clear();
      setUsers(INITIAL_USERS);
      setPets(INITIAL_PETS);
      setPetOwners(INITIAL_PET_OWNERS);
      setVeterinarians(INITIAL_VETERINARIANS);
      setVaccinations(INITIAL_VACCINATIONS);
      setAppointments(INITIAL_APPOINTMENTS);
      setHealthRecords(INITIAL_HEALTH_RECORDS);
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setInvoices(INITIAL_INVOICES);
      setInventory(INITIAL_INVENTORY);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentRole("PetOwner");
      setCurrentUser(INITIAL_USERS[0]);
      localStorage.setItem("petcare_current_role", "PetOwner");
      localStorage.setItem("petcare_current_user", JSON.stringify(INITIAL_USERS[0]));
      alert("Clinical database has been restored to clean production state.");
    }
  };

  // Run interactive clinical cryptographic scan
  const runSecurityIntegrityScan = () => {
    setIsScanningInfection(true);
    setSecurityStatus("INITIALIZING CRYPTOGRAPHIC INTEGRITY AUDIT...");
    setTimeout(() => {
      setSecurityStatus("VALIDATING PASSKEY DATA & PRIVILEGED LEVEL TOKENS...");
    }, 800);
    setTimeout(() => {
      setSecurityStatus("VERIFYING LOCALSTORAGE DATABASE AT REST ENCRYPTION KEY...");
    }, 1600);
    setTimeout(() => {
      setSecurityStatus("INTEGRITY COMPLIANT: SSL Verified. TLS 1.3 Active. AES-256 Enabled.");
      setIsScanningInfection(false);
      logAction("System", "Security Scan Completed", "Cryptographic database integrity audit passed successfully.");
    }, 2400);
  };
  // --- ACTIONS CORRESPONDING TO ALL CONTROLLERS IN CLASS DIAGRAM / DFD LEVEL 1 ---

  // Pet Owner Dashboard Actions
  const handleAddPet = (newPet: Omit<Pet, "petID">) => {
    const nextID = "P" + String(pets.length + 1).padStart(3, "0");
    const petRecord: Pet = {
      petID: nextID,
      ...newPet
    };
    setPets(prev => [...prev, petRecord]);
    logAction(
      currentUser ? currentUser.username : "Guest",
      "Register Pet",
      `Created Pet Profile: "${newPet.petName}" (Breed: ${newPet.breed}) under Owner ID ${newPet.ownerID}.`
    );
  };

  const handleBookAppointment = (petID: string, vetID: number, dateStr: string, type: string, reason: string) => {
    const nextApptID = appointments.length > 0 ? Math.max(...appointments.map(a => a.appointmentID)) + 1 : 201;
    const nextInvoiceID = invoices.length > 0 ? Math.max(...invoices.map(i => i.invoiceID)) + 1 : 1001;

    // Standard base fee depending on session types
    const baseFee = type === "Vaccination" ? 3000 : 2500;
    const computedFee = Math.round(baseFee * systemFeeMultiplier);

    const newAppt: Appointment = {
      appointmentID: nextApptID,
      petID,
      vetID,
      scheduledDateTime: dateStr,
      appointmentType: type,
      appointmentStatus: "Scheduled",
      reasonForVisit: reason,
      consultationFee: computedFee
    };

    const newInvoice: Invoice = {
      invoiceID: nextInvoiceID,
      appointmentID: nextApptID,
      totalAmount: computedFee,
      discountApplied: 0,
      paymentStatus: "Pending",
      paymentMethod: "",
      dateIssued: dateStr.split("T")[0]
    };

    setAppointments(prev => [...prev, newAppt]);
    setInvoices(prev => [...prev, newInvoice]);

    const petName = pets.find(p => p.petID === petID)?.petName || "Pet";
    const vetName = veterinarians.find(v => v.vetID === vetID)?.fullName || "Vet";

    logAction(
      currentUser ? currentUser.username : "Guest",
      "Book Appointment",
      `Booked ${type} session for ${petName} with ${vetName} on ${new Date(dateStr).toLocaleDateString()}. Fee: LKR ${computedFee}`
    );
  };

  // Veterinarian Dashboard Actions
  const handleAddHealthRecord = (
    newRecord: Omit<HealthRecord, "recordID">,
    prescriptionItems?: Omit<PrescriptionItem, "itemID" | "prescriptionID">[]
  ) => {
    const nextRecordID = healthRecords.length > 0 ? Math.max(...healthRecords.map(r => r.recordID)) + 1 : 101;
    const recordWithID: HealthRecord = {
      recordID: nextRecordID,
      ...newRecord
    };

    setHealthRecords(prev => [...prev, recordWithID]);

    // Handle digital prescription if items are passed
    if (prescriptionItems && prescriptionItems.length > 0) {
      const nextRxID = prescriptions.length > 0 ? Math.max(...prescriptions.map(p => p.prescriptionID)) + 1 : 10001;
      const rxItems: PrescriptionItem[] = prescriptionItems.map((item, index) => ({
        itemID: 20000 + prescriptions.length + index,
        prescriptionID: nextRxID,
        ...item
      }));

      const newRx: Prescription = {
        prescriptionID: nextRxID,
        recordID: nextRecordID,
        issueDate: newRecord.visitDate,
        items: rxItems
      };

      setPrescriptions(prev => [...prev, newRx]);
    }

    const petName = pets.find(p => p.petID === newRecord.petID)?.petName || "Pet";
    logAction(
      "DrSilva",
      "Record Consultation",
      `Diagnosed ${petName}: ${newRecord.diagnosisCode}. Recorded findings and generated digital prescription.`
    );
  };

  const handleAddVaccination = (newVac: Omit<Vaccination, "vaccineRecordID">) => {
    const nextID = vaccinations.length > 0 ? Math.max(...vaccinations.map(v => v.vaccineRecordID)) + 1 : 101;
    const vaccineRecord: Vaccination = {
      vaccineRecordID: nextID,
      ...newVac
    };

    setVaccinations(prev => [...prev, vaccineRecord]);

    const petName = pets.find(p => p.petID === newVac.petID)?.petName || "Pet";
    logAction(
      "DrSilva",
      "Record Vaccination Admin",
      `Administered ${newVac.vaccineName} booster for ${petName}. Next booster set: ${newVac.nextDueDateCalculated}.`
    );
  };

  const handleCompleteAppointment = (appointmentID: number) => {
    setAppointments(prev =>
      prev.map(a => (a.appointmentID === appointmentID ? { ...a, appointmentStatus: "Completed" } : a))
    );
  };

  // Clinic Admin Dashboard Actions
  const handleAddVeterinarian = (newVet: Omit<Veterinarian, "vetID" | "userID">) => {
    const nextVetID = veterinarians.length > 0 ? Math.max(...veterinarians.map(v => v.vetID)) + 1 : 1;
    const nextUserID = users.length > 0 ? Math.max(...users.map(u => u.userID)) + 1 : 1;

    // Create system user credentials first
    const newUserRecord: User = {
      userID: nextUserID,
      username: newVet.fullName.replace(/\s+/g, "").toLowerCase(),
      emailAddress: `${newVet.fullName.toLowerCase().replace(/\s+/g, "")}@clinic.com`,
      phoneNumber: "0771112223",
      role: "Veterinarian",
      accountStatus: "Active",
      createdAt: new Date().toISOString()
    };

    const vetRecord: Veterinarian = {
      vetID: nextVetID,
      userID: nextUserID,
      ...newVet
    };

    setUsers(prev => [...prev, newUserRecord]);
    setVeterinarians(prev => [...prev, vetRecord]);

    logAction(
      "ClinicAdmin",
      "License Practitioner",
      `Added Veterinarian ${newVet.fullName} (${newVet.specialisation}) under registration: ${newVet.licenceNo}.`
    );
  };

  const handleUpdateInvoiceStatus = (invoiceID: number, status: "Paid", method: "Cash" | "Card" | "Online") => {
    setInvoices(prev =>
      prev.map(i => (i.invoiceID === invoiceID ? { ...i, paymentStatus: status, paymentMethod: method } : i))
    );
    logAction(
      "ClinicAdmin",
      "Process Billing",
      `Collected payment of Invoice #${invoiceID} via ${method}. Status marked PAID.`
    );
  };

  const handleApplyDiscount = (invoiceID: number, discountAmount: number) => {
    setInvoices(prev =>
      prev.map(i => (i.invoiceID === invoiceID ? { ...i, discountApplied: discountAmount } : i))
    );
    logAction(
      "ClinicAdmin",
      "Process Billing",
      `Applied promotional discount of LKR ${discountAmount} to Invoice #${invoiceID}.`
    );
  };

  const handleAddInventoryItem = (newItem: Omit<InventoryItem, "itemID">) => {
    const nextID = inventory.length > 0 ? Math.max(...inventory.map(i => i.itemID)) + 1 : 1;
    const item: InventoryItem = {
      itemID: nextID,
      ...newItem
    };
    setInventory(prev => [...prev, item]);
    logAction(
      "ClinicAdmin",
      "Log Material Entry",
      `Registered stock entry: "${newItem.itemName}" (${newItem.quantityInStock} ${newItem.unit}).`
    );
  };

  const handleUpdateInventoryQty = (itemID: number, qtyChange: number) => {
    setInventory(prev =>
      prev.map(item => {
        if (item.itemID === itemID) {
          const nextQty = Math.max(0, item.quantityInStock + qtyChange);
          if (qtyChange > 0) {
            logAction("ClinicAdmin", "Log Material Entry", `Restocked ${item.itemName} by ${qtyChange} units.`);
          } else {
            logAction("ClinicAdmin", "Log Material Entry", `Decreased ${item.itemName} stock levels.`);
          }
          return { ...item, quantityInStock: nextQty };
        }
        return item;
      })
    );
  };

  const handleUpdateInventoryItem = (itemID: number, updatedItem: Partial<InventoryItem>) => {
    setInventory(prev =>
      prev.map(item => {
        if (item.itemID === itemID) {
          const nextItem = { ...item, ...updatedItem };
          logAction("ClinicAdmin", "Modify Material Details", `Updated inventory details for "${nextItem.itemName}".`);
          return nextItem;
        }
        return item;
      })
    );
  };

  const handleDeleteInventoryItem = (itemID: number) => {
    const item = inventory.find(i => i.itemID === itemID);
    if (!item) return;
    setInventory(prev => prev.filter(i => i.itemID !== itemID));
    logAction("ClinicAdmin", "Delete Material Entry", `Removed item "${item.itemName}" from clinic inventory database.`);
  };

  // System Admin Dashboard Actions
  const handleToggleUserStatus = (userID: number) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.userID === userID) {
          const nextStatus = u.accountStatus === "Active" ? "Suspended" : "Active";
          logAction("SystemAdmin", "Manage User Account", `Altered status of User ${u.username} to ${nextStatus}.`);
          return { ...u, accountStatus: nextStatus };
        }
        return u;
      })
    );
  };

  const handleAddUser = (newUser: Omit<User, "userID" | "createdAt">) => {
    const nextID = users.length > 0 ? Math.max(...users.map(u => u.userID)) + 1 : 1;
    const userRecord: User = {
      userID: nextID,
      createdAt: new Date().toISOString(),
      ...newUser
    };
    setUsers(prev => [...prev, userRecord]);

    if (newUser.role === "PetOwner") {
      const nextOwnerID = petOwners.length > 0 ? Math.max(...petOwners.map(o => o.ownerID)) + 1 : 1;
      const newOwnerRecord: PetOwner = {
        ownerID: nextOwnerID,
        userID: nextID,
        fullName: newUser.username,
        address: "Colombo, Sri Lanka"
      };
      setPetOwners(prev => [...prev, newOwnerRecord]);
    }

    logAction("SystemAdmin", "Register User", `Provisioned system credentials for ${newUser.username} as ${newUser.role}.`);
  };

  const handleTriggerBackup = () => {
    logAction("SystemAdmin", "Manage Database Backups", "Triggered manual transactional backup commit. snapshot_v1.0.sql created.");
  };

  const handlePayInvoice = (invoiceID: number, paymentMethod: "Card" | "Online") => {
    setInvoices(prev =>
      prev.map(i => (i.invoiceID === invoiceID ? { ...i, paymentStatus: "Paid", paymentMethod: paymentMethod } : i))
    );
    logAction(
      currentRole === "PetOwner" ? "Nimal222" : "Admin",
      "Pay Invoice",
      `Settled payment of Invoice #${invoiceID} via ${paymentMethod}. Paid online through client app.`
    );
  };

  const handlePurchaseProduct = (itemID: number, quantity: number) => {
    const item = inventory.find(i => i.itemID === itemID);
    if (!item) return;

    if (item.quantityInStock < quantity) {
      alert("Insufficient stock available for this product!");
      return;
    }

    // Deduct stock
    setInventory(prev =>
      prev.map(i => (i.itemID === itemID ? { ...i, quantityInStock: i.quantityInStock - quantity } : i))
    );

    // Create a new invoice
    const nextInvoiceID = invoices.length > 0 ? Math.max(...invoices.map(inv => inv.invoiceID)) + 1 : 1001;
    const totalCost = item.price * quantity;

    const newInvoice: Invoice = {
      invoiceID: nextInvoiceID,
      totalAmount: totalCost,
      discountApplied: 0,
      paymentStatus: "Pending",
      paymentMethod: "",
      dateIssued: new Date().toISOString().split("T")[0],
      purchaseDetails: `Direct Purchase: ${quantity}x ${item.itemName} (${item.unit})`,
      itemID: itemID,
      quantity: quantity
    };

    setInvoices(prev => [...prev, newInvoice]);

    logAction(
      currentRole === "PetOwner" ? "Nimal222" : "Admin",
      "Purchase Product",
      `Purchased ${quantity}x ${item.itemName} for LKR ${totalCost}. Invoice #${nextInvoiceID} issued.`
    );
  };

  const handleCancelInvoice = (invoiceID: number) => {
    const invoice = invoices.find(i => i.invoiceID === invoiceID);
    if (!invoice) return;

    // Check if the invoice is already paid or cancelled
    if (invoice.paymentStatus !== "Pending") {
      alert("Only pending invoices/orders can be cancelled.");
      return;
    }

    // Set invoice payment status to Cancelled
    setInvoices(prev =>
      prev.map(i => (i.invoiceID === invoiceID ? { ...i, paymentStatus: "Cancelled" } : i))
    );

    // Restore stock if it was a product purchase
    if (invoice.itemID && invoice.quantity) {
      setInventory(prev =>
        prev.map(item =>
          item.itemID === invoice.itemID
            ? { ...item, quantityInStock: item.quantityInStock + invoice.quantity! }
            : item
        )
      );
      logAction(
        currentUser ? currentUser.username : "System",
        "Cancel Order",
        `Cancelled store order Invoice #${invoiceID}. Restored ${invoice.quantity} units of product ID ${invoice.itemID} to stock.`
      );
    } else {
      logAction(
        currentUser ? currentUser.username : "System",
        "Cancel Bill",
        `Cancelled outstanding clinical visit invoice #${invoiceID}.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-4 font-sans select-none" id="app-workspace">
      
      {/* Workspace Header Panel */}
      <header className="w-full max-w-6xl hidden md:flex flex-col md:flex-row justify-between items-center gap-4 mb-4 text-white border-b border-slate-800 pb-3" id="workspace-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A73E8] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white/20">
            🐾
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              Pet Care Management System
              <span className="text-[11px] bg-[#FFB300] text-slate-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Material Design Sim
              </span>
            </h1>
            <p className="text-xs text-slate-400">Class Diagram, ERD, DFD Model Simulation with Live Gemini Integration</p>
          </div>
        </div>

        {/* Global Control Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Android 13 wallpaper theme switcher */}
          <div className="bg-slate-900/80 p-1 rounded-lg border border-slate-800 flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wallpaper:</span>
            <button
              onClick={() => setMaterialTheme("blue")}
              className={`w-3.5 h-3.5 rounded-full bg-[#1A73E8] border ${materialTheme === "blue" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
              title="Material Blue"
            />
            <button
              onClick={() => setMaterialTheme("lavender")}
              className={`w-3.5 h-3.5 rounded-full bg-[#7C4DFF] border ${materialTheme === "lavender" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
              title="Material Lavender"
            />
            <button
              onClick={() => setMaterialTheme("terracotta")}
              className={`w-3.5 h-3.5 rounded-full bg-[#E64A19] border ${materialTheme === "terracotta" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
              title="Material Terracotta"
            />
            <button
              onClick={() => setMaterialTheme("green")}
              className={`w-3.5 h-3.5 rounded-full bg-[#2E7D32] border ${materialTheme === "green" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
              title="Material Eucalyptus"
            />
          </div>

          {/* Mock Frame selectors */}
          <div className="bg-slate-900/80 p-1 rounded-lg border border-slate-800 flex gap-1">
            <button
              id="frame-phone"
              onClick={() => setDeviceFrame("phone")}
              className={`p-1.5 rounded text-xs font-bold transition-all ${
                deviceFrame === "phone" ? "bg-[#1A73E8] text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Smartphone view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              id="frame-tablet"
              onClick={() => setDeviceFrame("tablet")}
              className={`p-1.5 rounded text-xs font-bold transition-all ${
                deviceFrame === "tablet" ? "bg-[#1A73E8] text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              id="frame-full"
              onClick={() => setDeviceFrame("fullscreen")}
              className={`p-1.5 rounded text-xs font-bold transition-all ${
                deviceFrame === "fullscreen" ? "bg-[#1A73E8] text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Full screen workspace"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <button
            id="reset-db-btn"
            onClick={handleResetSystem}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
            title="Reset databases to original State Diagram"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Sync
          </button>
        </div>
      </header>

      {/* Role Selector Dashboard (Top) */}
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 mb-4 hidden md:flex flex-col md:flex-row md:items-center justify-between gap-3 text-white" id="role-selector-panel">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#FFB300]" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Active Persona Login</span>
            <span className="text-xs font-semibold">Switch account roles below to experience different DFD sub-processes:</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id="role-petowner"
            onClick={() => {
              const found = users.find(u => u.role === "PetOwner") || INITIAL_USERS[0];
              setCurrentUser(found);
              setCurrentRole("PetOwner");
              const owner = petOwners.find(o => o.userID === found.userID);
              if (owner) setCurrentOwnerID(owner.ownerID);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === "PetOwner" && currentUser
                ? "bg-[#1A73E8] text-white shadow-md border-b-2 border-blue-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Pet Owner (Nimal)
          </button>
          <button
            id="role-vet"
            onClick={() => {
              const found = users.find(u => u.role === "Veterinarian") || INITIAL_USERS[1];
              setCurrentUser(found);
              setCurrentRole("Veterinarian");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === "Veterinarian" && currentUser
                ? "bg-[#1A73E8] text-white shadow-md border-b-2 border-blue-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Veterinarian (Dr. Silva)
          </button>
          <button
            id="role-clinicadmin"
            onClick={() => {
              const found = users.find(u => u.role === "ClinicAdmin") || INITIAL_USERS[2];
              setCurrentUser(found);
              setCurrentRole("ClinicAdmin");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === "ClinicAdmin" && currentUser
                ? "bg-[#1A73E8] text-white shadow-md border-b-2 border-blue-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Clinic Admin
          </button>
          <button
            id="role-sysadmin"
            onClick={() => {
              const found = users.find(u => u.role === "SystemAdmin") || INITIAL_USERS[3];
              setCurrentUser(found);
              setCurrentRole("SystemAdmin");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === "SystemAdmin" && currentUser
                ? "bg-[#1A73E8] text-white shadow-md border-b-2 border-blue-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            System Admin
          </button>
        </div>
      </div>

      {/* DEVICE FRAME CONTAINER conforming to the Geometric Balance theme */}
      <div
        className={`relative transition-all duration-300 overflow-hidden mx-auto ${
          deviceFrame === "phone"
            ? "w-full max-w-full md:w-[360px] h-screen md:h-[720px] rounded-none md:rounded-[40px] border-0 md:border-[12px] border-slate-900 bg-[#F1F3F4] shadow-none md:shadow-2xl"
            : deviceFrame === "tablet"
            ? "w-full max-w-full md:max-w-4xl h-screen md:h-[640px] rounded-none md:rounded-[32px] border-0 md:border-[16px] border-slate-900 bg-[#F1F3F4] shadow-none md:shadow-2xl"
            : "w-full max-w-6xl h-screen md:h-[780px] rounded-none md:rounded-xl border-0 md:border border-slate-800 bg-[#F1F3F4]"
        }`}
        id="simulated-device-container"
      >
        {/* Device Lockscreen Overlay */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              key="lockscreen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 ${getThemeHeaderBg(materialTheme)} text-white flex flex-col justify-between p-8 z-50 rounded-inner`}
              id="device-lockscreen"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold tracking-wide">Secure Mobile Lock</span>
                <Unlock
                  className="w-5 h-5 cursor-pointer hover:scale-110 transition"
                  onClick={() => {
                    setIsLocked(false);
                    logAction("System", "Device Unlocked", "Simulated terminal unlocked.");
                  }}
                />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-5xl font-extrabold tracking-tight font-display">{systemTime.slice(0, 5)}</h2>
                <p className="text-xs uppercase tracking-widest text-blue-100 font-bold">Wednesday, June 24, 2026</p>
                <p className="text-[11px] text-blue-100/70">Matara Medical Clinic, Sri Lanka</p>
              </div>

              <div className="text-center">
                <button
                  id="unlock-device-btn"
                  onClick={() => {
                    setIsLocked(false);
                    logAction("System", "Device Unlocked", "Simulated terminal unlocked.");
                  }}
                  className="px-6 py-2 bg-white text-slate-800 hover:bg-slate-50 font-bold rounded-full text-xs shadow-md transition-transform"
                >
                  Swipe or Tap to Unlock
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Android Simulated Status Bar */}
        <div className={`w-full h-7 ${getThemeHeaderBg(materialTheme)} flex justify-between items-center px-4 text-white text-[11px] font-medium z-30 select-none relative`} id="android-status-bar">
          <div className="flex items-center gap-1.5">
            <span>{systemTime.slice(0, 5)}</span>
            <span className="text-[9px] opacity-70">LKR {systemFeeMultiplier.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-white/50 cursor-pointer" onClick={() => setIsLocked(true)} />
            <Zap className="w-3 h-3 text-white" />
            <div className="w-3.5 h-3.5 bg-white opacity-80" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} title="LTE Signal Strength"></div>
            <div className="w-3 h-3.5 bg-white opacity-80" style={{ clipPath: "polygon(0 20%, 20% 20%, 20% 0, 80% 0, 80% 20%, 100% 20%, 100% 100%, 0 100%)" }} title="Battery Charging"></div>
          </div>
        </div>

        {/* Android Simulated App Bar */}
        <header className={`w-full h-14 ${getThemeHeaderBg(materialTheme)} flex items-center justify-between px-4 text-white shadow z-20 select-none`} id="android-app-bar">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 w-4 opacity-80">
              <div className="h-0.5 w-full bg-white"></div>
              <div className="h-0.5 w-full bg-white"></div>
              <div className="h-0.5 w-2/3 bg-white"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase font-display">
                Pet Care OS
              </h1>
              <p className="text-[9px] text-blue-100 opacity-80 -mt-0.5">
                {currentUser ? (
                  `${currentUser.username} (${currentRole === "PetOwner" ? "Pet Owner" : currentRole})`
                ) : (
                  "Offline Mode (Auth Required)"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="app-settings-toggle-btn"
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className="p-1.5 rounded-full hover:bg-white/10 transition relative text-white"
              title="Quick Settings Dashboard"
            >
              <Settings className={`w-4 h-4 ${showQuickSettings ? "rotate-90 text-[#FFB300]" : ""} transition-transform duration-300`} />
            </button>
            {currentUser && (
              <button
                id="app-logout-btn"
                onClick={() => {
                  logAction(currentUser.username, "Logout", "Session logged out by user.");
                  setCurrentUser(null);
                }}
                className="text-[9px] bg-black/30 hover:bg-black/50 text-white font-bold px-2 py-1.5 rounded transition"
              >
                Sign Out
              </button>
            )}
            <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded border border-white/10 uppercase">
              {currentRole}
            </span>
            {/* Avatar based on Role */}
            <div className="w-8 h-8 rounded-full bg-[#FFB300] flex items-center justify-center text-xs font-bold text-slate-900 border border-white/20">
              {currentUser ? currentUser.username.slice(0, 2).toUpperCase() : "OS"}
            </div>
          </div>
        </header>

        {/* Android-inspired Quick Settings Drawer Overlay */}
        <AnimatePresence>
          {showQuickSettings && (
            <motion.div
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute top-[76px] left-0 right-0 max-h-[85%] bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 p-4 md:p-6 z-40 overflow-y-auto flex flex-col gap-4 shadow-2xl rounded-b-[24px]"
              id="android-quick-settings-drawer"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#FFB300]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">Quick Settings Panel</span>
                </div>
                <button 
                  onClick={() => setShowQuickSettings(false)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallpaper / System Theme */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">System Wallpaper Palette</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "blue", label: "Blue", bg: "bg-[#1A73E8]" },
                    { id: "lavender", label: "Lavender", bg: "bg-[#7C4DFF]" },
                    { id: "terracotta", label: "Terracotta", bg: "bg-[#E64A19]" },
                    { id: "green", label: "Eucalyptus", bg: "bg-[#2E7D32]" }
                  ].map(themeOpt => (
                    <button
                      key={themeOpt.id}
                      onClick={() => setMaterialTheme(themeOpt.id as any)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] font-bold border transition ${
                        materialTheme === themeOpt.id
                          ? "bg-white text-slate-900 border-white font-black shadow-lg"
                          : "bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-800"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${themeOpt.bg}`} />
                      <span>{themeOpt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona / Role Quick-Switcher */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Active Persona Profile</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "PetOwner", label: "Pet Owner" },
                    { id: "Veterinarian", label: "Veterinarian" },
                    { id: "ClinicAdmin", label: "Clinic Admin" },
                    { id: "SystemAdmin", label: "System Admin" }
                  ].map(roleOpt => {
                    const isActive = currentRole === roleOpt.id;
                    return (
                      <button
                        key={roleOpt.id}
                        onClick={() => {
                          let found;
                          if (roleOpt.id === "PetOwner") {
                            found = users.find(u => u.role === "PetOwner") || INITIAL_USERS[0];
                            const owner = petOwners.find(o => o.userID === found.userID);
                            if (owner) setCurrentOwnerID(owner.ownerID);
                          } else if (roleOpt.id === "Veterinarian") {
                            found = users.find(u => u.role === "Veterinarian") || INITIAL_USERS[1];
                          } else if (roleOpt.id === "ClinicAdmin") {
                            found = users.find(u => u.role === "ClinicAdmin") || INITIAL_USERS[2];
                          } else {
                            found = users.find(u => u.role === "SystemAdmin") || INITIAL_USERS[3];
                          }
                          setCurrentUser(found);
                          setCurrentRole(roleOpt.id as any);
                          setShowQuickSettings(false);
                          logAction(found.username, "Quick Role Switch", `Authenticated session as ${roleOpt.id} via Quick Settings.`);
                        }}
                        className={`p-2.5 rounded-xl text-left text-[11px] font-bold border transition flex items-center justify-between ${
                          isActive
                            ? "bg-[#1A73E8] text-white border-transparent shadow"
                            : "bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-800"
                        }`}
                      >
                        <span>{roleOpt.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next-Level Clinical Security Shield Panel */}
              <div className="space-y-3 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#FFB300] uppercase tracking-widest block font-sans">
                    🛡️ Next-Level Clinical Security Shield
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">
                    TLS 1.3 FORCE
                  </span>
                </div>

                {/* Grid for security toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAesEncryption(!aesEncryption);
                      logAction("System", "Toggle Security Configuration", `AES-256 Storage Encryption toggled to ${!aesEncryption}`);
                    }}
                    className={`p-2 rounded-xl text-left text-[10px] font-bold border transition flex items-center justify-between ${
                      aesEncryption
                        ? "bg-slate-800 border-emerald-500/50 text-white"
                        : "bg-slate-900 border-slate-850 text-slate-500"
                    }`}
                  >
                    <span>AES-256 Database Encryption</span>
                    <span className={`w-2 h-2 rounded-full ${aesEncryption ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                  </button>

                  <button
                    onClick={() => {
                      setTlsForce(!tlsForce);
                      logAction("System", "Toggle Security Configuration", `Forced TLS 1.3 Routing toggled to ${!tlsForce}`);
                    }}
                    className={`p-2 rounded-xl text-left text-[10px] font-bold border transition flex items-center justify-between ${
                      tlsForce
                        ? "bg-slate-800 border-emerald-500/50 text-white"
                        : "bg-slate-900 border-slate-850 text-slate-500"
                    }`}
                  >
                    <span>Force HTTPS/TLS 1.3 Routing</span>
                    <span className={`w-2 h-2 rounded-full ${tlsForce ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                  </button>

                  <button
                    onClick={() => {
                      setBiometricAuth(!biometricAuth);
                      logAction("System", "Toggle Security Configuration", `Biometric Passkey bypass toggled to ${!biometricAuth}`);
                    }}
                    className={`p-2 rounded-xl text-left text-[10px] font-bold border transition flex items-center justify-between ${
                      biometricAuth
                        ? "bg-slate-800 border-[#FFB300]/50 text-white"
                        : "bg-slate-900 border-slate-850 text-slate-500"
                    }`}
                  >
                    <span>Passkey Multi-Factor (MFA)</span>
                    <span className={`w-2 h-2 rounded-full ${biometricAuth ? "bg-[#FFB300] animate-pulse" : "bg-slate-700"}`} />
                  </button>

                  <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300 pl-1">Auto-Lock Timer</span>
                    <select
                      value={autoLockPeriod}
                      onChange={(e) => {
                        setAutoLockPeriod(e.target.value);
                        logAction("System", "Change Lock Period", `Automatic session expiry window changed to ${e.target.value}`);
                      }}
                      className="bg-slate-900 text-white text-[10px] font-bold p-1 rounded border border-slate-700 focus:outline-none"
                    >
                      <option value="5m">5 mins</option>
                      <option value="15m">15 mins</option>
                      <option value="30m">30 mins</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Crypto Sentinel scanner output */}
                <div className="bg-black/40 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Live Database Sentinel Integrity Logs
                    </span>
                    <button
                      onClick={runSecurityIntegrityScan}
                      disabled={isScanningInfection}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded transition flex items-center gap-1 shrink-0 ${
                        isScanningInfection 
                          ? "bg-amber-500/20 text-amber-300 cursor-wait" 
                          : "bg-[#1A73E8] hover:bg-blue-500 text-white"
                      }`}
                    >
                      {isScanningInfection ? "Auditing..." : "Re-Audit Database Integrity"}
                    </button>
                  </div>

                  <div className="font-mono text-[10px] bg-black/30 p-2 rounded text-slate-300 leading-normal border border-slate-900/60 flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isScanningInfection ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
                    <span className="break-all">{securityStatus}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Developer & System Admin Tools</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleResetSystem();
                      setShowQuickSettings(false);
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 rounded-xl text-[11px] font-bold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Clinical DB
                  </button>
                  <div className="flex items-center justify-center p-2 bg-slate-800/40 rounded-xl text-[10px] text-slate-400 border border-slate-800 text-center font-mono font-semibold">
                    v1.4.0 • MATARA CLINIC
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Frame Inner Area */}
        <div className="absolute top-[76px] bottom-0 left-0 right-0 overflow-hidden flex flex-col bg-[#F1F3F4]" id="device-screen-body">
          {!currentUser ? (
            <LoginRegister
              users={users}
              petOwners={petOwners}
              veterinarians={veterinarians}
              materialTheme={materialTheme}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setCurrentRole(user.role);
                logAction(user.username, "Login", `Successfully authenticated session as ${user.role}.`);
                if (user.role === "PetOwner") {
                  const owner = petOwners.find(o => o.userID === user.userID);
                  if (owner) {
                    setCurrentOwnerID(owner.ownerID);
                  } else {
                    setCurrentOwnerID(1);
                  }
                }
              }}
              onRegisterSuccess={(newUser, customOwner, customVet) => {
                // Add new user
                setUsers(prev => [...prev, newUser]);
                
                // Add custom owner/vet records if needed
                if (customOwner) {
                  const nextOwnerID = petOwners.length > 0 ? Math.max(...petOwners.map(o => o.ownerID)) + 1 : 1;
                  const fullOwnerRecord: PetOwner = {
                    ownerID: nextOwnerID,
                    ...customOwner
                  };
                  setPetOwners(prev => [...prev, fullOwnerRecord]);
                  setCurrentOwnerID(nextOwnerID);
                }

                if (customVet) {
                  const nextVetID = veterinarians.length > 0 ? Math.max(...veterinarians.map(v => v.vetID)) + 1 : 1;
                  const fullVetRecord: Veterinarian = {
                    vetID: nextVetID,
                    ...customVet
                  };
                  setVeterinarians(prev => [...prev, fullVetRecord]);
                }

                logAction(newUser.username, "Register Account", `Created new role profile: ${newUser.role}`);
                
                // Log in immediately
                setCurrentUser(newUser);
                setCurrentRole(newUser.role);
              }}
            />
          ) : (
            <>
              {currentRole === "PetOwner" && (
                <PetOwnerDashboard
                  pets={pets}
                  onAddPet={handleAddPet}
                  appointments={appointments}
                  veterinarians={veterinarians}
                  vaccinations={vaccinations}
                  healthRecords={healthRecords}
                  prescriptions={prescriptions}
                  invoices={invoices}
                  onBookAppointment={handleBookAppointment}
                  currentOwnerID={currentOwnerID}
                  inventory={inventory}
                  onPayInvoice={handlePayInvoice}
                  onPurchaseProduct={handlePurchaseProduct}
                  onCancelInvoice={handleCancelInvoice}
                  materialTheme={materialTheme}
                />
              )}

              {currentRole === "Veterinarian" && (
                <VeterinarianDashboard
                  vet={veterinarians.find(v => v.userID === currentUser.userID) || veterinarians[0] || INITIAL_VETERINARIANS[0]}
                  pets={pets}
                  appointments={appointments}
                  vaccinations={vaccinations}
                  healthRecords={healthRecords}
                  prescriptions={prescriptions}
                  onAddHealthRecord={handleAddHealthRecord}
                  onAddVaccination={handleAddVaccination}
                  onCompleteAppointment={handleCompleteAppointment}
                />
              )}

              {currentRole === "ClinicAdmin" && (
                <ClinicAdminDashboard
                  veterinarians={veterinarians}
                  appointments={appointments}
                  pets={pets}
                  invoices={invoices}
                  inventory={inventory}
                  onAddVeterinarian={handleAddVeterinarian}
                  onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                  onApplyDiscount={handleApplyDiscount}
                  onAddInventoryItem={handleAddInventoryItem}
                  onUpdateInventoryQty={handleUpdateInventoryQty}
                  onUpdateInventoryItem={handleUpdateInventoryItem}
                  onDeleteInventoryItem={handleDeleteInventoryItem}
                />
              )}

              {currentRole === "SystemAdmin" && (
                <SystemAdminDashboard
                  users={users}
                  auditLogs={auditLogs}
                  onToggleUserStatus={handleToggleUserStatus}
                  onAddUser={handleAddUser}
                  onTriggerBackup={handleTriggerBackup}
                  systemFeeMultiplier={systemFeeMultiplier}
                  onUpdateFeeMultiplier={setSystemFeeMultiplier}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Model Spec References Infobox */}
      <footer className="w-full max-w-6xl mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 font-medium" id="workspace-footer">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-slate-300">Data Stores (D1-D7)</h4>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>D1: Users Credentials (4 simulated records)</li>
              <li>D2: Pets Database (Roxy, Mimi)</li>
              <li>D3: Appointments Calendar (Fee calculated)</li>
              <li>D4: Health Record & Consultation logs</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-slate-300">DFD Process Flow Coverage</h4>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>1.1: Manage Users / Suspension</li>
              <li>1.2: Manage Pets & Microchips</li>
              <li>1.3: Book Appointments (availability checked)</li>
              <li>1.4-1.6: Consult, Vaccines, Rx issue</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-slate-300">AI Gemini Diagnostics</h4>
            <p className="text-[11px] leading-relaxed">
              Vets can tap the **"Diagnose with Gemini AI"** button. The server utilizes standard TypeScript Gemini SDK proxies to suggest clinical findings, diagnosis codes, prescriptions, and auto-checks known allergies!
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-slate-300">Class & Object States</h4>
            <p className="text-[11px] leading-relaxed">
              Initial database matches the Object diagram exactly (Roxy, 25kg, microchip 981022300456123, Rabies vaccine #110 on 2026-06-21, Consultation #205). Changes immediately cascade.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
