
"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
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
import type { User, Item, ClaimRequest, NewItem, Role } from "@/lib/types";
import { mockRequests, mockUserProfiles } from "@/lib/mockData";
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

let userProfiles: {[key: string]: {name: string, email: string, contactNumber: string}} = mockUserProfiles;


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchItemsAndRequests = async () => {
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

        } catch (error) {
            console.error("Error fetching data: ", error);
            toast({
                title: "Error",
                description: "Could not fetch data from the database.",
                variant: "destructive"
            });
        }
    };

    fetchItemsAndRequests();
  }, [toast]);

  const handleUserSignIn = (fbUser: FirebaseUser) => {
    if (!fbUser.email) return;

    const studentId = getUserId(fbUser.email);
    const profile = userProfiles[studentId] || { 
      name: fbUser.displayName || 'RUET User', 
      email: fbUser.email, 
      contactNumber: fbUser.phoneNumber || ''
    };

    const appUser: User = {
        id: studentId,
        name: profile.name,
        email: profile.email,
        contactNumber: profile.contactNumber,
        role: ADMIN_EMAILS.includes(fbUser.email) ? 'teacher' : 'student',
    };

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
        role: ADMIN_EMAILS.includes(profile.email) ? 'teacher' : 'student',
      };
    }
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
      
      const studentId = getUserId(email);
      userProfiles[studentId] = { name, email, contactNumber };

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

    try {
        const newItemData = {
            title: itemData.title,
            description: itemData.description,
            category: itemData.category,
            imageUrl: itemData.imageUrl,
            userId: user.id,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, "items"), newItemData);

        // To keep the UI in sync without re-fetching, we can create a client-side representation.
        const newItem: Item = {
            id: docRef.id,
            ...newItemData,
            createdAt: newItemData.createdAt.toDate(), // Convert timestamp to Date for client-side use
        };

        setItems(prevItems => [newItem, ...prevItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

    } catch (error) {
        console.error("Error adding document: ", error);
        throw new Error("Failed to save item to database.");
    }
  };
  
  const deleteItem = async (itemId: string, itemUserId: string) => {
    const canDelete = isAdmin || user?.id === itemUserId;
    if (!canDelete) {
        toast({ title: "Permission Denied", description: "You are not authorized to delete this item.", variant: "destructive"});
        return;
    }
    
    try {
      await deleteDoc(doc(db, "items", itemId));
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: "The item has been successfully removed."});
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
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
  
  const createRequest = async (item: Item) => {
    if (!user) return;

    const newRequestData = {
        itemId: item.id,
        itemTitle: item.title,
        requesterId: user.id,
        ownerId: item.userId,
        status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
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
       console.error("Error creating request:", error);
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
        // This is a mock update. In a real app, you'd update a database.
        const updatedUser = { ...user, contactNumber: newNumber };
        setUser(updatedUser);
        if (userProfiles[user.id]) {
            userProfiles[user.id].contactNumber = newNumber;
        }
        toast({ title: "Success", description: "Contact number updated." });
    }
  };

  const pendingRequestCount = user
    ? requests.filter(
        (req) => req.ownerId === user.id && req.status === 'Pending'
      ).length
    : 0;

  const value = { user, isAdmin, firebaseUser, login, logout, signup, sendPasswordReset, items, addItem, deleteItem, deleteAccount, requests, createRequest, updateRequestStatus, pendingRequestCount, updateContactNumber, getUserById };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
