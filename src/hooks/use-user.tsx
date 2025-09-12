'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


export type UserRole = 'CEO' | 'Team Lead' | 'Developer' | 'Finance' | 'Planner';

export type User = {
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
  avatarUrl: string;
};

// Demo users object
const users: Record<UserRole, Omit<User, 'name'>> = {
  'CEO': { firstName: 'Alex', lastName: 'Thompson', role: 'CEO', email: 'alex.t@tekview.com', avatarUrl: 'https://picsum.photos/seed/ceo/100/100' },
  'Team Lead': { firstName: 'Samantha', lastName: 'Ray', role: 'Team Lead', email: 'sam.r@tekview.com', avatarUrl: 'https://picsum.photos/seed/lead/100/100' },
  'Developer': { firstName: 'Mike', lastName: 'Chen', role: 'Developer', email: 'mike.c@tekview.com', avatarUrl: 'https://picsum.photos/seed/dev/100/100' },
  'Finance': { firstName: 'Jessica', lastName: 'Wang', role: 'Finance', email: 'jess.w@tekview.com', avatarUrl: 'https://picsum.photos/seed/finance/100/100' },
  'Planner': { firstName: 'Tom', lastName: 'Planner', role: 'Planner', email: 'tom.p@tekview.com', avatarUrl: 'https://picsum.photos/seed/planner/100/100' },
};

interface UserContextType {
  user: User | null;
  login: (role: UserRole) => void;
  loginWithUserObject: (user: User) => void;
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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: UserRole) => {
    try {
      const userData = users[role];
      if(userData) {
        const fullUser: User = {
            ...userData,
            name: `${userData.firstName} ${userData.lastName}`,
        };
        localStorage.setItem('user', JSON.stringify(fullUser));
        setUser(fullUser);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
    }
  };

  const loginWithUserObject = (userPayload: User) => {
    try {
        localStorage.setItem('user', JSON.stringify(userPayload));
        setUser(userPayload);
        router.push('/dashboard');
    } catch (error) {
        console.error("Failed to access localStorage", error);
    }
  };


  const logout = () => {
    try {
      localStorage.removeItem('user');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error("Failed to access localStorage", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, loginWithUserObject, logout, isLoading }}>
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

export function UserAvatar() {
  const { user } = useUser();

  if (!user) {
    return <Users className="h-5 w-5" />;
  }
  
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Avatar className="h-9 w-9">
        <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
