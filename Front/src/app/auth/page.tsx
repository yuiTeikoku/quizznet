'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthMode = 'participant' | 'organizer';

type ParticipantForm = {
  name: string;
};

type OrganizerForm = {
  login: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('participant');
  const [participantData, setParticipantData] = useState<ParticipantForm>({
    name: '',
  });
  const [organizerData, setOrganizerData] = useState<OrganizerForm>({
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: participantData.name }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('auth_token', data.data);
        setUserRole(data.role || 'User');
      } else {
        setError(data.messages?.join(', ') || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: organizerData.login, password: organizerData.password }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('auth_token', data.data);
        setUserRole(data.role || 'Admin');
      } else {
        setError(data.messages?.join(', ') || 'Ошибка при входе');
      }
    } catch (err) {
      setError('Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-300 via-pink-200 to-pink-300 opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <main className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-pink-400 shadow-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Авторизация</h1>
        </div>

        {/* Toggle Switch */}
        <div className="mb-6 p-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-sm animate-slideIn">
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setMode('participant')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                mode === 'participant'
                  ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Участник
              </span>
            </button>
            <button
              onClick={() => setMode('organizer')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                mode === 'organizer'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Организатор
              </span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-modern p-10 animate-slideIn">
          {mode === 'participant' ? (
            <form onSubmit={handleParticipantSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="participant-name"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Ваше имя
                  </span>
                </label>
                <input
                  id="participant-name"
                  type="text"
                  value={participantData.name}
                  onChange={(e) => setParticipantData({ ...participantData, name: e.target.value })}
                  required
                  className="input-modern"
                  placeholder="Введите ваше имя"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                      Вход...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 group-hover:rotate-12 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Войти как участник
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleOrganizerSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="organizer-login"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Логин
                  </span>
                </label>
                <input
                  id="organizer-login"
                  type="text"
                  value={organizerData.login}
                  onChange={(e) => setOrganizerData({ ...organizerData, login: e.target.value })}
                  required
                  className="input-modern"
                  placeholder="Введите ваш логин"
                />
              </div>

              <div>
                <label
                  htmlFor="organizer-password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Пароль
                  </span>
                </label>
                <input
                  id="organizer-password"
                  type="password"
                  value={organizerData.password}
                  onChange={(e) => setOrganizerData({ ...organizerData, password: e.target.value })}
                  required
                  className="input-modern"
                  placeholder="Введите ваш пароль"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-secondary group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                      Вход...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 group-hover:-rotate-12 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Войти как организатор
                    </>
                  )}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Success Message */}
        {userRole && (
          <div className="mt-6 card-modern p-8 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">Успешная авторизация!</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Ваша роль: <span className="font-medium">{userRole}</span></p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = userRole?.toLowerCase() === 'admin' ? '/admin' : '/games'}
              className="w-full mt-4 btn-primary"
            >
              <span className="flex items-center justify-center gap-2">
                Продолжить
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
