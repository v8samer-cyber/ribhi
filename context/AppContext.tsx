import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
   const [user, setUser] = useState({ email: 'guest@example.com', balance: 0 });
  const [postbacks, setPostbacks] = useState([]);
  
  // هذا السطر الجديد والمهم جداً لتغيير الصفحات
  const [page, setPage] = useState('home');

  // وهذا تعديل الدالة عشان تشتغل صح
  const navigate = (path: string) => {
    setPage(path);
  };

  return (
       <AppContext.Provider value={{ user, setUser, postbacks, setPostbacks, page, navigate }}>
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
