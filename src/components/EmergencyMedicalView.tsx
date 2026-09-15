import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldAlert,
  PhoneCall,
  User,
  AlertTriangle,
  Stethoscope,
  Building2,
  FileBadge,
  Download,
  Share2,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Ambulance,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';

interface EmergencyMedicalViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const EmergencyMedicalView: React.FC<EmergencyMedicalViewProps> = ({ user, onUpdateUser }) => {
  const [copied, setCopied] = useState(false);

  const handleShareCard = () => {
    const summary = `EMERGENCY MEDICAL PROFILE\nPatient: ${user.name}\nBlood Group: ${user.bloodGroup}\nSevere Allergies: ${user.medicalProfile.allergies.join(', ') || 'None'}\nConditions: ${user.medicalProfile.chronicConditions.join(', ') || 'None'}\nMedications: ${user.medicalProfile.medications.join(', ') || 'None'}\nEmergency Contact: ${user.emergencyContact.name} (${user.emergencyContact.phone})\nHospital: ${user.medicalProfile.hospitalPreference}\nDoctor: ${user.medicalProfile.primaryDoctor}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <HeartPulse className="w-7 h-7 text-rose-600 animate-pulse" />
            <span>Emergency Medical Vault Card</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Paramedic and first-responder accessible medical profile with zero-delay critical health records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={handleShareCard}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Emergency Summary Copied!' : 'Copy Medical Summary'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Emergency Medical Card Visual */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-rose-900 via-slate-900 to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-800 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center font-extrabold text-xl shadow-md">
                  +
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider">Universal Emergency Medical Passport</h2>
                  <div className="text-xs text-rose-300 font-semibold">Zero-Delay Paramedic Health Record</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-rose-400 bg-rose-950/80 border border-rose-700/60 px-3 py-1 rounded-xl">
                  {user.bloodGroup}
                </span>
              </div>
            </div>

            {/* Patient Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-xs">
              <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Patient Name</span>
                <span className="font-bold text-white text-sm">{user.name}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Age / Gender / DOB</span>
                <span className="font-bold text-white">{user.age} Yrs • {user.gender} • {user.dob}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Insurance Policy No</span>
                <span className="font-bold text-emerald-300">{user.medicalProfile.insurancePolicyNo}</span>
              </div>
            </div>

            {/* Critical Allergies & Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
              <div className="bg-rose-950/60 p-4 rounded-xl border border-rose-800/80">
                <div className="flex items-center space-x-2 font-bold text-rose-300 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Severe Allergies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.medicalProfile.allergies.map((alg) => (
                    <span key={alg} className="px-2.5 py-1 bg-rose-900/80 text-rose-100 font-bold rounded-lg border border-rose-700/60">
                      ⚠️ {alg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                <div className="flex items-center space-x-2 font-bold text-blue-300 uppercase tracking-wider mb-2">
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  <span>Chronic Conditions & Inhalers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.medicalProfile.chronicConditions.concat(user.medicalProfile.medications).map((item) => (
                    <span key={item} className="px-2.5 py-1 bg-blue-950/80 text-blue-200 font-semibold rounded-lg border border-blue-800/60">
                      💊 {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Contacts & Hospital */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Primary Emergency Contact</div>
                  <div className="font-bold text-white">{user.emergencyContact.name}</div>
                  <div className="text-rose-300 font-bold">{user.emergencyContact.phone}</div>
                </div>
                <a
                  href={`tel:${user.emergencyContact.phone}`}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                  title="Call Emergency Contact"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-black/30 p-3.5 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400">Preferred Hospital & Doctor</div>
                <div className="font-bold text-white">{user.medicalProfile.hospitalPreference}</div>
                <div className="text-slate-300">{user.medicalProfile.primaryDoctor}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: First-Responder Emergency Actions & Verification Pass */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ambulance className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Emergency Response Hub</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Immediate action for first-responders</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Card Status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active & Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Pass ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">MED-PASS-2026-X99</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Offline Availability</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Available 24/7</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${user.emergencyContact.phone}`}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Emergency Contact ({user.emergencyContact.name})</span>
              </a>

              <button
                onClick={handleShareCard}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Critical Medical Record</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
