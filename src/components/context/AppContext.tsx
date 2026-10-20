import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface User {
  id: string;
  email: string;
  password?: string;
  balance: number;
}

export interface Withdrawal {
  id: string;
  username: string;
  email: string;
  amount: number;
  method: string;
  walletAddress: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
}

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('lootearn_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [page, setPage] = useState('home');
  const [postbacks, setPostbacks] = useState([]);

  useEffect(() => {
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_users' },
        (payload) => {
          setUser((prevUser: any) => {
            if (prevUser && prevUser.email === payload.new.email) {
              const updatedUser = { ...prevUser, balance: payload.new.balance };
              localStorage.setItem('lootearn_user', JSON.stringify(updatedUser));
              return updatedUser;
            }
            return prevUser;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const navigate = (path: string) => {
    setPage(path);
  };

  const logout = () => {
    localStorage.removeItem('lootearn_user');
    setUser(null);
    navigate('home');
  };

  return (
    <AppContext.Provider value={{ user, setUser, page, setPage, navigate, postbacks, setPostbacks, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};