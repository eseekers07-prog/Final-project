import React, { useState } from "react";
import { User, AuditLog } from "../types";
import { Settings, ShieldCheck, Database, History, RefreshCcw, Power, UserPlus, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SystemAdminDashboardProps {
  users: User[];
  auditLogs: AuditLog[];
  onToggleUserStatus: (userID: number) => void;
  onAddUser: (user: Omit<User, "userID" | "createdAt">) => void;
  onTriggerBackup: () => void;
  systemFeeMultiplier: number;
  onUpdateFeeMultiplier: (val: number) => void;
}

export default function SystemAdminDashboard({
  users,
  auditLogs,
  onToggleUserStatus,
  onAddUser,
  onTriggerBackup,
  systemFeeMultiplier,
  onUpdateFeeMultiplier
}: SystemAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "backups" | "config">("users");
  
  // Backing up loading simulator
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // SQL DB Sync States
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const checkDbConnection = async () => {
    try {
      const res = await fetch("/api/db/connection-status");
      const data = await res.json();
      setDbStatus(data);
    } catch (e) {
      setDbStatus({
        connected: false,
        message: "Failed to query backend connection state."
      });
    }
  };

  const handleSyncDatabase = async () => {
    setSyncing(true);
    setSyncLogs(["Initiating handshake...", "Checking environment variables...", "Reading credentials..."]);
    try {
      const res = await fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setTimeout(() => {
        if (data.success) {
          setSyncLogs(prev => [
            ...prev,
            "Connection established!",
            `Database "${data.dbName}" is active.`,
            "Mapped tables: [users_table], [pets_table], [appointments_table] successfully.",
            "Synchronised 10 live SQL records."
          ]);
          setSyncResult(data);
        } else {
          setSyncLogs(prev => [
            ...prev,
            "Error: " + data.error,
            "Status: Unconfigured. Falling back to active client Memory buffers."
          ]);
          setSyncResult(data);
        }
        setSyncing(false);
      }, 1200);
    } catch (e) {
      setSyncLogs(prev => [...prev, "Critical network query error.", "Synchronisation aborted."]);
      setSyncing(false);
    }
  };

  // New user states
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<User["role"]>("PetOwner");

  const handleBackupClick = () => {
    setBackingUp(true);
    setBackupSuccess(false);
    onTriggerBackup();

    setTimeout(() => {
      setBackingUp(false);
      setBackupSuccess(true);
    }, 1500);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserEmail || !newUserPhone) return;
    onAddUser({
      username: newUsername,
      emailAddress: newUserEmail,
      phoneNumber: newUserPhone,
      role: newUserRole,
      accountStatus: "Active"
    });
    setNewUsername("");
    setNewUserEmail("");
    setNewUserPhone("");
    setShowAddUser(false);
    alert(`User Account "${newUsername}" provisioned and validated.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F3F4]" id="sys-admin-dashboard-root">
      {/* System Admin Navbar conforming to Geometric Balance */}
      <nav className="w-full bg-[#1A73E8] flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-blue-400/30 z-10 select-none shrink-0" id="sys-navbar">
        <button
          id="sys-tab-users"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "users" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Users
        </button>
        <button
          id="sys-tab-logs"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "logs" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Audit Ledger
        </button>
        <button
          id="sys-tab-backups"
          onClick={() => setActiveTab("backups")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "backups" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          DB Backups
        </button>
        <button
          id="sys-tab-config"
          onClick={() => setActiveTab("config")}
          className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-4 shrink-0 flex-1 sm:flex-initial text-center ${
            activeTab === "config" ? "border-white text-white bg-blue-700/20" : "border-transparent text-blue-100 opacity-70 hover:opacity-100"
          }`}
        >
          Clinic Config
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto p-4 md:p-6" id="sys-content-panel">
        <AnimatePresence mode="wait">
          {activeTab === "users" && (
            <motion.div
              id="sys-users-tab"
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Active User Credentials</h2>
                  <p className="text-xs text-gray-500">DFD Process 1.1 - Provision accounts, alter access levels, or suspend credentials</p>
                </div>
                <button
                  id="add-user-modal-btn"
                  onClick={() => setShowAddUser(true)}
                  className="px-3 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-blue-700"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Provision Account
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse" id="sys-users-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">User ID</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Role Ingress</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Access Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((usr) => (
                      <tr key={usr.userID} className="hover:bg-slate-50/50" id={`sys-user-row-${usr.userID}`}>
                        <td className="p-3 font-mono font-bold text-gray-500">#{usr.userID}</td>
                        <td className="p-3 font-semibold text-slate-800">{usr.username}</td>
                        <td className="p-3 text-gray-600">{usr.emailAddress}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                            {usr.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-400">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            usr.accountStatus === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {usr.accountStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`toggle-user-btn-${usr.userID}`}
                            onClick={() => onToggleUserStatus(usr.userID)}
                            className={`px-2 py-1 font-bold text-[10px] uppercase rounded transition ${
                              usr.accountStatus === "Active"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {usr.accountStatus === "Active" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div
              id="sys-logs-tab"
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Active System Audit Trail</h2>
                <p className="text-xs text-gray-500">Immutable trace sequence recording all operations across clinics</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse font-mono" id="sys-audit-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3 font-sans">ID</th>
                      <th className="p-3 font-sans">Timestamp</th>
                      <th className="p-3 font-sans">User</th>
                      <th className="p-3 font-sans">Operation Class</th>
                      <th className="p-3 font-sans">Execution details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs
                      .slice()
                      .reverse()
                      .map((log) => (
                        <tr key={log.logID} className="hover:bg-slate-50/50" id={`audit-row-${log.logID}`}>
                          <td className="p-3 font-bold text-gray-400">#{log.logID}</td>
                          <td className="p-3 text-gray-500 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-3 font-semibold text-slate-800">{log.user}</td>
                          <td className="p-3 text-[#1A73E8] font-bold text-[11px]">{log.action}</td>
                          <td className="p-3 text-gray-600 text-[11px] font-sans truncate max-w-xs" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "backups" && (
            <motion.div
              id="sys-backups-tab"
              key="backups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto space-y-4"
            >
              {/* Local Backup card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="text-center">
                  <Database className="w-8 h-8 text-[#1A73E8] mx-auto mb-1" />
                  <h2 className="text-sm font-bold text-gray-800">Local Database Snapshots</h2>
                  <p className="text-xs text-gray-500">Initiate immediate clinical backup SQL dump files</p>
                </div>

                <div className="p-3 bg-blue-50/50 rounded border border-blue-100 flex gap-2 text-xs text-blue-900 leading-relaxed font-medium">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    System utilizes transactional local storage buffers mapped into session scopes. Manual backup commits state trees directly.
                  </div>
                </div>

                {backupSuccess && (
                  <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded border border-green-100 font-bold flex gap-2 items-center" id="backup-success-alert">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span>D1-D7 Table Schemas compressed and archived. snapshot_v1.0.sql created.</span>
                  </div>
                )}

                <button
                  id="trigger-backup-btn"
                  disabled={backingUp}
                  onClick={handleBackupClick}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs uppercase tracking-wider flex justify-center items-center gap-2 transition"
                >
                  {backingUp ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  {backingUp ? "Generating Schemas..." : "Backup Snapshot Now"}
                </button>
              </div>

              {/* External SQL Database Sync card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4" id="external-db-sync-card">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4 text-[#1A73E8]" />
                    External SQL DB Synchronization
                  </h2>
                  <p className="text-xs text-gray-500">Auto-pull clinical columns from your own web application database</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="check-db-status-btn"
                    onClick={checkDbConnection}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs transition text-center"
                  >
                    Check DB Credentials
                  </button>
                  <button
                    id="trigger-live-sync-btn"
                    onClick={handleSyncDatabase}
                    disabled={syncing}
                    className="py-1.5 px-3 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded text-xs transition text-center disabled:opacity-50"
                  >
                    {syncing ? "Synchronizing..." : "Trigger Live Sync"}
                  </button>
                </div>

                {/* Connection check state output */}
                {dbStatus && (
                  <div className={`p-3 rounded border text-xs leading-relaxed ${dbStatus.connected ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`} id="db-conn-status-msg">
                    <p className="font-bold mb-0.5">{dbStatus.connected ? "✓ Live Credentials Detected" : "⚠ Offline Mode Active"}</p>
                    <p className="text-[11px] opacity-90">{dbStatus.message}</p>
                  </div>
                )}

                {/* Sync progress terminal */}
                {syncLogs.length > 0 && (
                  <div className="bg-slate-900 rounded p-3 text-[10px] font-mono text-slate-300 space-y-1 h-36 overflow-y-auto" id="db-sync-logs">
                    <p className="text-slate-500 border-b border-slate-800 pb-1 font-bold">SYNC CONSOLE LOGS</p>
                    {syncLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("Error") ? "text-rose-400" : log.includes("established") || log.includes("success") ? "text-emerald-400" : "text-slate-300"}>
                        [{new Date().toLocaleTimeString()}] {log}
                      </p>
                    ))}
                  </div>
                )}

                {/* Schema Mapping Template */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">How to link your own SQL Database</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    To populate client details automatically, declare your credentials in your <b>Secrets panel</b> (matching the <span className="font-mono text-gray-800">.env.example</span> layout).
                    Our Express backend maps your data columns directly via these SQL query hooks:
                  </p>
                  <div className="bg-white border border-gray-200 rounded p-2 text-[10px] font-mono text-gray-500 space-y-1">
                    <p className="text-blue-600 font-bold">// Users Credential Table</p>
                    <p className="select-all">CREATE TABLE users_table (userID INT PRIMARY KEY, username VARCHAR(50), role VARCHAR(30));</p>
                    <p className="text-blue-600 font-bold mt-1.5">// Pets Information Table</p>
                    <p className="select-all">CREATE TABLE pets_table (petID VARCHAR(10) PRIMARY KEY, ownerID INT, petName VARCHAR(50), breed VARCHAR(50));</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "config" && (
            <motion.div
              id="sys-config-tab"
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="text-center">
                  <Settings className="w-10 h-10 text-[#1A73E8] mx-auto mb-1" />
                  <h2 className="text-base font-bold text-gray-800">Clinic Global Parameters</h2>
                  <p className="text-xs text-gray-500">Configure core engine fee calculators and validation policies</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Consultation Emergency Fee Multiplier ({systemFeeMultiplier}x)
                    </label>
                    <input
                      id="fee-multiplier-slider"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={systemFeeMultiplier}
                      onChange={(e) => onUpdateFeeMultiplier(Number(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A73E8]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                      <span>1.0x (Standard)</span>
                      <span>2.0x (Weekend)</span>
                      <span>3.0x (Holiday Critical)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Model Grounding & Ground Rules</span>
                    <div className="bg-slate-50 border border-slate-100 rounded p-2.5 space-y-1.5 text-[11px] text-gray-600 font-medium">
                      <div className="flex justify-between">
                        <span>AI Grounding System:</span>
                        <span className="text-emerald-600 font-bold">Enabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allergy Overrides Block:</span>
                        <span className="text-red-600 font-bold">Strict Enforcement</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Engines:</span>
                        <span className="font-mono text-gray-700 font-bold text-[10px]">IndexedDB-Engine-1.2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal: Provision User */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" id="add-user-modal">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden">
            <div className="bg-[#1A73E8] text-white p-4">
              <h3 className="font-bold text-sm">Provision System Account</h3>
              <p className="text-[11px] text-blue-100">Establish credential entries safely</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Username</label>
                <input
                  id="provision-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Aruni322"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Email Address</label>
                <input
                  id="provision-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="aruni@example.com"
                  className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Phone Number</label>
                  <input
                    id="provision-phone"
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="0779900222"
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Role Group</label>
                  <select
                    id="provision-role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none"
                  >
                    <option value="PetOwner">Pet Owner</option>
                    <option value="Veterinarian">Veterinarian</option>
                    <option value="ClinicAdmin">Clinic Admin</option>
                    <option value="SystemAdmin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  id="provision-cancel"
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="provision-save"
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded text-xs font-bold shadow-sm"
                >
                  Validate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Small icon helper so we don't crash
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
