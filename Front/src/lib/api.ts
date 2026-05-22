import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DecodedToken {
  name: string;
  uid: string;
  role: string;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    const decodedPayload = JSON.parse(atob(paddedPayload));
    return decodedPayload;
  } catch {
    return null;
  }
};

export interface NicknamePasswordModel {
  nickname: string;
  password: string;
}

export interface NicknameModel {
  nickname: string;
}

export interface ResponseModel<T> {
  success: boolean;
  data: T | null;
  messages: string[];
}

export interface AddGameModel {
  quizzId?: number | null;
  leaderUserId?: number | null;
}

export interface UpdateGameModel {
  id?: number | null;
  quizzState?: string;
  questionsId?: (number | null)[];
}

export interface GameModel {
  quizzId: number | null;
  quizzState: string;
  questionsId: (number | null)[];
  id: number;
  linkKey: string;
  leaderUserId: number | null;
  createAt: string;
  leaderUser: UserModel;
  quizz: QuizzModel;
}

export interface RegistyUserToGameModel {
  gameId: number;
}

export interface SendAnswerModel {
  gameId: number;
  questionId: number;
  answer: string;
}

export interface AddQuestionModel {
  quizzId?: number;
  questionType?: string;
  questionData?: string;
  answerType?: string;
  answerData?: string;
  correctAnswer?: string;
}

export interface UpdateQuestionModel {
  id?: number;
  order?: number | null;
  questionType?: string | null;
  questionData?: string | null;
  answerType?: string | null;
  answerData?: string | null;
  correctAnswer?: string | null;
  points?: number | null;
}

export interface QuestionModel {
  id: number;
  quizzId: number;
  order: number;
  questionType: string | null;
  questionData: string | null;
  answerType: string | null;
  answerData: string | null;
  correctAnswer: string | null;
  points: number;
}

export interface AddQuizzModel {
  name?: string;
  description?: string | null;
}

export interface UpdateQuizzModel {
  id?: number | null;
  name?: string | null;
  description?: string | null;
}

export interface QuizzModel {
  id: number | null;
  name: string | null;
  description: string | null;
}

export interface AddUserModel {
  nickname: string;
}

export interface UpdateUserModel {
  id?: number;
  nickname: string;
  password: string;
  userType: string;
}

export interface UserModel {
  id: number;
  nickname: string;
  userType: string;
}

export interface UsersGameModel {
  id?: number;
  gameId?: number;
  userId?: number;
  score?: number;
  game?: GameModel;
  user?: UserModel;
}

export interface UserModel {
  id: number;
  nickname: string;
  userType: string;
}

export interface GameStateModel {
  gameId: number;
  quizzState: string;
  question: QuestionModel | null;
}

export interface AuthApi {
  login: (data: NicknamePasswordModel) => Promise<ResponseModel<string> & { roles?: string[] }>;
  registerUser: (data: NicknameModel) => Promise<ResponseModel<string> & { roles?: string[] }>;
}

export interface GameApi {
  addGame: (data: { quizzId: number; leaderUserId: number; shuffleQuestion: boolean }) => Promise<ResponseModel<GameModel>>;
  updateGame: (data: any) => Promise<ResponseModel<void>>;
  deleteGame: (id: number) => Promise<ResponseModel<void>>;
  startGame: (id: number) => Promise<ResponseModel<void>>;
  getAllGames: () => Promise<ResponseModel<GameModel[]>>;
  registryUserToGame: (data: { gameId: number }) => Promise<ResponseModel<void>>;
  isRegistryUserToGame: (data: { gameId: number }) => Promise<ResponseModel<boolean>>;
  sendAnswer: (data: { gameId: number; questionId: number; answer: string }) => Promise<ResponseModel<void>>;
  isSendAnswer: (data: { gameId: number; questionId: number; answer: string }) => Promise<ResponseModel<boolean>>;
  getGameByLink: (linkKey: string) => Promise<ResponseModel<GameStateModel>>;
  getGameStatistics: (linkKey: string) => Promise<ResponseModel<UsersGameModel[]>>;
}

export interface QuestionApi {
  addQuestion: (data: AddQuestionModel) => Promise<ResponseModel<QuestionModel>>;
  updateQuestion: (data: UpdateQuestionModel) => Promise<ResponseModel<void>>;
  deleteQuestion: (id: number) => Promise<ResponseModel<void>>;
  getQuestionsByQuizz: (quizzId: number) => Promise<ResponseModel<QuestionModel[]>>;
}

export interface QuizzApi {
  addQuizz: (data: AddQuizzModel) => Promise<ResponseModel<QuizzModel>>;
  updateQuizz: (data: UpdateQuizzModel) => Promise<ResponseModel<void>>;
  deleteQuizz: (id: number) => Promise<ResponseModel<void>>;
  getAllQuizz: () => Promise<ResponseModel<QuizzModel[]>>;
}

