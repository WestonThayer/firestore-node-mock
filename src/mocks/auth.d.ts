import { Mock } from 'node:test';

export const mockCreateUserWithEmailAndPassword: Mock<any>;
export const mockDeleteUser: Mock<any>;
export const mockSendVerificationEmail: Mock<any>;
export const mockSignInWithEmailAndPassword: Mock<any>;
export const mockSendPasswordResetEmail: Mock<any>;
export const mockVerifyIdToken: Mock<any>;
export const mockGetUser: Mock<any>;
export const mockCreateCustomToken: Mock<any>;
export const mockSetCustomUserClaims: Mock<any>;
export const mockSignOut: Mock<any>;

// FIXME: We should decide whether this should be exported from auth or firestore
export const mockUseEmulator: Mock<any>;

export interface FirebaseUser {}

export class FakeAuth {
  currentUser: Readonly<FirebaseUser>;

  constructor(currentUser?: FirebaseUser);

  createUserWithEmailAndPassword(): Promise<{ user: FirebaseUser }>;
  signInWithEmailAndPassword(): Promise<{ user: FirebaseUser }>;
  deleteUser(): Promise<'👍'>;
  signOut(): Promise<'👍'>;
  sendPasswordResetEmail(): void;
  verifyIdToken(): Promise<FirebaseUser>;
  getUser(): Promise<Record<string, never>>;
  createCustomToken(): Promise<string>;
  setCustomUserClaims(): Promise<Record<string, never>>;
  useEmulator(): void;
}
