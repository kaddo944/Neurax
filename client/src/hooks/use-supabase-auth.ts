import { useEffect, useState } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UseSupabaseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signInWithTwitter: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    console.log('Attempting to sign up with email:', email, 'and username:', username);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0], // Use provided username or fallback to email prefix
        }
      }
    });

    console.log('SignUp response:', { data, error });

    if (error) {
      console.error('SignUp error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      throw error;
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('SignIn response:', { data, error });

    if (error) {
      console.error('SignIn error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      throw error;
    }

    return data;
  };

  const signInWithTwitter = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signInWithOTP = async (email: string) => {
    console.log('Sending OTP to email:', email);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      // Allow automatic user creation for new users
    });

    console.log('OTP send response:', { data, error });

    if (error) {
      console.error('OTP send error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      throw error;
    }

    return data;
  };

  const verifyOTP = async (email: string, token: string) => {
    console.log('Verifying OTP for email:', email, 'with token:', token);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    console.log('OTP verify response:', { data, error });

    if (error) {
      console.error('OTP verify error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithTwitter,
    signInWithOTP,
    verifyOTP,
    signOut,
    resetPassword,
  };
}