'use server';

import { redirect } from 'next/navigation';
import { login, logout } from '../api/auth';
import { credentialsSchema, type Credentials } from '../auth/credentials';

/** Returns the message to show above the form; a successful login never returns at all. */
export const signIn = async (credentials: Credentials): Promise<string | null> => {
  const failure = await login(credentialsSchema.parse(credentials));
  if (failure !== null) return failure.message;
  redirect('/');
};

export const signOut = async (): Promise<void> => {
  await logout();
  redirect('/login');
};
