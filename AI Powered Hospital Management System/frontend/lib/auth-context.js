'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, patientAPI, doctorAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userData) => {
    try {
      if (userData.role === 'patient') {
        const res = await patientAPI.getMyProfile();
        setProfile(res.data);
      } else if (userData.role === 'doctor') {
        const res = await doctorAPI.getMyProfile();
        setProfile(res.data);
      }
    } catch (e) { /* profile might not exist yet */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('hms_token');
    const savedUser = localStorage.getItem('hms_user');
    if (token && savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      loadProfile(u);
    }
    setLoading(false);
  }, [loadProfile]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('hms_token', res.data.accessToken);
    localStorage.setItem('hms_refresh', res.data.refreshToken);
    localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    await loadProfile(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (e) {}
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_refresh');
    localStorage.removeItem('hms_user');
    setUser(null);
    setProfile(null);
  };

  const getRolePath = (role) => {
    const paths = {
      super_admin: '/dashboard/super-admin',
      hospital_admin: '/dashboard/admin',
      doctor: '/dashboard/doctor',
      nurse: '/dashboard/nurse',
      receptionist: '/dashboard/receptionist',
      lab_technician: '/dashboard/lab',
      pharmacist: '/dashboard/pharmacist',
      billing_executive: '/dashboard/billing',
      patient: '/dashboard/patient'
    };
    return paths[role] || '/dashboard/patient';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, getRolePath, setUser, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
