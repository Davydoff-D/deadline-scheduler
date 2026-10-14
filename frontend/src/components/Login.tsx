import { useState } from 'react';

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request login token from backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/request-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to request login token');
      }

      const data = await response.json();
      const loginToken = data.token;
      const deepLink = data.deep_link;

      // Open Telegram bot with deep link
      window.open(deepLink, '_blank');

      // Start polling for JWT token
      const maxAttempts = 60; // 60 attempts * 1 second = 1 minute
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError('Время ожидания истекло. Попробуйте снова.');
          return;
        }

        try {
          const pollResponse = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/complete-login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: loginToken }),
            }
          );

          // 200 = JWT ready
          if (pollResponse.status === 200) {
            const pollData = await pollResponse.json();
            
            if (pollData.access_token) {
              clearInterval(pollInterval);
              localStorage.setItem('access_token', pollData.access_token);
              onLogin(pollData.access_token);
            }
          } else if (pollResponse.status === 202) {
            
          } else {
            clearInterval(pollInterval);
            setIsLoading(false);
            setError('Ошибка авторизации. Попробуйте снова.');
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 1000); // Poll every 1 second

    } catch (err) {
      console.error('Login error:', err);
      setError('Ошибка при попытке входа. Попробуйте снова.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-950/50 p-12 border border-slate-800/50 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-50 tracking-tight mb-3">
            Deadline Scheduler
          </h1>
          <p className="text-slate-400 text-lg">
            Управляйте дедлайнами с помощью Telegram
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-50 mb-4">
              Войти через Telegram
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Нажмите кнопку ниже, чтобы открыть бота и завершить авторизацию
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-slate-400 text-sm">
                  Ожидание подтверждения в Telegram...
                </p>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg shadow-indigo-600/30"
              >
                Войти через Telegram
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Ещё нет бота?{' '}
              <a
                href="https://t.me/aisheduler_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                @aisheduler_bot
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
