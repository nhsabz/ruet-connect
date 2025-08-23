
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, Item, ClaimRequest, NewItem } from "@/lib/types";
import { mockItems, mockRequests, mockUserProfiles } from "@/lib/mockData";
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
  deleteUser,
  type User as FirebaseUser
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_EMAILS } from "@/lib/config";

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, contactNumber: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  items: Item[];
  addItem: (item: NewItem) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  requests: ClaimRequest[];
  updateContactNumber: (newNumber: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// In a real app, you'd fetch this from a database
let userProfiles: {[key: string]: {email: string, contactNumber: string}} = mockUserProfiles;


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [requests, setRequests] = useState<ClaimRequest[]>(mockRequests);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser && currentUser.emailVerified && currentUser.email) {
        const studentId = getUserId(currentUser.email);
        const profile = userProfiles[studentId];
        setUser({ 
            id: studentId, 
            email: currentUser.email,
            contactNumber: profile?.contactNumber
        });
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);
  
  const getUserId = (email: string) => {
    if (ADMIN_EMAILS.includes(email)) {
        return email.split('@')[0];
    }
    const match = email.match(/^(\d{7})@student\.ruet\.ac\.bd$/);
    return match ? match[1] : email.split('@')[0];
  }

  const getUserById = (userId: string): User | undefined => {
     const profile = Object.values(userProfiles).find(p => getUserId(p.email) === userId);
    if (profile) {
      return {
        id: userId,
        email: profile.email,
        contactNumber: profile.contactNumber,
      };
    }
    // Fallback for users that might exist in auth but not in mock profiles
    if(user && getUserId(user.email) === userId) {
        return user;
    }
    return undefined;
  };

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
        setIsAdmin(false);
        router.push("/login");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    })
  };

  const signup = async (email: string, password: string, contactNumber: string):Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userId = getUserId(email);
      userProfiles[userId] = { email, contactNumber };

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
  
  const deleteItem = async (itemId: string) => {
    if (!isAdmin) {
        toast({ title: "Permission Denied", description: "You are not authorized to delete items.", variant: "destructive"});
        return;
    }
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({ title: "Item Deleted", description: "The item has been successfully removed."});
  }

  const deleteAccount = async () => {
    const currentFirebaseUser = auth.currentUser;
    if (!currentFirebaseUser) {
      toast({ title: "Error", description: "You must be logged in to delete your account.", variant: "destructive" });
      return;
    }

    try {
      await deleteUser(currentFirebaseUser);
      const userId = getUserId(currentFirebaseUser.email!);
      delete userProfiles[userId];
      setItems(prev => prev.filter(item => item.userId !== userId));
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      router.push("/signup");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Account Deletion Failed",
        description: "An error occurred while deleting your account. You may need to log in again to complete this action.",
        variant: "destructive",
      });
       if (error.code === 'auth/requires-recent-login') {
         logout();
       }
    }
  };

  const updateContactNumber = async (newNumber: string) => {
    if (user) {
        // Update in-memory user profiles
        const userId = getUserId(user.email);
        if (userProfiles[userId]) {
            userProfiles[userId].contactNumber = newNumber;
        } else {
            userProfiles[userId] = { email: user.email, contactNumber: newNumber };
        }
        
        // Update user state
        setUser(prevUser => prevUser ? { ...prevUser, contactNumber: newNumber } : null);
    }
  };

  const value = { user, isAdmin, firebaseUser, login, logout, signup, sendPasswordReset, items, addItem, deleteItem, deleteAccount, requests, updateContactNumber, getUserById };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
