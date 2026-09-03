import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../types';
import { useUI } from './UIContext';

export interface LoginResult {
  ok: boolean;
  code?: string;
  message?: string;
}

export interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  addUser: (data: {
    name: string;
    email: string;
    role: User['role'];
    status: User['status'];
    password?: string;
  }) => Promise<boolean>;
  updateUser: (
    id: string,
    data: Partial<User> & { password?: string }
  ) => Promise<boolean>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  onLoginSuccess,
}: {
  children: React.ReactNode;
  onLoginSuccess?: () => Promise<void>;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { showToast, navigate } = useUI();

  const refreshUsers = useCallback(async () => {
    try {
      const usersData = await api.users.list();
      if (usersData) {
        setUsers(
          usersData.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            createdAt:
              typeof u.createdAt === 'string'
                ? u.createdAt.split('T')[0]
                : new Date(u.createdAt).toISOString().split('T')[0],
            lastActivity: new Date().toISOString().split('T')[0],
          }))
        );
      }
    } catch {
      // Ignore if user does not have permissions or request fails
    }
  }, []);

  // Restore active session on mount
  useEffect(() => {
    api.auth
      .me()
      .then(res => {
        if (res.user) {
          setCurrentUser(res.user);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }
      })
      .catch(() => {
        // No active session
      });
  }, [onLoginSuccess]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const res = await api.auth.login(email, password);
        setCurrentUser(res.user);
        if (onLoginSuccess) {
          await onLoginSuccess();
        }
        navigate('dashboard');
        showToast('success', `Welcome back, ${res.user.name}!`);
        return { ok: true };
      } catch (err: any) {
        if (err instanceof ApiError) {
          return {
            ok: false,
            code: err.code,
            message: err.message,
          };
        }
        return {
          ok: false,
          code: 'NETWORK_ERROR',
          message: err.message || 'Unable to connect to the authentication server.',
        };
      }
    },
    [navigate, onLoginSuccess, showToast]
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setCurrentUser(null);
      navigate('login');
      showToast('info', 'You have been logged out.');
    }
  }, [navigate, showToast]);

  const addUser = useCallback(
    async (data: {
      name: string;
      email: string;
      role: User['role'];
      status: User['status'];
      password?: string;
    }): Promise<boolean> => {
      try {
        await api.users.create(data);
        await refreshUsers();
        showToast('success', `User "${data.name}" added successfully.`);
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Failed to add user.');
        return false;
      }
    },
    [refreshUsers, showToast]
  );

  const updateUser = useCallback(
    async (
      id: string,
      data: Partial<User> & { password?: string }
    ): Promise<boolean> => {
      try {
        await api.users.update(id, data);
        await refreshUsers();
        showToast('success', 'User updated successfully.');
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Failed to update user.');
        return false;
      }
    },
    [refreshUsers, showToast]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        await api.users.delete(id);
        await refreshUsers();
        showToast('success', 'User removed from system.');
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete user.');
      }
    },
    [refreshUsers, showToast]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
