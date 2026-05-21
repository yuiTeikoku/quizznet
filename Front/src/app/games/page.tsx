'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, setAuthToken, gameApi, GameModel } from '@/lib/api';

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      router.push('/');
      return;
    }

    setAuthToken(token);
    setCurrentUserId(decoded.uid);
    loadGames();
  }, [router]);

  const loadGames = async () => {
    try {
      console.log('Loading games...');
      const res = await gameApi.getAllGames();
      console.log('Games API response:', res);
      if (res.success) {
        console.log('Games data:', res.data);
        // Filter games to show only those in Registry state (available for joining)
        const availableGames = (res.data || []).filter(game => game.quizzState === 'Registry');
        console.log('Available games:', availableGames);
        setGames(availableGames);
      } else {
        console.log('Games API error:', res.messages);
        setError(res.messages?.join(', ') || 'Ошибка загрузки игр');
      }
    } catch (err) {
      console.log('Games API network error:', err);
      setError('Ошибка сети');
    }
  };

  const handleJoinGame = async (game: GameModel) => {
    try {
      const isRegisteredRes = await gameApi.isRegistryUserToGame({ gameId: game.id });
      if (isRegisteredRes.success && isRegisteredRes.data) {
        router.push(`/game/link/${game.linkKey}`);
      } else {
        const regRes = await gameApi.registryUserToGame({ gameId: game.id });
        if (regRes.success) {
          router.push(`/game/link/${game.linkKey}`);
        } else {
          setError('Ошибка регистрации на игру');
        }
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  if (!loading) { return (<div>1</div>); }
  else {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse"></div>

          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="backdrop-blur-md bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-pink-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-white"
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
                  <h1 className="text-xl font-bold gradient-text">QuizzNet</h1>
                </div>
                <button
                  onClick={() => { localStorage.removeItem("auth_token"); router.push('/') }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
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
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Выход
                </button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page header */}
            <div className="mb-10 animate-fadeIn">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Доступные игры
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Присоединяйтесь к интересным викторинам или создайте свою собственную
              </p>
            </div>

            {/* Games grid */}
            {games.length === 0 ? (
              <div className="card-modern p-16 text-center animate-fadeIn">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-neutral-400"
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
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                  Нет доступных игр
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  К сожалению, сейчас нет активных игр. Попробуйте позже.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  На главную
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, index) => (
                  <div
                    key={game.id}
                    className="card-modern p-8 animate-slideIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Game header */}
                    <div className="text-center mb-4">
                      <div className="flex justify-center mb-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-pink-400">
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
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {game.quizz?.name || 'Без названия'}
                        </h3>
                      </div>
                    </div>

                    {/* Game info */}
                    <div className="space-y-3 mb-6 text-center">
                      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
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
                        <span>Ведущий:</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {game.leaderUser?.nickname || 'Неизвестен'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
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
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="truncate">Ключ: {game.linkKey}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleJoinGame(game)}
                      disabled={game.leaderUserId === currentUserId}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${game.leaderUserId === currentUserId
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'btn-primary'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {game.leaderUserId === currentUserId ? (
                          <>
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
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Вы ведущий
                          </>
                        ) : (
                          <>
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
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Присоединиться
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }
}
