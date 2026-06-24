import React, { useState } from "react";
import { Pet, Appointment, Veterinarian, Invoice, InventoryItem } from "../types";
import { CreditCard, Calendar, Users, Package, AlertTriangle, ArrowRight, Tag, Percent, Check, Plus, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClinicAdminDashboardProps {
  veterinarians: Veterinarian[];
  appointments: Appointment[];
  pets: Pet[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  onAddVeterinarian: (vet: Omit<Veterinarian, "vetID" | "userID">) => void;
  onUpdateInvoiceStatus: (invoiceID: number, status: "Paid", method: "Cash" | "Card" | "Online") => void;
  onApplyDiscount: (invoiceID: number, discountAmount: number) => void;
  onAddInventoryItem: (item: Omit<InventoryItem, "itemID">) => void;
  onUpdateInventoryQty: (itemID: number, qtyChange: number) => void;
  onUpdateInventoryItem: (itemID: number, item: Partial<InventoryItem>) => void;
  onDeleteInventoryItem: (itemID: number) => void;
}

export default function ClinicAdminDashboard({
  veterinarians,
  appointments,
  pets,
  invoices,
  inventory,
  onAddVeterinarian,
  onUpdateInvoiceStatus,
  onApplyDiscount,
  onAddInventoryItem,
  onUpdateInventoryQty,
  onUpdateInventoryItem,
  onDeleteInventoryItem
}: ClinicAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"billing" | "appointments" | "vets" | "inventory">("billing");
  
  // Roster states
  const [showAddVet, setShowAddVet] = useState(false);
  const [vetName, setVetName] = useState("");
  const [vetSpec, setVetSpec] = useState("General Veterinary");
  const [vetLic, setVetLic] = useState("");

  // Inventory states
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [invName, setInvName] = useState("");
  const [invCat, setInvCat] = useState<"Medication" | "Vaccine" | "Supplies" | "Equipment">("Medication");
  const [invQty, setInvQty] = useState(20);
  const [invReorder, setInvReorder] = useState(10);
  const [invUnit, setInvUnit] = useState("tablets");
  const [invPrice, setInvPrice] = useState(150);

  // Edit Inventory states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editInvName, setEditInvName] = useState("");
  const [editInvCat, setEditInvCat] = useState<"Medication" | "Vaccine" | "Supplies" | "Equipment">("Medication");
  const [editInvQty, setEditInvQty] = useState(0);
  const [editInvReorder, setEditInvReorder] = useState(0);
  const [editInvUnit, setEditInvUnit] = useState("");
  const [editInvPrice, setEditInvPrice] = useState(0);

  const startEditingItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditInvName(item.itemName);
    setEditInvCat(item.category);
    setEditInvQty(item.quantityInStock);
    setEditInvReorder(item.reorderLevel);
    setEditInvUnit(item.unit);
    setEditInvPrice(item.price);
  };

  const handleEditInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateInventoryItem(editingItem.itemID, {
      itemName: editInvName,
      category: editInvCat,
      quantityInStock: Number(editInvQty),
      reorderLevel: Number(editInvReorder),
      unit: editInvUnit,
      price: Number(editInvPrice)
    });
    setEditingItem(null);
    alert(`Inventory item "${editInvName}" updated successfully.`);
  };

  // Selected invoice states for billing modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [discountPercent, setDiscountPercent] = useState(10); // Default 10%
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Online">("Cash");

  const pendingInvoices = invoices.filter(i => i.paymentStatus === "Pending");
  const lowStockItems = inventory.filter(i => i.quantityInStock <= i.reorderLevel);

  const handleAddVetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetName || !vetLic) return;
    onAddVeterinarian({
      fullName: vetName,
      specialisation: vetSpec,
      licenceNo: vetLic
    });
    setVetName("");
    setVetLic("");
    setShowAddVet(false);
    alert(`Veterinarian ${vetName} added to the roster successfully.`);
  };

  const handleAddInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName || !invUnit) return;
    onAddInventoryItem({
      itemName: invName,
      category: invCat,
      quantityInStock: Number(invQty),
      reorderLevel: Number(invReorder),
      unit: invUnit,
      price: Number(invPrice)
    });
    setInvName("");
    setInvPrice(150);
    setShowAddInventory(false);
    alert(`Inventory item ${invName} registered in stock log.`);
  };

  const handleProcessPayment = (inv: Invoice) => {
    onUpdateInvoiceStatus(inv.invoiceID, "Paid", paymentMethod);
    setSelectedInvoice(null);
    alert(`Payment of LKR ${inv.totalAmount - inv.discountApplied} captured successfully via ${paymentMethod}.`);
  };

  const handlePromoDiscountSubmit = (inv: Invoice) => {
    // Apply % discount
    const discountVal = Math.round((inv.totalAmount * discountPercent) / 100);
    onApplyDiscount(inv.invoiceID, discountVal);
    
    // Update active modal reference
    setSelectedInvoice({
      ...inv,
      discountApplied: discountVal
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F3F4]" id="admin-dashboard-root">
      {/* Navbar adhering to Geometric Balance Theme */}
      <nav className="w-full bg-[#1A73E8] flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-blue-400/30 z-10 select-none shrink-0" id="admin-navbar">
        <button
          id="admin-tab-billing"
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "billing" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Billing ({pendingInvoices.length})
        </button>
        <button
          id="admin-tab-inventory"
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "inventory" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Inventory {lowStockItems.length > 0 && <span className="ml-1 w-2 h-2 bg-[#FFB300] rounded-full animate-pulse inline-block" />}
        </button>
        <button
          id="admin-tab-appointments"
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "appointments" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Calendar
        </button>
        <button
          id="admin-tab-vets"
          onClick={() => setActiveTab("vets")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "vets" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Doctor Roster
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto p-4 md:p-6" id="admin-content-panel">
        <AnimatePresence mode="wait">
          {activeTab === "billing" && (
            <motion.div
              id="admin-billing-tab"
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Billing & Accounts Receivable</h2>
                  <p className="text-xs text-gray-500">DFD Process 1.7 - Mark payment confirmations, invoice generation, apply promo codes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Billing Summary Cards */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pending Invoices</span>
                  <span className="text-2xl font-bold text-rose-600 block mt-1">{pendingInvoices.length}</span>
                  <span className="text-xs text-gray-500 font-medium">LKR {pendingInvoices.reduce((a, b) => a + b.totalAmount, 0)} outstanding</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Receipts Today</span>
                  <span className="text-2xl font-bold text-green-600 block mt-1">
                    {invoices.filter(i => i.paymentStatus === "Paid").length}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">LKR {invoices.filter(i => i.paymentStatus === "Paid").reduce((a, b) => a + b.totalAmount - b.discountApplied, 0)} earned</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Active Inventory Alerts</span>
                  <span className={`text-2xl font-bold block mt-1 ${lowStockItems.length > 0 ? "text-amber-500" : "text-gray-600"}`}>
                    {lowStockItems.length} items low
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Critical medication buffers below safe level</span>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-[#F8F9FA] border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700">All Client Ledger & Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse" id="admin-billing-table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Appointment ID</th>
                        <th className="p-3">Patient Pet</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3 text-right">Invoice Subtotal</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3 text-right">Total Payable</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.sort((a,b) => b.invoiceID - a.invoiceID).map((inv) => {
                        const appt = appointments.find(a => a.appointmentID === inv.appointmentID);
                        const pet = appt ? pets.find(p => p.petID === appt.petID) : null;
                        const finalAmount = inv.totalAmount - inv.discountApplied;

                        return (
                          <tr key={inv.invoiceID} className="hover:bg-slate-50/50" id={`admin-invoice-row-${inv.invoiceID}`}>
                            <td className="p-3 font-mono font-bold text-gray-500">#{inv.invoiceID}</td>
                            <td className="p-3 font-mono text-gray-400">#{inv.appointmentID}</td>
                            <td className="p-3 font-semibold text-slate-800">{pet?.petName || "Roxy"}</td>
                            <td className="p-3 font-mono text-gray-500">{inv.dateIssued}</td>
                            <td className="p-3 text-right text-gray-600 font-semibold">LKR {inv.totalAmount}</td>
                            <td className="p-3 text-right text-rose-500 font-semibold">-LKR {inv.discountApplied}</td>
                            <td className="p-3 text-right font-bold text-slate-900">LKR {finalAmount}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inv.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {inv.paymentStatus} {inv.paymentMethod && `(${inv.paymentMethod})`}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {inv.paymentStatus === "Pending" ? (
                                <button
                                  id={`collect-payment-${inv.invoiceID}`}
                                  onClick={() => {
                                    setDiscountPercent(10);
                                    setSelectedInvoice(inv);
                                  }}
                                  className="px-2 py-1 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded text-[10px] uppercase shadow-sm transition"
                                >
                                  Collect LKR {finalAmount}
                                </button>
                              ) : (
                                <span className="text-gray-400 italic text-[11px] font-semibold">Settled Ledger</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div
              id="admin-inventory-tab"
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Clinic Medical & Drug Inventory</h2>
                  <p className="text-xs text-gray-500">DFD extended Use Case - Log stock supplies and reorder alerts</p>
                </div>
                <button
                  id="add-inventory-btn"
                  onClick={() => setShowAddInventory(true)}
                  className="px-3 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Material Entry
                </button>
              </div>

              {/* Low Stock Alerts Banner */}
              {lowStockItems.length > 0 && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded flex gap-2.5 items-center animate-pulse" id="inventory-alert-banner">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  <div className="text-xs">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-700">REORDER WARN LEVEL REACHED</span>
                    The following materials are below threshold: <span className="font-bold">{lowStockItems.map(i => `${i.itemName} (${i.quantityInStock} ${i.unit})`).join(", ")}</span>. Please coordinate supply purchases.
                  </div>
                </div>
              )}

              {/* Inventory Grid */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse" id="admin-inventory-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Unit Price</th>
                      <th className="p-3 text-center">Qty in Stock</th>
                      <th className="p-3 text-center">Safety Reorder Limit</th>
                      <th className="p-3 text-center">Stock status</th>
                      <th className="p-3 text-right">Adjustment Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map((item) => {
                      const isLow = item.quantityInStock <= item.reorderLevel;
                      return (
                        <tr key={item.itemID} className="hover:bg-slate-50/50" id={`inventory-item-row-${item.itemID}`}>
                          <td className="p-3 font-semibold text-gray-800">{item.itemName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            LKR {(item.price ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold font-mono text-gray-800">
                            {item.quantityInStock} {item.unit}
                          </td>
                          <td className="p-3 text-center font-mono text-gray-500">
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td className="p-3 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold rounded uppercase tracking-wide">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded uppercase tracking-wide">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              id={`inv-reduce-${item.itemID}`}
                              disabled={item.quantityInStock <= 0}
                              onClick={() => onUpdateInventoryQty(item.itemID, -1)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] disabled:opacity-30"
                              title="Decrease stock by 1"
                            >
                              -1
                            </button>
                            <button
                              id={`inv-increase-${item.itemID}`}
                              onClick={() => onUpdateInventoryQty(item.itemID, 10)}
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]"
                              title="Increase stock by 10"
                            >
                              +10 Restock
                            </button>
                            <button
                              id={`inv-edit-${item.itemID}`}
                              onClick={() => startEditingItem(item)}
                              className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] font-bold rounded text-[10px]"
                              title="Edit item details"
                            >
                              Edit
                            </button>
                            <button
                              id={`inv-delete-${item.itemID}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${item.itemName}" from the inventory?`)) {
                                  onDeleteInventoryItem(item.itemID);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px]"
                              title="Delete item"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div
              id="admin-appointments-tab"
              key="appointments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Active Clinic Schedules</h2>
                <p className="text-xs text-gray-500">Manage, confirm, and audit veterinary consult sessions</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse" id="admin-appointments-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Appt ID</th>
                      <th className="p-3">Patient Pet</th>
                      <th className="p-3">Doctor Vet</th>
                      <th className="p-3">Scheduled Time</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-center">Clinic Status</th>
                      <th className="p-3 text-right">Fee Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appointments.sort((a,b) => b.appointmentID - a.appointmentID).map((appt) => {
                      const pet = pets.find(p => p.petID === appt.petID);
                      const vet = veterinarians.find(v => v.vetID === appt.vetID);

                      return (
                        <tr key={appt.appointmentID} className="hover:bg-slate-50/50" id={`admin-appt-row-${appt.appointmentID}`}>
                          <td className="p-3 font-mono font-bold text-gray-500">#{appt.appointmentID}</td>
                          <td className="p-3 font-semibold text-slate-800">{pet?.petName || "Roxy"}</td>
                          <td className="p-3 text-gray-600">{vet?.fullName || "General Vet"}</td>
                          <td className="p-3 font-mono text-gray-500">{new Date(appt.scheduledDateTime).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">
                              {appt.appointmentType}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              appt.appointmentStatus === "Completed" ? "bg-green-100 text-green-800" :
                              appt.appointmentStatus === "Confirmed" ? "bg-blue-100 text-blue-800" :
                              appt.appointmentStatus === "Cancelled" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {appt.appointmentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            LKR {appt.consultationFee}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "vets" && (
            <motion.div
              id="admin-vets-tab"
              key="vets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Active Veterinary Specialists</h2>
                  <p className="text-xs text-gray-500">Add medical practitioners and inspect licensing codes</p>
                </div>
                <button
                  id="add-vet-modal-btn"
                  onClick={() => setShowAddVet(true)}
                  className="px-3 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> License Practitioner
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veterinarians.map((v) => (
                  <div key={v.vetID} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex justify-between items-center" id={`vet-roster-card-${v.vetID}`}>
                    <div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                        {v.specialisation}
                      </span>
                      <h3 className="font-bold text-gray-800 mt-1.5 text-sm">{v.fullName}</h3>
                      <p className="text-xs text-gray-500 font-medium">Licensed Registration License</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Licence No</span>
                      <span className="font-mono text-xs font-bold text-gray-800 bg-slate-50 px-2 py-1 rounded border border-gray-100">
                        {v.licenceNo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal: Add Veterinarian */}
      {showAddVet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" id="add-vet-modal">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden animate-slide-up">
            <div className="bg-[#1A73E8] text-white p-4">
              <h3 className="font-bold text-sm">Roster Doctor Vet</h3>
              <p className="text-[11px] text-blue-100">Register license credential codes safely</p>
            </div>
            <form onSubmit={handleAddVetSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Doctor Full Name</label>
                <input
                  id="new-vet-name"
                  type="text"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  placeholder="Dr. Fernando"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Specialisation Area</label>
                <select
                  id="new-vet-spec"
                  value={vetSpec}
                  onChange={(e) => setVetSpec(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                >
                  <option value="General Veterinary">General Veterinary</option>
                  <option value="Feline Specialist">Feline Specialist</option>
                  <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                  <option value="Avian/Exotics Specialty">Avian/Exotics Specialty</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Licence Verification No</label>
                <input
                  id="new-vet-license"
                  type="text"
                  value={vetLic}
                  onChange={(e) => setVetLic(e.target.value)}
                  placeholder="VET702"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  id="add-vet-cancel-btn"
                  type="button"
                  onClick={() => setShowAddVet(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="add-vet-submit-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold"
                >
                  Roster Veterinarian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Payment & Apply Promos */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" id="billing-ledger-modal">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden">
            <div className="bg-[#1A73E8] text-white p-4">
              <h3 className="font-bold text-sm">Process Invoice Payment</h3>
              <p className="text-[11px] text-blue-100">Capture financial ledger with active coupon overrides</p>
            </div>
            
            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-gray-100 flex justify-between text-gray-600 font-medium">
                <div>
                  <span className="text-[10px] text-gray-400 block">Ledger Reference</span>
                  <span className="font-bold text-slate-800">Invoice #{selectedInvoice.invoiceID}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Date Issued</span>
                  <span className="font-mono">{selectedInvoice.dateIssued}</span>
                </div>
              </div>

              {/* Promo Discount Input */}
              <div className="p-2.5 border border-amber-100 bg-amber-50/40 rounded flex gap-2 items-center">
                <Percent className="w-5 h-5 text-[#FFB300] shrink-0" />
                <div className="flex-1 flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block">Apply Promotional Coupon</label>
                    <select
                      id="promo-discount-select"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="text-[11px] bg-white border border-gray-200 rounded p-1 w-full focus:outline-none"
                    >
                      <option value="5">5% Early Bird Discount</option>
                      <option value="10">10% Seasonal Coupon</option>
                      <option value="20">20% VIP Companion Rebate</option>
                    </select>
                  </div>
                  <button
                    id="apply-promo-btn"
                    onClick={() => handlePromoDiscountSubmit(selectedInvoice)}
                    className="px-2.5 py-1.5 bg-[#FFB300] hover:bg-[#ffa000] text-slate-900 font-bold rounded text-[10px] uppercase shadow-sm mt-3"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Payment Ingress Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cash", "Card", "Online"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      id={`pay-method-btn-${method}`}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 text-center font-bold text-[11px] border rounded transition ${
                        paymentMethod === method
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Summary Ledger */}
              <div className="pt-2.5 border-t border-gray-100 space-y-1 text-slate-600 font-medium text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal Consultation:</span>
                  <span>LKR {selectedInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount Applied:</span>
                  <span>-LKR {selectedInvoice.discountApplied}</span>
                </div>
                <div className="flex justify-between text-gray-800 text-xs font-black border-t border-dashed border-gray-200 pt-1.5">
                  <span>Final Capture Payable:</span>
                  <span className="text-slate-950 text-sm">LKR {selectedInvoice.totalAmount - selectedInvoice.discountApplied}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  id="payment-ledger-cancel"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-1/2 py-2 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50"
                >
                  Dismiss Ledger
                </button>
                <button
                  id="payment-ledger-confirm"
                  onClick={() => handleProcessPayment(selectedInvoice)}
                  className="w-1/2 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-xs uppercase shadow-sm"
                >
                  Settle Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Inventory */}
      {showAddInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" id="add-inventory-modal">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden animate-slide-up">
            <div className="bg-[#1A73E8] text-white p-4">
              <h3 className="font-bold text-sm">Log Material Entry</h3>
              <p className="text-[11px] text-blue-100">Keep critical medical assets buffered correctly</p>
            </div>
            <form onSubmit={handleAddInventorySubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Item Name</label>
                <input
                  id="new-inv-name"
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="e.g., Amoxicillin 250mg"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Category</label>
                  <select
                    id="new-inv-cat"
                    value={invCat}
                    onChange={(e) => setInvCat(e.target.value as any)}
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  >
                    <option value="Medication">Medication</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Measurement Unit</label>
                  <input
                    id="new-inv-unit"
                    type="text"
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value)}
                    placeholder="tablets, vials, pieces"
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Quantity to Add</label>
                  <input
                    id="new-inv-qty"
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-gray-200 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Reorder Warning Level</label>
                  <input
                    id="new-inv-reorder"
                    type="number"
                    value={invReorder}
                    onChange={(e) => setInvReorder(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-gray-200 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Unit Sales Price (LKR)</label>
                <input
                  id="new-inv-price"
                  type="number"
                  value={invPrice}
                  onChange={(e) => setInvPrice(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  id="new-inv-cancel"
                  type="button"
                  onClick={() => setShowAddInventory(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="new-inv-submit"
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold"
                >
                  Log Assets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Inventory */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" id="edit-inventory-modal">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden animate-slide-up">
            <div className="bg-[#1A73E8] text-white p-4">
              <h3 className="font-bold text-sm">Update Material Details</h3>
              <p className="text-[11px] text-blue-100">Modify critical asset attributes and threshold alerts</p>
            </div>
            <form onSubmit={handleEditInventorySubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Item Name</label>
                <input
                  id="edit-inv-name"
                  type="text"
                  value={editInvName}
                  onChange={(e) => setEditInvName(e.target.value)}
                  placeholder="e.g., Amoxicillin 250mg"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Category</label>
                  <select
                    id="edit-inv-cat"
                    value={editInvCat}
                    onChange={(e) => setEditInvCat(e.target.value as any)}
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  >
                    <option value="Medication">Medication</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Measurement Unit</label>
                  <input
                    id="edit-inv-unit"
                    type="text"
                    value={editInvUnit}
                    onChange={(e) => setEditInvUnit(e.target.value)}
                    placeholder="tablets, vials, pieces"
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Quantity in Stock</label>
                  <input
                    id="edit-inv-qty"
                    type="number"
                    value={editInvQty}
                    onChange={(e) => setEditInvQty(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Reorder Warning Level</label>
                  <input
                    id="edit-inv-reorder"
                    type="number"
                    value={editInvReorder}
                    onChange={(e) => setEditInvReorder(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Unit Sales Price (LKR)</label>
                <input
                  id="edit-inv-price"
                  type="number"
                  value={editInvPrice}
                  onChange={(e) => setEditInvPrice(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  id="edit-inv-cancel"
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="edit-inv-submit"
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
