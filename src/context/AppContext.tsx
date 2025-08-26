
"use client";

import { createContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    deleteDoc,
    Timestamp,
    orderBy,
    updateDoc
} from "firebase/firestore";
import type { User, Item, ClaimRequest, NewItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { storage, auth, db } from "@/lib/firebase";
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

// --- Demo Account ---
const DEMO_USER_EMAIL = "2103141@student.ruet.ac.bd";
const DEMO_PASSWORD = "12345678";

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  firebaseUser: FirebaseUser | null;
  login: (emailOrId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, contactNumber: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  items: Item[];
  addItem: (item: NewItem) => Promise<void>;
  deleteItem: (itemId: string, itemUserId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  requests: ClaimRequest[];
  createRequest: (item: Item) => void;
  updateRequestStatus: (requestId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  pendingRequestCount: number;
  updateContactNumber: (newNumber: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    try {
        // Fetch Items
        const itemsCollection = collection(db, "items");
        const itemsQuery = query(itemsCollection, orderBy("createdAt", "desc"));
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemsData = itemsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Item;
        });
        setItems(itemsData);

        // Fetch Requests
        const requestsCollection = collection(db, "requests");
        const requestsQuery = query(requestsCollection, orderBy("createdAt", "desc"));
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => {
             const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as ClaimRequest;
        });
        setRequests(requestsData);

        // Fetch all Users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => doc.data() as User);
        setAllUsers(usersData);

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({
            title: "Error Loading Data",
            description: "Could not fetch data from the database. Please check your connection and Firestore rules.",
            variant: "destructive"
        });
    }
  }, [toast]);

  const handleUserSignIn = useCallback(async (fbUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const appUser = userDoc.data() as User;
        setUser(appUser);
        setIsAdmin(ADMIN_EMAILS.includes(appUser.email));
        toast({ title: "Login Successful", description: `Welcome back, ${appUser.name}!` });
        router.push("/");
    } else {
        // This case can happen if a user was created in Auth but their doc creation failed.
        // Or for the demo account's first sign-in.
        console.warn("User document not found for UID:", fbUser.uid);
        // We can create it now.
        const studentId = fbUser.email?.split('@')[0] || fbUser.uid;
        const newUser: User = {
            id: fbUser.uid,
            studentId: studentId,
            name: fbUser.displayName || 'RUET User',
            email: fbUser.email!,
            contactNumber: fbUser.phoneNumber || '',
            role: ADMIN_EMAILS.includes(fbUser.email!) ? 'teacher' : 'student'
        };
        await setDoc(userDocRef, newUser);
        setUser(newUser);
        setIsAdmin(ADMIN_EMAILS.includes(newUser.email));
        router.push("/");
    }
    await fetchAllData();
  }, [router, toast, fetchAllData]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        handleUserSignIn(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        // Clear data on logout
        setItems([]);
        setRequests([]);
        setAllUsers([]);
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, [handleUserSignIn]);
  
  const getUserById = (userId: string): User | undefined => {
     return allUsers.find(u => u.id === userId);
  };

  const login = async (emailOrId: string, password?: string): Promise<boolean> => {
    let email = emailOrId;
    if (!email.includes('@')) {
        email = `${emailOrId}@student.ruet.ac.bd`;
    }
    
    if (!password) {
      toast({ title: "Login Failed", description: "Password is required.", variant: "destructive" });
      return false;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
       if (!userCredential.user.emailVerified && email !== DEMO_USER_EMAIL) {
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
        if ((error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && email === DEMO_USER_EMAIL) {
            // First time login for demo user
            try {
                const cred = await createUserWithEmailAndPassword(auth, DEMO_USER_EMAIL, DEMO_PASSWORD);
                await handleUserSignIn(cred.user);
                return true;
            } catch (signupError: any) {
                toast({ title: "Demo Account Creation Failed", description: signupError.message, variant: "destructive" });
                return false;
            }
        }
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
      const { user: fbUser } = userCredential;

      const newUser: User = {
        id: fbUser.uid,
        studentId: email.split('@')[0],
        name,
        email,
        contactNumber,
        role: ADMIN_EMAILS.includes(email) ? 'teacher' : 'student'
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      await sendEmailVerification(fbUser);
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
        toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
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
      toast({
        title: "Error Sending Reset Email",
        description: "There was a problem sending the password reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addItem = async (itemData: NewItem) => {
    if (!user?.id) {
        throw new Error("User not authenticated");
    }

    try {
        const newItemData = {
            ...itemData,
            userId: user.id, // The Firebase Auth UID
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, "items"), newItemData);
        const newItem: Item = {
            id: docRef.id,
            ...newItemData,
            createdAt: newItemData.createdAt.toDate(),
        };
        setItems(prevItems => [newItem, ...prevItems]);
    } catch (error) {
        console.error("Error adding document: ", error);
        throw new Error("Failed to save item to database.");
    }
  };
  
  const deleteItem = async (itemId: string, itemUserId: string) => {
    if (!user || (!isAdmin && user.id !== itemUserId)) {
        toast({ title: "Permission Denied", description: "You are not authorized to delete this item.", variant: "destructive"});
        return;
    }
    
    try {
      await deleteDoc(doc(db, "items", itemId));
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: "The item has been successfully removed."});
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
  }

  const deleteAccount = async () => {
    const currentFirebaseUser = auth.currentUser;
    if (!currentFirebaseUser) {
        return;
    }

    try {
      // First delete the user document from Firestore
      await deleteDoc(doc(db, "users", currentFirebaseUser.uid));
      // Then delete the user from Auth
      await deleteUser(currentFirebaseUser);
      
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      router.push("/signup");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Account Deletion Failed",
        description: "An error occurred. You may need to log in again to complete this action.",
        variant: "destructive",
      });
       if (error.code === 'auth/requires-recent-login') {
         logout();
       }
    }
  };
  
  const createRequest = async (item: Item) => {
    if (!user) return;

    const newRequestData = {
        itemId: item.id,
        itemTitle: item.title,
        requesterId: user.id,
        ownerId: item.userId,
        status: 'Pending' as const,
        createdAt: Timestamp.now(),
    };
    
    try {
      const docRef = await addDoc(collection(db, "requests"), newRequestData);
      const newRequest: ClaimRequest = {
        id: docRef.id,
        ...newRequestData,
        createdAt: newRequestData.createdAt.toDate(),
      }
      setRequests(prev => [newRequest, ...prev]);
      toast({
        title: "Request Sent!",
        description: `Your request for "${item.title}" has been sent to the owner.`,
      });
    } catch (error) {
       toast({ title: "Error", description: "Failed to create request.", variant: "destructive" });
    }
  }

  const updateRequestStatus = async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
        const requestDocRef = doc(db, "requests", requestId);
        await updateDoc(requestDocRef, { status });
        
        setRequests(prevRequests => 
            prevRequests.map(req => 
                req.id === requestId ? { ...req, status } : req
            )
        );

        toast({
            title: "Request Updated",
            description: `The request has been ${status.toLowerCase()}.`
        });
    } catch (error) {
        console.error("Error updating request status: ", error);
        toast({
            title: "Update Failed",
            description: "Could not update the request status.",
            variant: "destructive"
        });
    }
  };

  const updateContactNumber = async (newNumber: string) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.id);
        try {
            await updateDoc(userDocRef, { contactNumber: newNumber });
            const updatedUser = { ...user, contactNumber: newNumber };
            setUser(updatedUser);
            toast({ title: "Success", description: "Contact number updated." });
        } catch(e) {
            toast({ title: "Error", description: "Could not update contact number.", variant: "destructive"});
        }
    }
  };

  const pendingRequestCount = user
    ? requests.filter(
        (req) => req.ownerId === user.id && req.status === 'Pending'
      ).length
    : 0;

  const value = { user, isAdmin, firebaseUser, login, logout, signup, sendPasswordReset, items, addItem, deleteItem, deleteAccount, requests, createRequest, updateRequestStatus, pendingRequestCount, updateContactNumber, getUserById };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

    