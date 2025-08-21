"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, Item, ClaimRequest } from "@/lib/types";
import { mockUsers, mockItems, mockRequests } from "@/lib/mockData";
import { useRouter } from "next/navigation";

interface AppContextType {
  user: User | null;
  login: (id: string) => boolean;
  logout: () => void;
  signup: (id: string) => boolean;
  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'userId'>) => void;
  requests: ClaimRequest[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [requests, setRequests] = useState<ClaimRequest[]>(mockRequests);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("ruet-connect-user");
    if (storedUserId) {
      const existingUser = mockUsers.find((u) => u.id === storedUserId);
      if (existingUser) {
        setUser(existingUser);
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (id: string): boolean => {
    // Demo account check
    if (id === '2103141') {
      const userToLogin: User = { id };
      setUser(userToLogin);
      localStorage.setItem("ruet-connect-user", id);
      return true;
    }
    const existingUser = mockUsers.find((u) => u.id === id);
    if (existingUser) {
      setUser(existingUser);
      localStorage.setItem("ruet-connect-user", id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ruet-connect-user");
    router.push("/login");
  };

  const signup = (id: string): boolean => {
    const existingUser = mockUsers.find((u) => u.id === id);
    if (existingUser) {
      return false; // User already exists
    }
    const newUser: User = { id };
    mockUsers.push(newUser); // In a real app, this would be an API call
    setUser(newUser);
    localStorage.setItem("ruet-connect-user", id);
    return true;
  };

  const addItem = (itemData: Omit<Item, 'id' | 'createdAt' | 'userId'>) => {
    if(!user) return;
    const newItem: Item = {
        ...itemData,
        id: (items.length + 1).toString(),
        createdAt: new Date(),
        userId: user.id,
    };
    setItems(prevItems => [newItem, ...prevItems]);
  };

  const value = { user, login, logout, signup, items, addItem, requests };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
