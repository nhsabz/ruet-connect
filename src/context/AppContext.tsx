
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, Item, ClaimRequest, NewItem } from "@/lib/types";
import { mockItems, mockRequests } from "@/lib/mockData";
import { useRouter } from "next/navigation";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  items: Item[];
  addItem: (item: NewItem) => Promise<void>;
  requests: ClaimRequest[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [requests, setRequests] = useState<ClaimRequest[]>(mockRequests);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        const studentId = currentUser.email?.split('@')[0] || '';
        setUser({ id: studentId, email: currentUser.email });
      } else {
        setUser(null);
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      toast({ title: "Login Failed", description: "Password is required.", variant: "destructive" });
      return false;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
       if (!userCredential.user.emailVerified) {
        toast({
          title: "Login Failed",
          description: "Please verify your email before logging in. A new verification link has been sent.",
          variant: "destructive",
        });
        await sendEmailVerification(userCredential.user);
        await firebaseSignOut(auth);
        return false;
      }
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/");
      return true;
    } catch (error: any) {
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      return false;
    }
  };

  const logout = () => {
    firebaseSignOut(auth).then(() => {
        setUser(null);
        setFirebaseUser(null);
        router.push("/login");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    })
  };

  const signup = async (email: string, password: string):Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      
      await firebaseSignOut(auth);
      
      toast({
        title: "Signup Successful!",
        description: "A verification link has been sent to your email. Please verify before logging in.",
      });
      
      router.push("/login?verified=false");
      return true;
    } catch (error: any) {
      if(error.code === 'auth/email-already-in-use') {
        toast({ title: "Signup Failed", description: "An account with this email already exists. Try logging in.", variant: "destructive" });
      } else {
        console.error("Signup error:", error);
        toast({ title: "Signup Failed", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      }
      return false;
    }
  };
  
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error Sending Reset Email",
        description: "There was a problem sending the password reset email. Please try again.",
        variant: "destructive",
      });
    }
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

  const value = { user, firebaseUser, login, logout, signup, sendPasswordReset, items, addItem, requests };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
