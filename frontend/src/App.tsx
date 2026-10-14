import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { DeadlineForm } from './components/DeadlineForm';
import { DeadlineModal } from './components/DeadlineModal';
import { apiClient } from './api/client';
import type { Deadline, DeadlineCreate } from './types';

function App() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDeadlines();
      setDeadlines(data);
    } catch (err) {
      setError('Failed to load deadlines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeadline = async (data: DeadlineCreate) => {
    setLoading(true);
    try {
      await apiClient.createDeadline(data);
      await loadDeadlines();
      setShowForm(false);
      setSelectedDate(undefined);
    } catch (err) {
      console.error('Failed to create deadline:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeadlineDate = async (deadlineId: number, newDate: string) => {
    await apiClient.updateDeadline(deadlineId, { due_date: newDate });
    await loadDeadlines();
  };

  const handleCompleteDeadline = async (id: number) => {
    setLoading(true);
    try {
      await apiClient.completeDeadline(id);
      await loadDeadlines();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeadline = async (id: number) => {
    setLoading(true);
    try {
      await apiClient.deleteDeadline(id);
      await loadDeadlines();
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleDeadlineClick = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Deadline Scheduler</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              + Add Deadline
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              deadlines={deadlines}
              onDateSelect={handleDateSelect}
              onDeadlineClick={handleDeadlineClick}
              onDeadlineDrop={handleUpdateDeadlineDate}
            />
          </div>

          <div className="space-y-6">
            {showForm && (
              <DeadlineForm
                onSubmit={handleCreateDeadline}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedDate(undefined);
                }}
                initialDate={selectedDate}
                loading={loading}
              />
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Deadlines</h2>
              <div className="space-y-2">
                {deadlines
                  .filter((d) => !d.is_completed && new Date(d.due_date) > new Date())
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .slice(0, 5)
                  .map((deadline) => (
                    <div
                      key={deadline.id}
                      onClick={() => setSelectedDeadline(deadline)}
                      className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{deadline.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(deadline.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xl">
                          {{ high: '🔴', medium: '🟡', low: '🟢' }[deadline.priority]}
                        </span>
                      </div>
                    </div>
                  ))}
                {deadlines.filter((d) => !d.is_completed && new Date(d.due_date) > new Date()).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedDeadline && (
        <DeadlineModal
          deadline={selectedDeadline}
          onClose={() => setSelectedDeadline(null)}
          onComplete={handleCompleteDeadline}
          onDelete={handleDeleteDeadline}
          loading={loading}
        />
      )}
    </div>
  );
}

export default App;
