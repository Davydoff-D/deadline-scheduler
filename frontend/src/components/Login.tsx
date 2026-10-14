import { useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface LoginProps {
  onLogin: (token: string) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void;
    };
  }
}

export function Login({ onLogin }: LoginProps) {
  useEffect(() => {
    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', import.meta.env.VITE_BOT_USERNAME || 'aisheduler_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '20');
    script.setAttribute('data-auth-url', window.location.origin + '/auth/callback');
    script.setAttribute('data-request-access', 'write');

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.appendChild(script);
    }

    // Handle Telegram auth callback
    window.TelegramLoginWidget = window.TelegramLoginWidget || {};
    window.TelegramLoginWidget.dataOnauth = async (user: TelegramUser) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/telegram`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              telegram_id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('access_token', data.access_token);
          onLogin(data.access_token);
        } else {
          console.error('Authentication failed:', await response.text());
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [onLogin]);

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
              Используйте ваш Telegram аккаунт для доступа к календарю дедлайнов
            </p>
            <div id="telegram-login-container" className="flex justify-center"></div>
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
