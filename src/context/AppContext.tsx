
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, Item, ClaimRequest, NewItem } from "@/lib/types";
import { mockItems, mockRequests, mockUserProfiles } from "@/lib/mockData";
import { useRouter } from "next/navigation";
import { storage, auth, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"; 
import { useToast } from "@/hooks/use-toast";
import { ADMIN_EMAILS } from "@/lib/config";

// --- Demo Account ---
const DEMO_STUDENT_ID = "2103141";
const DEMO_PASSWORD = "12345678";

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string, contactNumber: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  items: Item[];
  addItem: (item: NewItem) => Promise<void>;
  deleteItem: (itemId: string, itemUserId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  requests: ClaimRequest[];
  createRequest: (item: Item) => void;
  pendingRequestCount: number;
  updateContactNumber: (newNumber: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

let userProfiles: {[key: string]: {name: string, email: string, contactNumber: string, role: "student" | "teacher"}} = mockUserProfiles;


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [requests, setRequests] = useState<ClaimRequest[]>(mockRequests);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleUserSignIn = async (fbUser: FirebaseUser) => {
    if (!fbUser.email) return;

    const userRef = doc(db, "users", fbUser.uid);
    const userDoc = await getDoc(userRef);
    let appUser: User;

    if (userDoc.exists()) {
      appUser = userDoc.data() as User;
    } else {
      // This path is for users created via Google Sign-In
      const email = fbUser.email;
      const role = email.endsWith('student.ruet.ac.bd') ? 'student' : 'teacher';
      const studentId = getUserId(email);
      
      appUser = {
        id: studentId,
        uid: fbUser.uid,
        name: fbUser.displayName || 'RUET User',
        email: email,
        role: role,
        contactNumber: fbUser.phoneNumber || ''
      };
      
      await setDoc(userRef, {
        ...appUser,
        createdAt: serverTimestamp(),
      });
    }

    setUser(appUser);
    setIsAdmin(ADMIN_EMAILS.includes(fbUser.email));
    toast({ title: "Login Successful", description: `Welcome back, ${appUser.name}!` });
    router.push("/");
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        handleUserSignIn(currentUser);
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
    const demoProfile = Object.values(userProfiles).find(p => p.email === email);
    if (demoProfile) {
        const id = Object.keys(userProfiles).find(key => userProfiles[key] === demoProfile);
        if (id) return id;
    }
    return email.split('@')[0];
  }

  const getUserById = (userId: string): User | undefined => {
     const profile = userProfiles[userId];
    if (profile) {
      return {
        id: userId,
        name: profile.name,
        email: profile.email,
        contactNumber: profile.contactNumber,
        role: profile.role,
      };
    }
    if(user && getUserId(user.email) === userId) {
        return user;
    }
    return undefined;
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    try {
        const result = await signInWithPopup(auth, provider);
        const email = result.user.email;

        if (!email || !email.endsWith('.ruet.ac.bd')) {
            await firebaseSignOut(auth);
            toast({
                title: "Sign-In Failed",
                description: "Access is restricted to RUET email domains only.",
                variant: "destructive"
            });
            return;
        }
        
        await handleUserSignIn(result.user);

    } catch (error: any) {
        console.error("Google Sign-In Error: ", error);
        toast({
            title: "Sign-In Error",
            description: "An error occurred during Google Sign-In. Please try again.",
            variant: "destructive"
        })
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      toast({ title: "Login Failed", description: "Password is required.", variant: "destructive" });
      return false;
    }

    if (email === DEMO_STUDENT_ID && password === DEMO_PASSWORD) {
        const demoUserEmail = userProfiles[DEMO_STUDENT_ID]?.email;
        if (!demoUserEmail) {
             toast({ title: "Login Failed", description: "Demo account not configured correctly.", variant: "destructive" });
             return false;
        }
        try {
            await signInWithEmailAndPassword(auth, demoUserEmail, DEMO_PASSWORD);
            return true;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                 try {
                    const userCredential = await createUserWithEmailAndPassword(auth, demoUserEmail, DEMO_PASSWORD);
                    await sendEmailVerification(userCredential.user);
                    toast({ title: "Demo Account Created", description: "Please verify your email before logging in." });
                    await firebaseSignOut(auth);
                    return false;
                 } catch (signupError: any) {
                    toast({ title: "Demo Setup Failed", description: signupError.message, variant: "destructive" });
                    return false;
                 }
            }
            toast({ title: "Login Failed", description: "Invalid credentials for demo account.", variant: "destructive" });
            return false;
        }
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
      return true;
    } catch (error: any) {
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      return false;
    }
  };

  const logout = () => {
    firebaseSignOut(auth).then(() => {
        router.push("/login");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    })
  };

  const signup = async (name: string, email: string, password: string, contactNumber: string):Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, "users", userCredential.user.uid);
      const studentId = getUserId(email);
      const newUser: User = {
        id: studentId,
        uid: userCredential.user.uid,
        name,
        email,
        contactNumber,
        role: email.endsWith('student.ruet.ac.bd') ? 'student' : 'teacher'
      }

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
      });

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
    if (!user?.id) {
        const err = new Error("User not authenticated");
        console.error("addItem failed:", err);
        throw err;
    }

    let imageUrl = 'https://placehold.co/600x400.png';
    if (itemData.image) {
        try {
            const storageRef = ref(storage, `images/${user.id}/${Date.now()}_${itemData.image.name}`);
            const snapshot = await uploadBytes(storageRef, itemData.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Firebase Storage Error:", error);
            throw error;
        }
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
  
  const deleteItem = async (itemId: string, itemUserId: string) => {
    const canDelete = isAdmin || user?.id === itemUserId;
    if (!canDelete) {
        toast({ title: "Permission Denied", description: "You are not authorized to delete this item.", variant: "destructive"});
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
      if(currentFirebaseUser.email) {
          const userId = getUserId(currentFirebaseUser.email);
          delete userProfiles[userId];
          setItems(prev => prev.filter(item => item.userId !== userId));
      }
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
  
  const createRequest = (item: Item) => {
    if (!user) return;

    const newRequest: ClaimRequest = {
        id: `req${requests.length + 1}`,
        itemId: item.id,
        itemTitle: item.title,
        requesterId: user.id,
        ownerId: item.userId,
        status: 'Pending',
        createdAt: new Date(),
    };
    
    setRequests(prev => [newRequest, ...prev]);

    toast({
      title: "Request Sent!",
      description: `Your request for "${item.title}" has been sent to the owner.`,
    });
  }

  const updateContactNumber = async (newNumber: string) => {
    if (user && user.uid) {
        const userRef = doc(db, "users", user.uid);
        try {
          await setDoc(userRef, { contactNumber: newNumber }, { merge: true });
          setUser(prevUser => prevUser ? { ...prevUser, contactNumber: newNumber } : null);
          toast({ title: "Success", description: "Contact number updated." });
        } catch (error) {
          console.error("Update contact error: ", error);
          toast({ title: "Error", description: "Failed to update contact number.", variant: "destructive" });
        }
    }
  };

  const pendingRequestCount = user
    ? requests.filter(
        (req) => req.ownerId === user.id && req.status === 'Pending'
      ).length
    : 0;

  const value = { user, isAdmin, firebaseUser, login, signInWithGoogle, logout, signup, sendPasswordReset, items, addItem, deleteItem, deleteAccount, requests, createRequest, pendingRequestCount, updateContactNumber, getUserById };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
