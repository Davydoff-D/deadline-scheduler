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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{deadline.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <span className="text-sm font-medium text-gray-500">Due Date:</span>
            <p className="text-gray-900">
              {new Date(deadline.due_date).toLocaleString()}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Priority:</span>
            <p className="text-gray-900">
              {priorityEmoji} {deadline.priority.charAt(0).toUpperCase() + deadline.priority.slice(1)}
            </p>
          </div>

          {deadline.description && (
            <div>
              <span className="text-sm font-medium text-gray-500">Description:</span>
              <p className="text-gray-900 whitespace-pre-wrap">{deadline.description}</p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <p className="text-gray-900">
              {deadline.is_completed ? '✅ Completed' : '⏳ Pending'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!deadline.is_completed && (
            <button
              onClick={handleComplete}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Mark Complete'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
