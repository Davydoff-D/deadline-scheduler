import { useState, useEffect } from 'react';
import { DateTimePicker } from './DateTimePicker';
import type { DeadlineCreate } from '../types';

interface DeadlineFormProps {
  onSubmit: (data: DeadlineCreate) => Promise<void>;
  onCancel: () => void;
  initialDate?: Date;
  loading?: boolean;
}

export function DeadlineForm({
  onSubmit,
  onCancel,
  initialDate,
  loading = false,
}: DeadlineFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDate) {
      setDueDate(initialDate);
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate.toISOString(),
        priority,
      });
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority('medium');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deadline');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-950/50 p-6 border border-slate-800/50">
      <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Add Deadline</h2>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Enter deadline title"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[4.5rem]"
          placeholder="Enter deadline description"
          rows={3}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Due Date *
        </label>
        <DateTimePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          disabled={loading}
          placeholderText="Select date and time"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={loading}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-all duration-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-indigo-500/30 disabled:from-slate-600 disabled:to-slate-600 font-semibold"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Deadline'}
        </button>
      </div>
    </form>
  );
}
