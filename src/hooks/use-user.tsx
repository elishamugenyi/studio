'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'CEO' | 'Team Lead' | 'Developer' | 'Finance';

export type User = {
  name: string;
  role: UserRole;
  email: string;
  avatarUrl: string;
};

const users: Record<UserRole, User> = {
  'CEO': { name: 'Alex Thompson', role: 'CEO', email: 'alex.t@tekview.com', avatarUrl: 'https://picsum.photos/seed/ceo/100/100' },
  'Team Lead': { name: 'Samantha Ray', role: 'Team Lead', email: 'sam.r@tekview.com', avatarUrl: 'https://picsum.photos/seed/lead/100/100' },
  'Developer': { name: 'Mike Chen', role: 'Developer', email: 'mike.c@tekview.com', avatarUrl: 'https://picsum.photos/seed/dev/100/100' },
  'Finance': { name: 'Jessica Wang', role: 'Finance', email: 'jess.w@tekview.com', avatarUrl: 'https://picsum.photos/seed/finance/100/100' },
};

interface UserContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as UserRole | null;
      if (storedRole && users[storedRole]) {
        setUser(users[storedRole]);
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: UserRole) => {
    try {
      localStorage.setItem('userRole', role);
      setUser(users[role]);
      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to access localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('userRole');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error("Failed to access localStorage", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
