'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, setAuthToken, userApi, quizzApi, questionApi, gameApi, UserModel, QuizzModel, QuestionModel, GameModel } from '@/lib/api';
import type { ReactElement } from 'react';

type Tab = 'users' | 'quizzes' | 'questions' | 'games';

const TABS: Record<Tab, { label: string; icon: ReactElement }> = {
  users: {
    label: 'Пользователи',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  quizzes: {
    label: 'Викторины',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  questions: {
    label: 'Вопросы',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  games: {
    label: 'Игры',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
};

function hasAdminRole(decoded: any): boolean {
  if (!decoded) return false;
  return decoded.role?.toLowerCase() === 'admin';
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<Tab>('users');

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    localStorage.setItem('admin_current_tab', tab);
  };

  const [users, setUsers] = useState<UserModel[]>([]);
  const [quizzes, setQuizzes] = useState<QuizzModel[]>([]);
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [games, setGames] = useState<GameModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User edit dialog
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState<UserModel | null>(null);
  const [editFormData, setEditFormData] = useState({ nickname: '', password: '', userType: '' });

  // Quiz dialogs
  const [showAddQuizzForm, setShowAddQuizzForm] = useState(false);
  const [addQuizzFormData, setAddQuizzFormData] = useState({ name: '', description: '' });
  const [showEditQuizzForm, setShowEditQuizzForm] = useState(false);
  const [editQuizz, setEditQuizz] = useState<QuizzModel | null>(null);
  const [editQuizzFormData, setEditQuizzFormData] = useState({ name: '', description: '' });

  // Questions
  const [selectedQuizzId, setSelectedQuizzId] = useState<number | null>(null);
  const [selectedQuizzName, setSelectedQuizzName] = useState<string>('');
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [addQuestionFormData, setAddQuestionFormData] = useState({
    quizzId: -1,
    questionType: 'Text',
    questionText: '',
    questionImageUrl: '',
    answerType: 'Text',
    answerOptions: '',
    correctAnswer: '',
    points: 1,
    order: 0
  });

  // File manager state
  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [imageList, setImageList] = useState<{ id: string; url: string; filename?: string }[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const [showEditQuestionForm, setShowEditQuestionForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionModel | null>(null);
  const [editQuestionFormData, setEditQuestionFormData] = useState({
    quizzId: -1,
    questionType: 'Text',
    questionText: '',
    questionImageUrl: '',
    answerType: 'Text',
    answerOptions: '',
    correctAnswer: '',
    points: 1,
    order: 0
  });

  // Game dialogs
  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [addGameFormData, setAddGameFormData] = useState({
    quizzId: -1,
    leaderUserId: -1,
    shuffleQuestion: true
  });
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false);
  const [gameToStart, setGameToStart] = useState<GameModel | null>(null);
  const [startingGameId, setStartingGameId] = useState<number | null>(null);

  const handleEditUser = (user: UserModel) => {
    setEditUser(user);
    setEditFormData({ nickname: user.nickname, password: '', userType: user.userType });
    setShowEditForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setLoading(true);
    try {
      const res = await userApi.updateUser({ id: editUser.id, ...editFormData });
      if (res.success) {
        setShowEditForm(false);
        setEditUser(null);
        loadData('users');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка обновления');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuizz = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await quizzApi.addQuizz(addQuizzFormData);
      if (res.success) {
        setShowAddQuizzForm(false);
        setAddQuizzFormData({ name: '', description: '' });
        loadData('quizzes');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка добавления викторины');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuizz = (quizz: QuizzModel) => {
    setEditQuizz(quizz);
    setEditQuizzFormData({ name: quizz.name || '', description: quizz.description || '' });
    setShowEditQuizzForm(true);
  };

  const handleUpdateQuizz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuizz) return;
    setLoading(true);
    try {
      const res = await quizzApi.updateQuizz({ id: editQuizz.id, ...editQuizzFormData });
      if (res.success) {
        setShowEditQuizzForm(false);
        setEditQuizz(null);
        loadData('quizzes');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка обновления викторины');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuizz = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить викторину?')) return;
    setLoading(true);
    try {
      const res = await quizzApi.deleteQuizz(id);
      if (res.success) {
        loadData('quizzes');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка удаления викторины');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить игру? Это действие нельзя отменить.')) return;
    setLoading(true);
    try {
      const res = await gameApi.deleteGame(id);
      if (res.success) {
        loadData('games');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка удаления игры');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameToStart) return;
    setStartingGameId(gameToStart.id);
    setLoading(true);
    try {
      const res = await gameApi.startGame(gameToStart.id);
      if (res.success) {
        setShowStartConfirmDialog(false);
        setGameToStart(null);
        setStartingGameId(null);
        loadData('games');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка запуска игры');
        setStartingGameId(null);
      }
    } catch (err) {
      setError('Ошибка сети');
      setStartingGameId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizzClick = (quizz: QuizzModel) => {
    setSelectedQuizzId(quizz.id);
    setSelectedQuizzName(quizz.name || '');
    handleTabChange('questions');
  };

  const parseQuestionData = (question: QuestionModel) => {
    try {
      const data = JSON.parse(question.questionData || '{}');
      if (question.questionType === 'Text') {
        return { questionText: data.text || '', questionImageUrl: '' };
      } else {
        return { questionText: '', questionImageUrl: data.url || '' };
      }
    } catch {
      return { questionText: question.questionData || '', questionImageUrl: '' };
    }
  };

  const parseAnswerData = (question: QuestionModel) => {
    try {
      const data = JSON.parse(question.answerData || '{}');
      return { answerOptions: (data.options || []).join('\n') };
    } catch {
      return { answerOptions: question.answerData || '' };
    }
  };

  const handleEditQuestion = (question: QuestionModel) => {
    const qData = parseQuestionData(question);
    const aData = parseAnswerData(question);
    setEditQuestion(question);
    setEditQuestionFormData({
      quizzId: question.quizzId,
      questionType: question.questionType || 'Text',
      ...qData,
      answerType: question.answerType || 'Text',
      ...aData,
      correctAnswer: question.correctAnswer || '',
      points: typeof question.points === 'number' ? question.points : 1,
      order: typeof question.order === 'number' ? question.order : 0
    });
    setShowEditQuestionForm(true);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuestion) return;
    setLoading(true);
    try {
      const questionData = editQuestionFormData.questionType === 'Text'
        ? JSON.stringify({ text: editQuestionFormData.questionText })
        : JSON.stringify({ url: editQuestionFormData.questionImageUrl });

      const answerData = editQuestionFormData.answerType === 'Text'
        ? ''
        : JSON.stringify({ options: editQuestionFormData.answerOptions.split('\n').filter(o => o.trim()) });

      const res = await questionApi.updateQuestion({
        id: editQuestion.id,
        questionType: editQuestionFormData.questionType,
        questionData,
        answerType: editQuestionFormData.answerType,
        answerData,
        correctAnswer: editQuestionFormData.correctAnswer,
        points: editQuestionFormData.points,
        order: editQuestionFormData.order
      });
      if (res.success) {
        setShowEditQuestionForm(false);
        setEditQuestion(null);
        loadData('questions');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка обновления вопроса');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await gameApi.addGame({ quizzId: addGameFormData.quizzId, leaderUserId: addGameFormData.leaderUserId, shuffleQuestion: addGameFormData.shuffleQuestion  });
      if (res.success) {
        setShowAddGameForm(false);
        setAddGameFormData({ quizzId: -1, leaderUserId: -1, shuffleQuestion: false });
        loadData('games');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка создания игры');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить вопрос?')) return;
    setLoading(true);
    try {
      const res = await questionApi.deleteQuestion(id);
      if (res.success) {
        loadData('questions');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка удаления вопроса');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const questionData = addQuestionFormData.questionType === 'Text'
        ? JSON.stringify({ text: addQuestionFormData.questionText })
        : JSON.stringify({ url: addQuestionFormData.questionImageUrl });

      const answerData = addQuestionFormData.answerType === 'Text'
        ? ''
        : JSON.stringify({ options: addQuestionFormData.answerOptions.split('\n').filter(o => o.trim()) });

      const res = await questionApi.addQuestion({
        quizzId: addQuestionFormData.quizzId,
        questionType: addQuestionFormData.questionType,
        questionData,
        answerType: addQuestionFormData.answerType,
        answerData,
        correctAnswer: addQuestionFormData.correctAnswer
      });
      if (res.success) {
        setShowAddQuestionForm(false);
        setAddQuestionFormData({
          quizzId: selectedQuizzId ?? -1,
          questionType: 'Text',
          questionText: '',
          questionImageUrl: '',
          answerType: 'Text',
          answerOptions: '',
          correctAnswer: '',
          points: 1,
          order: 0
        });
        loadData('questions');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка добавления вопроса');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить пользователя?')) return;
    setLoading(true);
    try {
      const res = await userApi.deleteUser(id);
      if (res.success) {
        loadData('users');
      } else {
        setError(res.messages?.join(', ') || 'Ошибка удаления');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

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

    setUserRole(decoded.role || '');
    if (!hasAdminRole(decoded)) {
      setIsAuthorized(false);
      return;
    }

    setAuthToken(token);
    const savedTab = localStorage.getItem('admin_current_tab') as Tab;
    if (savedTab && ['users', 'quizzes', 'questions', 'games'].includes(savedTab)) {
      setCurrentTab(savedTab);
    }
    setIsAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadData(currentTab);
    }
  }, [currentTab, isAuthorized]);

  const loadData = async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case 'users':
          const usersRes = await userApi.getAllUsers();
          if (usersRes.success) setUsers(usersRes.data || []);
          else setError(usersRes.messages?.join(', ') || 'Ошибка загрузки пользователей');
          break;
        case 'quizzes':
          const quizzesRes = await quizzApi.getAllQuizz();
          if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
          else setError(quizzesRes.messages?.join(', ') || 'Ошибка загрузки викторин');
          break;
        case 'questions':
          const questionsRes = selectedQuizzId != null ? await questionApi.getQuestionsByQuizz(selectedQuizzId) : { success: false, messages: ["Не выбран опрос"], data: null }
          if (questionsRes.success) setQuestions(questionsRes.data || []);
          else setError(questionsRes.messages?.join(', ') || 'Ошибка загрузки вопросов');
          break;
        case 'games':
          const gamesRes = await gameApi.getAllGames();
          if (gamesRes.success) setGames(gamesRes.data || []);
          else setError(gamesRes.messages?.join(', ') || 'Ошибка загрузки игр');
          break;
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  // File Manager helpers
  const IMAGE_SERVICE_BASE = 'http://localhost:3001/api';

  const loadImagesFromManager = async () => {
    try {
      const res = await fetch(`/api-images/api/images/all`);
      const body = await res.json();
      console.log(body.images)
      const items = body.images
      const normalized = items
        .map((id: string) => ({
          id: id,
          url: `/api-images/api/images/${id}`,
          filename: id,
        }));
      setImageList(normalized);
    } catch {
      setImageList([]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setImageUploading(true);
    try {
      await fetch(`/api-images/api/upload`, { method: 'POST', body: formData });
      await loadImagesFromManager();
    } catch {
      // ignore
    } finally {
      setImageUploading(false);
    }
    e.target.value = '';
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="spinner"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-10 max-w-md text-center animate-fadeIn rounded-2xl shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Доступ запрещен</h2>
          <p className="text-gray-600 mb-2">Ваша роль: <span className="font-medium">{userRole || 'не определена'}</span></p>
          <p className="text-gray-600 mb-6">Необходима роль Admin для доступа к админ панели.</p>
          <button onClick={() => router.push('/')} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Вернуться на главную</button>
        </div>
      </div>
    );
  }

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
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">QuizzNet Admin</h1>
              </div>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Выход
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="border-b border-gray-200 bg-white/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex gap-2 overflow-x-auto justify-center">
              {(Object.keys(TABS) as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  disabled={tab === 'questions' && !selectedQuizzId}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${currentTab === tab
                    ? 'border-pink-500 text-pink-600'
                    : tab === 'questions' && !selectedQuizzId
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  {TABS[tab].icon}
                  {TABS[tab].label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          {/* Back button for questions tab */}
          {currentTab === 'questions' && selectedQuizzId && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={() => {
                  setSelectedQuizzId(null);
                  setSelectedQuizzName('');
                  handleTabChange('quizzes');
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Назад к викторинам
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-10 p-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center gap-4 animate-fadeIn max-w-3xl mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-red-700 text-center text-lg font-medium">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {currentTab === 'users' && (
                <div className="animate-fadeIn">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Пользователи</h2>
                    <button
                      onClick={() => {
                        setEditUser(null);
                        setEditFormData({ nickname: '', password: '', userType: 'User' });
                        setShowEditForm(true);
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-flex items-center gap-3 shadow-md hover:shadow-lg text-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Добавить пользователя
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {users.map((user) => (
                      <div key={user.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-sm">
                        <div className="text-center mb-6">
                          <div className="flex justify-center mb-4">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-center space-y-1">
                            <h3 className="font-semibold text-gray-900 text-xl">{user.nickname}</h3>
                            <p className="text-sm text-gray-500 capitalize">{user.userType}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id ?? -1)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes Tab */}
              {currentTab === 'quizzes' && (
                <div className="animate-fadeIn">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Викторины</h2>
                    <button
                      onClick={() => setShowAddQuizzForm(true)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-flex items-center gap-3 shadow-md hover:shadow-lg text-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Добавить викторину
                    </button>
                  </div>
                  <div className="space-y-8 max-w-4xl mx-auto">
                    {quizzes.map((quizz) => (
                      <div key={quizz.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleQuizzClick(quizz)}
                            className="flex-1 text-left hover:bg-gray-50 rounded-lg p-6 -m-6 transition-colors group"
                          >
                            <h3 className="font-semibold text-gray-900 text-2xl mb-2 group-hover:text-pink-600 transition-colors">{quizz.name}</h3>
                            <p className="text-gray-600 text-lg">{quizz.description || 'Нет описания'}</p>
                          </button>
                          <div className="flex gap-3 ml-8">
                            <button
                              onClick={() => handleEditQuizz(quizz)}
                              className="flex items-center justify-center w-14 h-14 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteQuizz(quizz.id ?? -1)}
                              className="flex items-center justify-center w-14 h-14 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Tab */}
              {currentTab === 'questions' && (
                <div className="animate-fadeIn">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Вопросы</h2>
                    <p className="text-gray-600 text-xl mb-6 font-medium">Викторина: {selectedQuizzName}</p>
                    <button
                      onClick={() => {
                        setAddQuestionFormData(prev => ({ ...prev, quizzId: selectedQuizzId ?? -1 }));
                        setShowAddQuestionForm(true);
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-flex items-center gap-3 shadow-md hover:shadow-lg text-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Добавить вопрос
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {questions.map((question) => (
                      <div key={question.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-sm">
                        <div className="text-center mb-6">
                          <h3 className="font-semibold text-gray-900 text-lg line-clamp-3 mb-4 leading-relaxed">
                            {(() => {
                              try {
                                const qData = JSON.parse(question.questionData || '{}');
                                return qData.text || qData.url || question.questionData;
                              } catch {
                                return question.questionData;
                              }
                            })()}
                          </h3>
                          <div className="flex justify-center gap-8 text-sm text-gray-500 mb-6">
                            <div className="text-center">
                              <div className="font-medium">Порядок</div>
                              <div className="text-lg">{question.order}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">Баллы</div>
                              <div className="text-lg">{question.points}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Games Tab */}
              {currentTab === 'games' && (
                <div className="animate-fadeIn">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Игры</h2>
                    <button
                      onClick={() => setShowAddGameForm(true)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-flex items-center gap-3 shadow-md hover:shadow-lg text-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Создать игру
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {games.map((game) => (
                      <div key={game.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-md">
                        <div className="text-center mb-6">
                          <h3 className="font-semibold text-gray-900 text-xl mb-4">{game.quizz?.name || 'Без названия'}</h3>
                          <div className="space-y-2 mb-6">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Ведущий:</span> {game.leaderUser?.nickname || 'Неизвестен'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Статус:</span> <span className="capitalize font-medium">{game.quizzState}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Ключ:</span> {game.linkKey}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => {
                              setGameToStart(game);
                              setShowStartConfirmDialog(true);
                            }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium"
                            title="Запустить игру"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Запустить игру
                          </button>
                          <button
                            onClick={() => router.push(`/game/statistics/${game.linkKey}`)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                            title="Просмотреть статистику"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 3v18h18" />
                              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                            Статистика
                          </button>
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                            title="Удалить игру"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Удалить игру
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Edit User Dialog */}
      {showEditForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-md animate-scaleIn rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Редактировать пользователя</h3>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Никнейм</label>
                <input
                  type="text"
                  value={editFormData.nickname}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Пароль</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Роль</label>
                <select
                  value={editFormData.userType}
                  onChange={(e) => setEditFormData({ ...editFormData, userType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz Dialog */}
      {showAddQuizzForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-md animate-scaleIn rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Добавить викторину</h3>
            <form onSubmit={handleAddQuizz} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Название</label>
                <input
                  type="text"
                  value={addQuizzFormData.name}
                  onChange={(e) => setAddQuizzFormData({ ...addQuizzFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Описание</label>
                <textarea
                  value={addQuizzFormData.description}
                  onChange={(e) => setAddQuizzFormData({ ...addQuizzFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddQuizzForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quiz Dialog */}
      {showEditQuizzForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-md animate-scaleIn rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Редактировать викторину</h3>
            <form onSubmit={handleUpdateQuizz} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Название</label>
                <input
                  type="text"
                  value={editQuizzFormData.name}
                  onChange={(e) => setEditQuizzFormData({ ...editQuizzFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Описание</label>
                <textarea
                  value={editQuizzFormData.description}
                  onChange={(e) => setEditQuizzFormData({ ...editQuizzFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditQuizzForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Dialog */}
      {showAddQuestionForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-3xl animate-scaleIn max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Добавить вопрос</h3>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Викторина *</label>
                <select
                  value={addQuestionFormData.quizzId}
                  onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, quizzId: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="">Выберите викторину</option>
                  {quizzes.map((quizz) => (
                    <option key={quizz.id} value={quizz.id ?? -1}>{quizz.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Тип вопроса</label>
                <select
                  value={addQuestionFormData.questionType}
                  onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, questionType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="Text">Текст</option>
                  <option value="Image">Изображение</option>
                </select>
              </div>
              {addQuestionFormData.questionType === 'Text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Текст вопроса *</label>
                  <textarea
                    value={addQuestionFormData.questionText}
                    onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, questionText: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                  />
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-3">URL изображения *</label>
                    <input
                      type="text"
                      value={addQuestionFormData.questionImageUrl}
                      onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, questionImageUrl: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageManagerOpen(true); loadImagesFromManager(); }}
                    className="px-5 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium transition-colors whitespace-nowrap"
                  >
                    Файловый менеджер
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Тип ответа</label>
                <select
                  value={addQuestionFormData.answerType}
                  onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, answerType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="Text">Текстовый</option>
                  <option value="Select">Выбор одного варианта</option>
                  <option value="MultiSelect">Множественный выбор</option>
                </select>
              </div>
              {(addQuestionFormData.answerType === 'Select' || addQuestionFormData.answerType === 'MultiSelect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Варианты ответа (каждая строка - новый вариант) *</label>
                  <textarea
                    value={addQuestionFormData.answerOptions}
                    onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, answerOptions: e.target.value })}
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Правильный ответ *</label>
                <input
                  type="text"
                  value={addQuestionFormData.correctAnswer}
                  onChange={(e) => setAddQuestionFormData({ ...addQuestionFormData, correctAnswer: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Dialog */}
      {showEditQuestionForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-3xl animate-scaleIn max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Редактировать вопрос</h3>
            <form onSubmit={handleUpdateQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Викторина *</label>
                <select
                  value={editQuestionFormData.quizzId}
                  onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, quizzId: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="">Выберите викторину</option>
                  {quizzes.map((quizz) => (
                    <option key={quizz.id} value={quizz.id ?? -1}>{quizz.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Тип вопроса</label>
                <select
                  value={editQuestionFormData.questionType}
                  onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, questionType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="Text">Текст</option>
                  <option value="Image">Изображение</option>
                </select>
              </div>
              {editQuestionFormData.questionType === 'Text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Текст вопроса *</label>
                  <textarea
                    value={editQuestionFormData.questionText}
                    onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, questionText: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                  />
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-3">URL изображения *</label>
                    <input
                      type="text"
                      value={editQuestionFormData.questionImageUrl}
                      onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, questionImageUrl: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageManagerOpen(true); loadImagesFromManager(); }}
                    className="px-5 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium transition-colors whitespace-nowrap"
                  >
                    Файловый менеджер
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Тип ответа</label>
                <select
                  value={editQuestionFormData.answerType}
                  onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, answerType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="Text">Текстовый</option>
                  <option value="Select">Выбор одного варианта</option>
                  <option value="MultiSelect">Множественный выбор</option>
                </select>
              </div>
              {(editQuestionFormData.answerType === 'Select' || editQuestionFormData.answerType === 'MultiSelect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Варианты ответа (каждая строка - новый вариант) *</label>
                  <textarea
                    value={editQuestionFormData.answerOptions}
                    onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, answerOptions: e.target.value })}
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Правильный ответ *</label>
                <input
                  type="text"
                  value={editQuestionFormData.correctAnswer}
                  onChange={(e) => setEditQuestionFormData({ ...editQuestionFormData, correctAnswer: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditQuestionForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Game Dialog */}
      {showAddGameForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-md animate-scaleIn rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Создать игру</h3>
            <form onSubmit={handleAddGame} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Викторина *</label>
                <select
                  value={addGameFormData.quizzId}
                  onChange={(e) => setAddGameFormData({ ...addGameFormData, quizzId: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="">Выберите викторину</option>
                  {quizzes.map((quizz) => (
                    <option key={quizz.id} value={quizz.id ?? -1}>{quizz.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Ведущий (Admin) *</label>
                <select
                  value={addGameFormData.leaderUserId}
                  onChange={(e) => setAddGameFormData({ ...addGameFormData, leaderUserId: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg"
                >
                  <option value="">Выберите ведущего</option>
                  {users.filter(user => user.userType?.toLowerCase() === 'admin').map((user) => (
                    <option key={user.id} value={user.id}>{user.nickname}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="shuffle"
                  checked={addGameFormData.shuffle}
                  onChange={(e) => setAddGameFormData({ ...addGameFormData, shuffleQuestion: e.target.checked })}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="shuffle" className="text-sm font-medium text-gray-700">Перемешать вопросы</label>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGameForm(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Game Confirmation Dialog */}
      {showStartConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-10 w-full max-w-md animate-scaleIn rounded-2xl shadow-2xl border border-gray-200">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Запуск игры</h3>
              <p className="text-gray-600">
                Вы действительно хотите запустить игру <span className="font-semibold text-gray-900">"{gameToStart?.quizz?.name}"</span>?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowStartConfirmDialog(false);
                  setGameToStart(null);
                }}
                className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Закрыть
              </button>
              <button
                onClick={handleStartGame}
                disabled={startingGameId === gameToStart?.id}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {startingGameId === gameToStart?.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner w-4 h-4"></div>
                    Запуск...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Запустить
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Manager Dialog */}
      {imageManagerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-sm p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Файловый менеджер</h3>
              <button
                type="button"
                onClick={() => setImageManagerOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Закрыть
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 px-5 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Загрузить изображение
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageUploading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="spinner w-5 h-5"></div>
                  <span>Загрузка...</span>
                </div>
              )}
              <button
                type="button"
                onClick={loadImagesFromManager}
                className="px-5 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Обновить
              </button>
            </div>
            {imageList.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Нет загруженных изображений</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {imageList.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setAddQuestionFormData(prev => ({ ...prev, questionImageUrl: img.url }));
                      setEditQuestionFormData(prev => ({ ...prev, questionImageUrl: img.url }));
                      setImageManagerOpen(false);
                    }}
                    className="relative group border rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all aspect-square"
                  >
                    <img
                      src={img.url}
                      alt={img.filename || 'Image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
