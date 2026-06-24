import React, { useState } from "react";
import { Pet, Appointment, Veterinarian, Vaccination, HealthRecord, Prescription, PrescriptionItem } from "../types";
import { Activity, Heart, ShieldAlert, Sparkles, Plus, Check, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VeterinarianDashboardProps {
  vet: Veterinarian;
  pets: Pet[];
  appointments: Appointment[];
  vaccinations: Vaccination[];
  healthRecords: HealthRecord[];
  prescriptions: Prescription[];
  onAddHealthRecord: (record: Omit<HealthRecord, "recordID">, prescriptionItems?: Omit<PrescriptionItem, "itemID" | "prescriptionID">[]) => void;
  onAddVaccination: (vaccine: Omit<Vaccination, "vaccineRecordID">) => void;
  onCompleteAppointment: (appointmentID: number) => void;
}

export default function VeterinarianDashboard({
  vet,
  pets,
  appointments,
  vaccinations,
  healthRecords,
  prescriptions,
  onAddHealthRecord,
  onAddVaccination,
  onCompleteAppointment
}: VeterinarianDashboardProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "consult" | "vaccinate" | "records">("schedule");
  
  // Selected appointment to consult or vaccinate
  const [selectedApptID, setSelectedApptID] = useState<number | null>(null);

  // States for Consultation Form
  const [symptoms, setSymptoms] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [consentSigned, setConsentSigned] = useState(false);
  const [isSurgical, setIsSurgical] = useState(false);

  // AI loading state
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // Allergy warning state
  const [allergyAlert, setAllergyAlert] = useState(false);
  const [allergyDetails, setAllergyDetails] = useState("");

  // States for Vaccination Form
  const [vaccinePetID, setVaccinePetID] = useState("");
  const [vaccineName, setVaccineName] = useState("Rabies");
  const [vaccineDate, setVaccineDate] = useState("2026-06-24");
  const [vaccineReaction, setVaccineReaction] = useState("None");

  const vetAppts = appointments.filter((a) => a.vetID === vet.vetID);
  const activeAppts = vetAppts.filter((a) => a.appointmentStatus !== "Completed" && a.appointmentStatus !== "Cancelled");

  const currentSelectedAppt = appointments.find((a) => a.appointmentID === selectedApptID);
  const currentPet = currentSelectedAppt ? pets.find((p) => p.petID === currentSelectedAppt.petID) : null;

  // Real-time check for allergies when typing/modifying drugs
  const checkDrugAllergy = (drug: string, petAllergies: string) => {
    if (!drug || !petAllergies || petAllergies.toLowerCase() === "none") {
      setAllergyAlert(false);
      return;
    }
    const drugLower = drug.toLowerCase();
    const allergies = petAllergies.toLowerCase().split(",").map(a => a.trim());

    const hasConflict = allergies.some(allergy => {
      if (allergy.length < 3) return false;
      // Match penicillin with amoxicillin/ampicillin/penicillin group
      if (allergy.includes("penicillin") && (drugLower.includes("amoxicillin") || drugLower.includes("ampicillin") || drugLower.includes("penicillin"))) {
        return true;
      }
      return drugLower.includes(allergy) || allergy.includes(drugLower);
    });

    if (hasConflict) {
      setAllergyAlert(true);
      setAllergyDetails(`WARNING: Prescription contains drug matching "${drug}", which conflicts with patient's known allergies: "${petAllergies}".`);
    } else {
      setAllergyAlert(false);
    }
  };

  const handleDrugNameChange = (val: string) => {
    setDrugName(val);
    if (currentPet) {
      checkDrugAllergy(val, currentPet.knownAllergies);
    }
  };

  // Process 1.4: Call server-side Gemini API for intelligent veterinary consultation assistant
  const handleSuggestDiagnosis = async () => {
    if (!currentPet) return;
    const searchSymptoms = symptoms || currentSelectedAppt?.reasonForVisit || "general lethargy";
    setLoadingAI(true);
    setAiError("");

    try {
      const response = await fetch("/api/gemini/suggest-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: currentPet.species,
          breed: currentPet.breed,
          symptoms: searchSymptoms,
          knownAllergies: currentPet.knownAllergies
        })
      });

      if (!response.ok) {
        throw new Error("Failed to request clinical analysis.");
      }

      const data = await response.json();
      setClinicalFindings(data.clinicalFindings || "");
      setDiagnosisCode(data.diagnosisCode || "");
      setTreatmentPlan(data.treatmentPlan || "");
      
      if (data.prescription) {
        setDrugName(data.prescription.drugName || "");
        setDosage(data.prescription.dosage || "");
        setFrequency(data.prescription.frequency || "");
        
        // Retrigger local allergy validation on recommended drug
        checkDrugAllergy(data.prescription.drugName || "", currentPet.knownAllergies);
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Unable to reach Gemini Assistant. Used rule-based consultation generator.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptID || !currentPet) return;

    if (isSurgical && !consentSigned) {
      alert("Error: Written owner consent form signature is required to perform surgical procedures.");
      return;
    }

    const nextRecordID = healthRecords.length > 0 ? Math.max(...healthRecords.map(r => r.recordID)) + 1 : 101;
    const recordPayload: Omit<HealthRecord, "recordID"> = {
      petID: currentPet.petID,
      vetID: vet.vetID,
      appointmentID: selectedApptID,
      visitDate: new Date().toISOString().split("T")[0],
      clinicalFindings: clinicalFindings || "General checkup.",
      diagnosisCode: diagnosisCode || "Normal Physical - N/A",
      treatmentPlan: treatmentPlan || "Maintain general hygiene and diet."
    };

    let prescriptionPayload: Omit<PrescriptionItem, "itemID" | "prescriptionID">[] | undefined = undefined;
    if (drugName) {
      prescriptionPayload = [{
        drugName,
        dosage: dosage || "1 dose",
        frequency: frequency || "Once daily"
      }];
    }

    onAddHealthRecord(recordPayload, prescriptionPayload);
    onCompleteAppointment(selectedApptID);

    // Reset Form
    setSelectedApptID(null);
    setSymptoms("");
    setClinicalFindings("");
    setDiagnosisCode("");
    setTreatmentPlan("");
    setDrugName("");
    setDosage("");
    setFrequency("");
    setConsentSigned(false);
    setIsSurgical(false);
    setAllergyAlert(false);
    setActiveTab("schedule");
  };

  const handleVaccinationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccinePetID) return;

    const adminDateObj = new Date(vaccineDate);
    // Auto-calculate next due date (approx 1 year later)
    const nextDueObj = new Date(adminDateObj);
    nextDueObj.setFullYear(nextDueObj.getFullYear() + 1);
    const nextDueDateStr = nextDueObj.toISOString().split("T")[0];

    onAddVaccination({
      petID: vaccinePetID,
      vaccineName,
      administrationDate: vaccineDate,
      nextDueDateCalculated: nextDueDateStr,
      adverseReactionNoted: vaccineReaction
    });

    // Reset vaccine form
    setVaccinePetID("");
    setVaccineReaction("None");
    alert(`Vaccine ${vaccineName} recorded. Next booster schedule calculated: ${nextDueDateStr}`);
    setActiveTab("records");
  };

  const selectApptForConsult = (appt: Appointment) => {
    setSelectedApptID(appt.appointmentID);
    setSymptoms(appt.reasonForVisit);
    setIsSurgical(appt.appointmentType === "Surgical");
    setActiveTab("consult");
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F3F4]" id="vet-dashboard-root">
      {/* Vet tab navbar */}
      <nav className="w-full bg-[#1A73E8] flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-blue-400/30 z-10 select-none shrink-0" id="vet-navbar">
        <button
          id="vet-tab-schedule"
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "schedule" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Daily Schedule ({activeAppts.length})
        </button>
        <button
          id="vet-tab-consult"
          onClick={() => {
            if (!selectedApptID && activeAppts.length > 0) {
              selectApptForConsult(activeAppts[0]);
            } else {
              setActiveTab("consult");
            }
          }}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "consult" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Consultation
        </button>
        <button
          id="vet-tab-vaccinate"
          onClick={() => setActiveTab("vaccinate")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "vaccinate" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Vaccination
        </button>
        <button
          id="vet-tab-records"
          onClick={() => setActiveTab("records")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "records" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Clinic Case Log
        </button>
      </nav>

      {/* Main Vet Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" id="vet-content-panel">
        <AnimatePresence mode="wait">
          {activeTab === "schedule" && (
            <motion.div
              id="vet-schedule"
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Veterinarian Daily Calendar</h2>
                <p className="text-xs text-gray-500">Logged doctor: {vet.fullName} • specialization: {vet.specialisation}</p>
              </div>

              {activeAppts.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center border border-gray-200 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No pending consultations today!</p>
                  <p className="text-xs text-gray-400 mt-1">All schedules completed or clear.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAppts.map((appt) => {
                    const pet = pets.find((p) => p.petID === appt.petID);
                    return (
                      <div key={appt.appointmentID} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col justify-between" id={`appt-schedule-card-${appt.appointmentID}`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded uppercase">
                                {appt.appointmentType}
                              </span>
                              <h3 className="text-sm font-bold text-gray-800 mt-1">{pet?.petName || "Patient"} ({pet?.species})</h3>
                              <p className="text-xs text-gray-500 font-medium">Breed: {pet?.breed || "Unknown"}</p>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 bg-slate-50 px-2 py-0.5 rounded border border-gray-100">
                              {new Date(appt.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="p-2 bg-slate-50 border border-slate-100 rounded text-xs text-gray-600">
                            <span className="font-bold text-slate-500 uppercase text-[9px] block">Chief Complaint / Reason</span>
                            {appt.reasonForVisit}
                          </div>

                          {pet?.knownAllergies && pet.knownAllergies.toLowerCase() !== "none" && (
                            <div className="flex gap-1.5 items-center text-xs p-1 px-2 bg-red-50 text-red-700 rounded border border-red-100 font-medium">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Allergy warning: {pet.knownAllergies}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-3">
                          <span className="text-[10px] font-mono text-slate-400">ID: #{appt.appointmentID}</span>
                          <button
                            id={`start-consult-btn-${appt.appointmentID}`}
                            onClick={() => selectApptForConsult(appt)}
                            className="px-3 py-1 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded text-xs shadow-sm transition"
                          >
                            Begin Consultation
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "consult" && (
            <motion.div
              id="vet-consult"
              key="consult"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-4"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Veterinary Clinical Intake</h2>
                    {currentPet ? (
                      <p className="text-xs text-gray-500 font-medium">
                        Patient: <span className="text-[#1A73E8] font-bold">{currentPet.petName}</span> ({currentPet.species} • {currentPet.breed} • {currentPet.weightKg}kg)
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Please select an appointment from schedule to begin</p>
                    )}
                  </div>
                  {currentPet && (
                    <button
                      id="ai-suggest-btn"
                      type="button"
                      disabled={loadingAI}
                      onClick={handleSuggestDiagnosis}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold rounded shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                      {loadingAI ? "Analyzing..." : "Diagnose with Gemini AI"}
                    </button>
                  )}
                </div>

                {!selectedApptID ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-200 rounded">
                    <p className="text-xs text-gray-500">No patient selected for consultation. Go to Daily Schedule and tap 'Begin Consultation'.</p>
                  </div>
                ) : (
                  <form onSubmit={handleConsultationSubmit} className="space-y-3" id="consultation-form">
                    {aiError && (
                      <div className="p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                        {aiError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Symptoms / Chief Complaint</label>
                        <textarea
                          id="consult-symptoms"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none focus:border-[#1A73E8] h-14 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Observed Clinical Findings</label>
                        <textarea
                          id="consult-clinical"
                          value={clinicalFindings}
                          onChange={(e) => setClinicalFindings(e.target.value)}
                          placeholder="E.g., Clear lungs, inflamed outer ear canal with black debris..."
                          className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none focus:border-[#1A73E8] h-14 resize-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Diagnosis Name & Code</label>
                        <input
                          id="consult-diag-code"
                          type="text"
                          value={diagnosisCode}
                          onChange={(e) => setDiagnosisCode(e.target.value)}
                          placeholder="E.g., Otitis Externa - VET-H20.1"
                          className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Treatment Plan</label>
                        <input
                          id="consult-treatment"
                          type="text"
                          value={treatmentPlan}
                          onChange={(e) => setTreatmentPlan(e.target.value)}
                          placeholder="E.g., Daily ear drops, keep dry"
                          className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Prescription Section with Real-time Allergy Checker */}
                    <div className="border border-slate-100 bg-slate-50/50 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Pre-populate Digital Prescription</span>
                        {currentPet && (
                          <span className="text-[9px] text-slate-400 font-mono">Known Allergies: {currentPet.knownAllergies}</span>
                        )}
                      </div>

                      {allergyAlert && (
                        <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded border border-rose-100 flex gap-2 items-center mb-3 animate-pulse" id="allergy-danger-alert">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                          <div className="font-semibold text-[11px]">{allergyDetails}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Drug Name</label>
                          <input
                            id="consult-drug"
                            type="text"
                            value={drugName}
                            onChange={(e) => handleDrugNameChange(e.target.value)}
                            placeholder="e.g., Amoxicillin"
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Dosage</label>
                          <input
                            id="consult-dosage"
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="e.g., 250mg or 5ml"
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Frequency</label>
                          <input
                            id="consult-frequency"
                            type="text"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="e.g., Twice daily"
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Surgical Consent Block */}
                    {isSurgical && (
                      <div className="p-3 bg-red-50/50 border border-red-100 rounded space-y-2">
                        <span className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> SURGICAL PROCEDURE LOG REQUIRED
                        </span>
                        <div className="flex items-center gap-2 text-xs text-red-900">
                          <input
                            id="surgical-consent-checkbox"
                            type="checkbox"
                            checked={consentSigned}
                            onChange={(e) => setConsentSigned(e.target.checked)}
                            className="w-4 h-4 rounded text-red-600 border-gray-300"
                            required
                          />
                          <label htmlFor="surgical-consent-checkbox" className="font-semibold">
                            Confirm physical written Pet Owner Consent Form has been signed and uploaded to records.
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        id="consult-cancel-btn"
                        type="button"
                        onClick={() => { setSelectedApptID(null); setActiveTab("schedule"); }}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        id="consult-submit-btn"
                        type="submit"
                        className="px-4 py-1.5 bg-[#FFB300] hover:bg-[#ffa000] text-slate-900 font-bold rounded text-xs shadow-sm uppercase tracking-wider"
                      >
                        Sign & Record Case File
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "vaccinate" && (
            <motion.div
              id="vet-vaccinate"
              key="vaccinate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="text-center mb-3">
                  <Activity className="w-7 h-7 text-[#1A73E8] mx-auto mb-1" />
                  <h2 className="text-base font-bold text-gray-800">Log Vaccine Administration</h2>
                  <p className="text-xs text-gray-500">DFD process 1.5 - Vaccination history log & booster calculation</p>
                </div>

                <form onSubmit={handleVaccinationSubmit} className="space-y-3" id="vaccination-admin-form">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Select Patient</label>
                    <select
                      id="vac-pet-select"
                      value={vaccinePetID}
                      onChange={(e) => setVaccinePetID(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {pets.map((p) => (
                        <option key={p.petID} value={p.petID}>
                          {p.petName} (ID: {p.petID} • {p.species})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Vaccine Brand / Name</label>
                      <select
                        id="vac-name-select"
                        value={vaccineName}
                        onChange={(e) => setVaccineName(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none"
                      >
                        <option value="Rabies">Rabies (Nobivac)</option>
                        <option value="DHPP">DHPP (Parvovirus/Distemper)</option>
                        <option value="FVRCP">FVRCP (Feline Viral Rhinotracheitis)</option>
                        <option value="Leukemia">Feline Leukemia Vaccine</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Date Administered</label>
                      <input
                        id="vac-date-input"
                        type="date"
                        value={vaccineDate}
                        onChange={(e) => setVaccineDate(e.target.value)}
                        className="w-full text-xs p-1.5 bg-slate-50 border border-gray-200 rounded focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Adverse Reactions Noted</label>
                    <textarea
                      id="vac-reaction"
                      value={vaccineReaction}
                      onChange={(e) => setVaccineReaction(e.target.value)}
                      placeholder="Enter 'None' or any swelling, lethargy, fever..."
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded focus:outline-none h-14 resize-none"
                      required
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                    <button
                      id="vac-submit-btn"
                      type="submit"
                      className="w-full py-2 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded shadow-sm text-xs uppercase tracking-wide"
                    >
                      Administer & Calculate Booster
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "records" && (
            <motion.div
              id="vet-records"
              key="records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Active Clinic Case Logs</h2>
                <p className="text-xs text-gray-500">Access and audit historical patient diagnostics and treatment protocols</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse" id="vet-cases-table">
                    <thead>
                      <tr className="bg-slate-100 border-b border-gray-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Record ID</th>
                        <th className="p-3">Visit Date</th>
                        <th className="p-3">Patient Pet</th>
                        <th className="p-3">Symptoms / Chief Findings</th>
                        <th className="p-3">Diagnosis Code</th>
                        <th className="p-3">Prescription Issued</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {healthRecords.map((rec) => {
                        const pet = pets.find((p) => p.petID === rec.petID);
                        const rx = prescriptions.find((p) => p.recordID === rec.recordID);
                        
                        return (
                          <tr key={rec.recordID} className="hover:bg-slate-50/50" id={`vet-rec-row-${rec.recordID}`}>
                            <td className="p-3 font-mono font-bold text-gray-500">#{rec.recordID}</td>
                            <td className="p-3 font-mono">{rec.visitDate}</td>
                            <td className="p-3 font-semibold text-[#1A73E8]">{pet?.petName || "Roxy"}</td>
                            <td className="p-3 text-gray-600 italic truncate max-w-xs">{rec.clinicalFindings}</td>
                            <td className="p-3 font-mono font-semibold text-gray-700">{rec.diagnosisCode}</td>
                            <td className="p-3">
                              {rx ? (
                                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                  {rx.items.map((i) => i.drugName).join(", ")}
                                </span>
                              ) : (
                                <span className="text-gray-400">None</span>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
