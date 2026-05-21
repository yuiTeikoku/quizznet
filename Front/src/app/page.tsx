'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/games');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <main className="relative z-10 w-full max-w-lg">
        {/* Logo/Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-pink-400 shadow-xl animate-pulseGlow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            QuizzNet
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Интерактивные викторины нового поколения
          </p>
        </div>

        {/* Main card */}
        <div className="card-modern p-10 animate-slideIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-teal-300 to-pink-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
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
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Добро пожаловать в QuizzNet
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Пожалуйста, авторизуйтесь для доступа к приложению
            </p>
          </div>

          <button
            onClick={() => router.push('/auth')}
            className="btn-primary w-full group"
          >
            <span className="flex items-center justify-center gap-2">
              Войти в приложение
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 mb-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-teal-600 dark:text-teal-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Викторины
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 mb-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-pink-600 dark:text-pink-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Участники
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 mb-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-pink-600 dark:text-pink-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Моментально
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
