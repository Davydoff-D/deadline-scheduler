import { useState } from 'react';
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
  const [dueDate, setDueDate] = useState(
    initialDate ? initialDate.toISOString().slice(0, 16) : ''
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [error, setError] = useState('');

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
        due_date: new Date(dueDate).toISOString(),
        priority,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deadline');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900">Add Deadline</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter deadline title"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter deadline description"
          rows={3}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date *
        </label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Deadline'}
        </button>
      </div>
    </form>
  );
}
