'use client';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export type UserRole = 'CEO' | 'Team Lead' | 'Developer' | 'Finance' | 'Planner';

export interface User {
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
  avatarUrl: string;
};

interface UserContextType {
  user: User | null;
  login: (role: UserRole) => void; // This will be deprecated/removed
  loginWithUserObject: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reg_users/me');
      if (res.ok) {
        const { user: userData } = await res.json();
        const fullUser = {
          ...userData,
          name: `${userData.firstName} ${userData.lastName}`,
          avatarUrl: `https://picsum.photos/seed/${userData.email}/100/100`,
        };
        setUser(fullUser);
      } else {
        setUser(null);
        // Don't redirect here, let pages handle it
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loginWithUserObject = (userPayload: User) => {
    // This function is called after a successful login/signup.
    // It sets the user state immediately for a better UX,
    // then redirects to the dashboard.
    setUser(userPayload);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await fetch('/api/reg_users/logout', { method: 'POST' });
    } catch (error) {
        console.error("Failed to log out:", error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  // This login function is now deprecated in favor of API-based login
  const login = (role: UserRole) => {
    console.warn("Legacy login function called. This should be replaced by API calls.");
  };

  return (
    <UserContext.Provider value={{ user, login, loginWithUserObject, logout, isLoading, fetchUser }}>
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
      <AvatarFallback className="bg-primary/20 text-primary font-bold">{initials}</AvatarFallback>
    </Avatar>
  )
}
