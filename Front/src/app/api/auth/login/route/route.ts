import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getServerAuthToken } from '@/lib/server-auth';

const API_BASE_URL = process.env.API_URL || 'http://backend:8080';

function decodeToken(token: string) {
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body;

    const token = await getServerAuthToken();
    console.log(API_BASE_URL);
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const response = await api.post('/auth/login', { nickname, password });

    if (response.data.success && response.data.data) {
      const token = response.data.data;
      const decoded = decodeToken(token);
      
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return NextResponse.json({ 
        success: true, 
        token,
        role: decoded?.role || ''
      });
    }

    return NextResponse.json({ success: false, messages: response.data.messages }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, messages: ['Ошибка при входе'] }, { status: 500 });
  }
}
