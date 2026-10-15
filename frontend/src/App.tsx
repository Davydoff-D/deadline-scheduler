import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { DeadlineForm } from './components/DeadlineForm';
import { DeadlineModal } from './components/DeadlineModal';
import { Login } from './components/Login';
import { apiClient } from './api/client';
import type { Deadline, DeadlineCreate } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      loadDeadlines();
    }
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
    const previousDeadlines = deadlines;
    
    setDeadlines(prevDeadlines =>
      prevDeadlines.map(d =>
        d.id === deadlineId ? { ...d, due_date: newDate } : d
      )
    );

    try {
      await apiClient.updateDeadline(deadlineId, { due_date: newDate });
    } catch (err) {
      setDeadlines(previousDeadlines);
      console.error('Failed to update deadline:', err);
      throw err;
    }
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

  const handleLogin = () => {
    setIsAuthenticated(true);
    loadDeadlines();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setDeadlines([]);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 shadow-lg shadow-slate-950/50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Deadline Scheduler</h1>
              <p className="text-slate-400 text-sm mt-1">Stay organized, never miss a deadline</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-indigo-500/30 font-semibold"
              >
                + New Deadline
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition-all duration-200 border border-slate-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-950/50 border border-red-800 text-red-300 px-6 py-4 rounded-2xl backdrop-blur-sm">
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

          <div className="space-y-6 relative">
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

            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-950/50 p-6 border border-slate-800/50 relative z-10">
              <h2 className="text-xl font-bold text-slate-50 mb-4 tracking-tight">Upcoming Deadlines</h2>
              <div className="space-y-3">
                {deadlines
                  .filter((d) => !d.is_completed && new Date(d.due_date) > new Date())
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .slice(0, 5)
                  .map((deadline) => (
                    <div
                      key={deadline.id}
                      onClick={() => setSelectedDeadline(deadline)}
                      className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-800 hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">{deadline.title}</p>
                          <p className="text-sm text-slate-400 mt-1">
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
                  <p className="text-slate-500 text-center py-8">No upcoming deadlines</p>
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
