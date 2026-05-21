'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthUser, FirestoreUser, UserRole } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user details from Firestore
  const fetchUserDetails = async (firebaseUser: FirebaseUser): Promise<FirestoreUser | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`[Auth] User document not found for UID: ${firebaseUser.uid}`);
        return null;
      }

      return userDoc.data() as FirestoreUser;
    } catch (err) {
      console.error('[Auth] Error fetching user details:', err);
      return null;
    }
  };

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setError(null);

        if (firebaseUser) {
          // User is signed in
          const userDetails = await fetchUserDetails(firebaseUser);

          if (userDetails) {
            setUser({
              ...userDetails,
              isLoading: false,
              error: null,
            });

            // Update last login timestamp
            await setDoc(
              doc(db, 'users', firebaseUser.uid),
              { lastLogin: serverTimestamp() },
              { merge: true }
            ).catch(err => console.warn('[Auth] Could not update lastLogin:', err));
          } else {
            setUser(null);
            setError('User profile not found. Please contact administrator.');
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const userDetails = await fetchUserDetails(credential.user);

      if (!userDetails) {
        await firebaseSignOut(auth);
        throw new Error('User profile not found. Please contact administrator.');
      }

      setUser({
        ...userDetails,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      setError(null);
      setLoading(true);

      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Create Firestore user document
      const now = new Date().toISOString();
      const userDocument: FirestoreUser = {
        uid: credential.user.uid,
        email,
        displayName,
        role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', credential.user.uid), userDocument);

      setUser({
        ...userDocument,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        return;
      }

      const userDetails = await fetchUserDetails(auth.currentUser);
      if (userDetails) {
        setUser({
          ...userDetails,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('[Auth] Error refreshing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
    }
  };

  const hasRole = (roleOrRoles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
