import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Check,
  RotateCcw
} from 'lucide-react';
import { ReminderItem } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RemindersViewProps {
  reminders: ReminderItem[];
  onAddReminder: (reminder: ReminderItem) => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderItem['category']>('License Renewal');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<ReminderItem['recurring']>('Yearly');
  const [notes, setNotes] = useState('');
  const [reminderToDelete, setReminderToDelete] = useState<ReminderItem | null>(null);

  const filtered = reminders.filter((r) => {
    if (filter === 'active') return !r.completed;
    if (filter === 'completed') return r.completed;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const newReminder: ReminderItem = {
      id: `rem_${Date.now()}`,
      title,
      category,
      dueDate,
      recurring,
      completed: false,
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddReminder(newReminder);
    setTitle('');
    setDueDate('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <BellRing className="w-7 h-7 text-blue-600" />
            <span>Reminders & Document Renewals</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated compliance tracker for passport renewals, medical checkups, license expirations, and custom alerts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Reminder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit text-xs font-semibold">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'active'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Active ({reminders.filter((r) => !r.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'completed'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Completed ({reminders.filter((r) => r.completed).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          All ({reminders.length})
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">All reminders up to date!</h3>
            <p className="text-xs text-slate-500 mt-1">No active renewal alerts found in this view.</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                r.completed
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => onToggleComplete(r.id)}
                  className={`mt-1 p-1 rounded-lg border transition-colors ${
                    r.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${r.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {r.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.notes}</p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Due: {r.dueDate}</span>
                    </span>
                    <span>• Recurring: {r.recurring}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => setReminderToDelete(r)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Custom Vault Reminder</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Renewal Form DS-82"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReminderItem['category'])}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  {['Medicine', 'Passport Renewal', 'License Renewal', 'Insurance Renewal', 'Vaccination', 'Medical Checkup', 'Custom'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Recurring Schedule</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as ReminderItem['recurring'])}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="None">One-time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Notes / Action Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Instructions or links..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!reminderToDelete}
        title="Delete Reminder?"
        itemName={reminderToDelete?.title}
        description={`Are you sure you want to delete the reminder "${reminderToDelete?.title}" (Due: ${reminderToDelete?.dueDate})?`}
        warningText="This reminder will be removed from your active compliance tracker."
        confirmText="Delete Reminder"
        isPermanent={true}
        onConfirm={() => {
          if (reminderToDelete) {
            onDeleteReminder(reminderToDelete.id);
            setReminderToDelete(null);
          }
        }}
        onClose={() => setReminderToDelete(null)}
      />
    </div>
  );
};
