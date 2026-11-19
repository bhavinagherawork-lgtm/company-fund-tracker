import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authenticateUser, getUserById, ensureMandatoryUser } from '../services/userService';

const STORAGE_KEY = 'expenseflow_auth_user';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await ensureMandatoryUser();
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as User;
          if (parsed && parsed.id) {
            // Verify from database that user still exists and is Active
            const fresh = await getUserById(parsed.id);
            if (fresh && fresh.status === 'Active') {
              setCurrentUser(fresh);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            } else {
              localStorage.removeItem(STORAGE_KEY);
              setCurrentUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
        localStorage.removeItem(STORAGE_KEY);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authenticateUser(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      return { success: true };
    }
    return { success: false, error: result.error || 'Authentication failed.' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (currentUser?.id) {
      const fresh = await getUserById(currentUser.id);
      if (fresh) {
        setCurrentUser(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    }
  }, [currentUser?.id]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
