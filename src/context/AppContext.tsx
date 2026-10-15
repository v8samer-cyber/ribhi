import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState({ email: 'guest@example.com', balance: 0, username: 'Guest' });
  const [postbacks, setPostbacks] = useState([]);
  
  const navigate = (path: string) => {
    console.log('Navigation placeholder:', path);
  };

  return (
    <AppContext.Provider value={{ user, setUser, postbacks, setPostbacks, navigate }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
