import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'caregiver' | 'senior' | 'admin';
}

export interface SeniorProfile {
  _id: string;
  fullName: string;
  preferredName?: string;
  age: number;
  gender?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  relationship?: string;
  languagePreference: string;
  linkedUserId?: string;
  mobilityStatus?: string;
  visionStatus?: string;
  hearingStatus?: string;
  bloodGroup?: string;
  knownAllergies?: string[];
  specialCareNotes?: string;
  address?: string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  seniors: SeniorProfile[];
  activeSenior: SeniorProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  setActiveSenior: (senior: SeniorProfile) => void;
  refreshSeniors: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [seniors, setSeniors] = useState<SeniorProfile[]>([]);
  const [activeSenior, setActiveSenior] = useState<SeniorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSetActiveSenior = (senior: SeniorProfile) => {
    setActiveSenior(senior);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ll_active_senior_id', senior._id);
    }
  };

  const refreshSeniors = async () => {
    try {
      const res = await api.get('/patients');
      if (res.success && res.data.patients) {
        const list: SeniorProfile[] = res.data.patients;
        setSeniors(list);
        if (list.length > 0) {
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('ll_active_senior_id') : null;
          const matched = list.find((p) => p._id === savedId);
          const selected = matched || list[0];
          setActiveSenior(selected);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ll_active_senior_id', selected._id);
          }
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load seniors:', err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('ll_token');
    const savedUser = localStorage.getItem('ll_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
      refreshSeniors().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { emailOrPhone: email, password: pass });
    if (res.success) {
      const { user: loggedInUser, tokens } = res.data;
      setUser(loggedInUser);
      setToken(tokens.accessToken);
      localStorage.setItem('ll_token', tokens.accessToken);
      localStorage.setItem('ll_user', JSON.stringify(loggedInUser));
      await refreshSeniors();
    }
  };

  const demoLogin = async () => {
    // Seed and login as demo caregiver
    try {
      await api.post('/demo/seed');
    } catch (err) {
      console.warn('[Demo] Seed call skipped/warn:', err);
    }
    await login('caregiver@lifelink.com', 'Password123!');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSeniors([]);
    setActiveSenior(null);
    localStorage.removeItem('ll_token');
    localStorage.removeItem('ll_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        seniors,
        activeSenior,
        loading,
        login,
        demoLogin,
        logout,
        setActiveSenior: handleSetActiveSenior,
        refreshSeniors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
