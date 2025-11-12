import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to ensure user record exists
  const ensureUserRecord = async (userId: string, email: string) => {
    try {
      // Check if user record exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected if user doesn't exist
        console.error('Error checking user record:', selectError);
        return;
      }

      // If not, create it
      if (!existingUser) {
        const { error } = await supabase
          .from('users')
          .insert({
            id: userId,
            username: email
          });

        if (error) {
          console.error('Error creating user record:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('User record created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring user record:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    // Create user record immediately after signup
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: email
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        // Don't return error - user can still use the app
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    // Ensure user record exists (in case it was deleted)
    if (data.user) {
      await ensureUserRecord(data.user.id, data.user.email || '');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
