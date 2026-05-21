import { cookies } from 'next/headers';

export async function getServerAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function setServerAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearServerAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