export interface UserApi {
  addUser: (data: AddUserModel) => Promise<ResponseModel<UserModel>>;
  updateUser: (data: UpdateUserModel) => Promise<ResponseModel<void>>;
  deleteUser: (id: number) => Promise<ResponseModel<void>>;
  getAllUsers: () => Promise<ResponseModel<UserModel[]>>;
  getRoles: () => Promise<string[]>;
}

export const authApi: AuthApi = {
  login: async (data) => {
    const response = await api.post<ResponseModel<string>>('/auth/login', data);
    if (response.data.success && response.data.data) {
      setAuthToken(response.data.data);
      const rolesResponse = await api.get<string[]>('/users/roles');
      return { ...response.data, roles: rolesResponse.data };
    }
    return response.data;
  },
  registerUser: async (data) => {
    const response = await api.post<ResponseModel<string>>('/auth/user', data);
    if (response.data.success && response.data.data) {
      setAuthToken(response.data.data);
      const rolesResponse = await api.get<string[]>('/users/roles');
      return { ...response.data, roles: rolesResponse.data };
    }
    return response.data;
  },
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Bearer'] = `${token}`;
  } else {
    delete api.defaults.headers.common['Bearer'];
  }
};

export const gameApi: GameApi = {
  addGame: async (data) => {
    const response = await api.put<ResponseModel<GameModel>>('/game/add', data);
    return response.data;
  },
  updateGame: async (data) => {
    const response = await api.post<ResponseModel<void>>('/game/update', data);
    return response.data;
  },
  deleteGame: async (id: number) => {
    const response = await api.delete<ResponseModel<void>>('/game/delete', { data: { id } });
    return response.data;
  },
  getAllGames: async () => {
    const response = await api.get<ResponseModel<GameModel[]>>('/game/all');
    return response.data;
  },
  registryUserToGame: async (data) => {
    const response = await api.post<ResponseModel<void>>('/game/registry', data);
    return response.data;
  },
  isRegistryUserToGame: async (data) => {
    const response = await api.post<ResponseModel<boolean>>('/game/is-registry', data);
    return response.data;
  },
  sendAnswer: async (data) => {
    const response = await api.post<ResponseModel<void>>('/game/send-answer', data);
    return response.data;
  },
  isSendAnswer: async (data) => {
    const response = await api.post<ResponseModel<boolean>>('/game/is-send-answer', data);
    return response.data;
  },
  getGameByLink: async (linkKey) => {
    const response = await api.get<ResponseModel<GameStateModel>>(`/game/link/${linkKey}`);
    return response.data;
  },
  getGameStatistics: async (linkKey) => {
    const response = await api.get<ResponseModel<UsersGameModel[]>>(`/game/statistics/${linkKey}`);
    return response.data;
  },
  startGame: async (id) => {
    const response = await api.put<ResponseModel<void>>('/game/start', { id });
    return response.data;
  },
};

export const questionApi: QuestionApi = {
  addQuestion: async (data) => {
    const response = await api.put<ResponseModel<QuestionModel>>('/question/add', data);
    return response.data;
  },
  updateQuestion: async (data) => {
    const response = await api.post<ResponseModel<void>>('/question/update', data);
    return response.data;
  },
  deleteQuestion: async (id) => {
    const response = await api.delete<ResponseModel<void>>('/question/delete', { data: { id } });
    return response.data;
  },
  getQuestionsByQuizz: async (quizzId) => {
    const response = await api.get<ResponseModel<QuestionModel[]>>(`/question/quizz/${quizzId}`);
    return response.data;
  },
};

export const quizzApi: QuizzApi = {
  addQuizz: async (data) => {
    const response = await api.put<ResponseModel<QuizzModel>>('/quizz/add', data);
    return response.data;
  },
  updateQuizz: async (data) => {
    const response = await api.post<ResponseModel<void>>('/quizz/update', data);
    return response.data;
  },
  deleteQuizz: async (id) => {
    const response = await api.delete<ResponseModel<void>>('/quizz/delete', { data: { id } });
    return response.data;
  },
  getAllQuizz: async () => {
    const response = await api.get<ResponseModel<QuizzModel[]>>('/quizz/all');
    return response.data;
  },
};

export const userApi: UserApi = {
  addUser: async (data) => {
    const response = await api.put<ResponseModel<UserModel>>('/users/add', data);
    return response.data;
  },
  updateUser: async (data) => {
    const response = await api.post<ResponseModel<void>>('/users/update', data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete<ResponseModel<void>>('/users/delete', { data: { id } });
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get<ResponseModel<UserModel[]>>('/users/all');
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get<string[]>('/users/roles');
    return response.data;
  },
};

export default api;
