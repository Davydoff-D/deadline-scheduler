import type { Deadline } from '../types';

interface DeadlineModalProps {
  deadline: Deadline;
  onClose: () => void;
  onComplete: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

export function DeadlineModal({
  deadline,
  onClose,
  onComplete,
  onDelete,
  loading = false,
}: DeadlineModalProps) {
  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }[deadline.priority];

  const handleComplete = async () => {
    await onComplete(deadline.id);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this deadline?')) {
      await onDelete(deadline.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-950/80 max-w-md w-full mx-4 p-8 border border-slate-700/50">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-slate-50 pr-4 tracking-tight">{deadline.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-2xl leading-none"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</span>
            <p className="text-slate-100 mt-1">
              {new Date(deadline.due_date).toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</span>
            <p className="text-slate-100 mt-1">
              {priorityEmoji} {deadline.priority.charAt(0).toUpperCase() + deadline.priority.slice(1)}
            </p>
          </div>

          {deadline.description && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</span>
              <p className="text-slate-100 whitespace-pre-wrap mt-1">{deadline.description}</p>
            </div>
          )}

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
            <p className="text-slate-100 mt-1">
              {deadline.is_completed ? '✅ Completed' : '⏳ Pending'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!deadline.is_completed && (
            <button
              onClick={handleComplete}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/30 disabled:from-slate-600 disabled:to-slate-600"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Mark Complete'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-500 hover:to-rose-400 transition-all duration-200 font-semibold shadow-lg shadow-rose-500/30 disabled:from-slate-600 disabled:to-slate-600"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
