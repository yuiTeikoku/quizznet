'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decodeToken, setAuthToken, gameApi, UsersGameModel } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

export default function GameStatisticsPage() {
  const params = useParams();
  const router = useRouter();
  const linkKey = params.linkKey as string;
  const [statistics, setStatistics] = useState<UsersGameModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<{ name: string; leader: string } | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const apiUrl = process.env.API_URL || 'http://backend:8080';
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

    // Check if user is admin
    if (decoded.role?.toLowerCase() !== 'admin') {
      router.push('/');
      return;
    }

    setAuthToken(token);
    loadStatistics();

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

        // Обработка обновления состояния игры
        conn.on('update-state-game', (state: string) => {
          console.log('Состояние игры обновлено:', state);
          // Reload statistics when game state changes
          if (state === 'End' || state === 'OnPlay') {
            loadStatistics();
          }
        });

        await conn.start();
        await conn.invoke('JoinGame', linkKey);
        setConnection(conn);
      } catch (err) {
        console.error('SignalR connection failed:', err);
      }
    };

    connectSignalR();

    return () => {
      if (connection) {
        connection.stop().catch(err => console.error('Error stopping SignalR connection:', err));
      }
    };
  }, [linkKey, router]);

  const loadStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const res = await gameApi.getGameStatistics(linkKey);
      if (res.success) {
        setStatistics(res.data || []);
        // Get game info from first record
        if (res.data && res.data.length > 0) {
          setGameInfo({
            name: res.data[0].game?.quizz?.name || 'Неизвестная викторина',
            leader: res.data[0].game?.leaderUser?.nickname || 'Неизвестный ведущий'
          });
        }
      } else {
        setError(res.messages?.join(', ') || 'Ошибка загрузки статистики');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadStatistics(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="spinner"></div>
          <p className="text-gray-600">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-10 max-w-md text-center animate-fadeIn rounded-2xl shadow-xl border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => router.push('/admin')} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Вернуться в админ-панель
          </button>
        </div>
      </div>
    );
  }

  // Sort statistics by score descending
  const sortedStatistics = [...statistics].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/80 border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Статистика игры</h1>
                  <p className="text-xs text-gray-500">ID: {linkKey}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Админ-панель
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Game info */}
          {gameInfo && (
            <div className="mb-10 animate-fadeIn">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Участников: {statistics.length}</h2>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Результаты участников</h3>
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Обновляется в реальном времени
              </div>
            </div>

            {/* Chart */}
            {sortedStatistics.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">График результатов</h4>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                    disabled={refreshing}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    {refreshing ? 'Обновление...' : 'Обновить'}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={sortedStatistics.map((stat, index) => ({
                      name: stat.user?.nickname || 'Неизвестный',
                      score: stat.score || 0,
                      rank: index + 1
                    }))}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        value != null ? `${value} баллов` : '0 баллов',
                        'Очки'
                      ]}
                      labelFormatter={(label) => `Игрок: ${label}`}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {sortedStatistics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0 ? '#fbbf24' : // gold
                              index === 1 ? '#d1d5db' : // silver
                                index === 2 ? '#f59e0b' : // bronze
                                  '#a78bfa' // purple for others
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {sortedStatistics.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm p-16 text-center animate-fadeIn rounded-xl shadow-lg border border-gray-100">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Нет данных</h3>
                <p className="text-gray-600">Статистика по этой игре недоступна</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedStatistics.map((stat, index) => (
                  <div key={stat.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Rank */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg' :
                            'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg'
                        }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">{stat.score || 0}</div>
                        <div className="text-sm text-gray-500">баллов</div>
                      </div>
                    </div>

                    {/* User info */}
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">{stat.user?.nickname || 'Неизвестный'}</h4>
                      <p className="text-sm text-gray-500 capitalize">{stat.user?.userType || 'участник'}</p>
                      {index < 3 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-xs font-medium">
                          <span>{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</span>
                          {index === 0 ? 'Победитель' : index === 1 ? '2 место' : '3 место'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}