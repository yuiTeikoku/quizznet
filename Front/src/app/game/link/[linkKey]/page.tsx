'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { setAuthToken, gameApi, GameStateModel } from '@/lib/api';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

const theme = {
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#ec4899',
    },
  },
};

export default function GameLinkPage() {
  const params = useParams();
  const linkKey = params.linkKey as string;
  const [data, setData] = useState<GameStateModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerSent, setAnswerSent] = useState(false);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<{ user: string; message: string }[]>([]);
  const [timer, setTimer] = useState<number | null>(null);

  const apiUrl = process.env.API_URL || 'http://backend:8080';
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
    }
    loadGameState();

    // Connect to SignalR
    const connectSignalR = async () => {
      try {
        console.log(apiUrl);
        const conn = new HubConnectionBuilder()
          .withUrl(`/api/quizzhub`, {
            accessTokenFactory: () => token!,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.None)
          .build();

        conn.on('ReceiveMessage', (user, message) => {
          setMessages(prev => [...prev, { user, message }]);
        });

        // Обработка изменения состояния игры
        conn.on('update-state-game', (state: string) => {
          console.log('Состояние игры обновлено:', state);
          // Reload game data to get updated question and state
          loadGameState();
          // Reset timer when game state changes
          if (state === 'End') {
            setTimer(null);
          }
        });

        // Обработка таймера
        conn.on('game-timer', (timeLeft: number) => {
          console.log('Осталось времени:', timeLeft);
          setTimer(timeLeft);
        });

        await conn.start();
        await conn.invoke('JoinGame', linkKey);
        setConnection(conn);
      } catch (err) {
        console.error('SignalR connection failed:', err);
      }
    };

    connectSignalR();

    // Poll every 5 seconds
    const interval = setInterval(loadGameState, 5000);
    return () => {
      clearInterval(interval);
      if (connection) {
        connection.stop();
      }
    };
  }, [linkKey]);

  const loadGameState = async () => {
    try {
      const res = await gameApi.getGameByLink(linkKey);
      if (res.success) {
        setData(res.data);
        // Check if answer sent for current question
        if (res.data?.question) {
          checkAnswerSent(res.data.gameId, res.data.question.id);
        } else {
          // No question, reset timer
          setTimer(null);
        }
      } else {
        setError(res.messages?.join(', ') || 'Ошибка загрузки');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswerSent = async (gameId: number, questionId: number) => {
    try {
      const res = await gameApi.isSendAnswer({ gameId, questionId, answer: '' });
      setAnswerSent(res.success && !!res.data);
    } catch (err) {
      // ignore
    }
  };

  const handleSendAnswer = async () => {
    if (!data?.question) return;
    try {
      const res = await gameApi.sendAnswer({ gameId: data.gameId, questionId: data.question.id, answer });
      if (res.success) {
        setAnswerSent(true);
      } else {
        alert('Ошибка отправки ответа');
      }
    } catch (err) {
      alert('Ошибка сети');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="spinner"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 card-modern p-10 max-w-md text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Ошибка</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
          <button onClick={() => window.history.back()} className="btn-primary">Назад</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 card-modern p-10 max-w-md text-center animate-fadeIn">
          <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Нет данных</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Не удалось загрузить данные игры</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (data.quizzState) {
      case 'Registry':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Ожидание начала игры
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Пожалуйста, подождите, пока ведущий начнет игру. Все участники должны завершить регистрацию.
            </p>
          </div>
        );
      case 'OnPlay':
        if (!data.question) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                Ожидание вопроса...
              </h2>
            </div>
          );
        }
        const questionData = JSON.parse(data.question.questionData || '{}');
        const answerData = JSON.parse(data.question.answerData || '{}');
        return (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="card-modern p-8 md:p-10">
              {/* Timer display */}
              {timer !== null && (
                <div className="mb-6 flex justify-center">
                  <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg ${timer <= 10
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse'
                    : timer <= 30
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div className="text-center">
                      <div className="text-3xl font-bold tabular-nums">{timer}</div>
                      <div className="text-sm opacity-90">секунд</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Question header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Вопрос</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Баллы: {data.question.points}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Порядок</span>
                  <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{data.question.order}</div>
                </div>
              </div>

              {/* Question content */}
              <div className="mb-6">
                <p className="text-lg text-neutral-900 dark:text-neutral-100 mb-4 leading-relaxed">
                  {questionData.text || questionData.url || data.question.questionData}
                </p>
                {data.question.questionType === 'Image' && questionData.url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={questionData.url}
                      alt="Question"
                      className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
                    />
                  </div>
                )}
              </div>

              {/* Answer options */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
                  Ваш ответ:
                </h4>
                {data.question.answerType === 'Text' ? (
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={answerSent}
                    placeholder="Введите ваш ответ..."
                    className={`input-modern ${answerSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                ) : (
                  <div className="space-y-3">
                    {answerData.options?.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => !answerSent && setAnswer(option)}
                        disabled={answerSent}
                        className={`w-full p-4 rounded-xl text-left transition-all ${answer === option
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 hover:bg-white dark:hover:bg-neutral-700'
                          } ${answerSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${answer === option
                            ? 'bg-white/20'
                            : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1">{option}</span>
                          {answer === option && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSendAnswer}
                  disabled={answerSent || !answer.trim()}
                  className={`py-4 px-8 rounded-xl font-semibold transition-all ${answerSent
                    ? 'bg-green-500 text-white cursor-default'
                    : answer.trim()
                      ? 'btn-primary'
                      : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    {answerSent ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Ответ отправлен
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Отправить ответ
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'End':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Игра окончена
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Спасибо за участие! Результаты будут подведены ведущим.
            </p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Неизвестное состояние игры
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">{data.quizzState}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-300 via-pink-200 to-pink-300 opacity-10"></div>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">QuizzNet</h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {linkKey}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {renderContent()}
        </main>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
