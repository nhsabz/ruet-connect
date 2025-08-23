
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, Item, ClaimRequest, NewItem } from "@/lib/types";
import { mockUsers, mockItems, mockRequests } from "@/lib/mockData";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AppContextType {
  user: User | null;
  login: (id: string, password?: string) => boolean;
  logout: () => void;
  signup: (id: string) => boolean;
  items: Item[];
  addItem: (item: NewItem) => Promise<void>;
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

  const login = (id: string, password?: string): boolean => {
    const existingUser = mockUsers.find((u) => u.id === id);
    if (existingUser) {
      const passwordIsValid = !!password && password.length >= 8;

      if (passwordIsValid) {
        setUser(existingUser);
        localStorage.setItem("ruet-connect-user", id);
        return true;
      }
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

  const addItem = async (itemData: NewItem) => {
    if(!user) return;

    let imageUrl = 'https://placehold.co/600x400.png';
    if (itemData.image) {
        const storageRef = ref(storage, `images/${user.id}/${Date.now()}_${itemData.image.name}`);
        const snapshot = await uploadBytes(storageRef, itemData.image);
        imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    const newItem: Item = {
        id: (items.length + 1).toString(),
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        imageUrl,
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
