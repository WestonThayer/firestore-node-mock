import { mock } from 'node:test';

export const mockCreateUserWithEmailAndPassword = mock.fn();
export const mockDeleteUser = mock.fn();
export const mockSendVerificationEmail = mock.fn();
export const mockSignInWithEmailAndPassword = mock.fn();
export const mockSendPasswordResetEmail = mock.fn();
export const mockVerifyIdToken = mock.fn();
export const mockGetUser = mock.fn();
export const mockCreateCustomToken = mock.fn();
export const mockSetCustomUserClaims = mock.fn();
export const mockSignOut = mock.fn();
export const mockUseEmulator = mock.fn();
/
export class FakeAuth {
  constructor(currentUser = {}) {
    currentUser.sendEmailVerification = mockSendVerificationEmail;
    this.currentUserRecord = currentUser;
  }

  createUserWithEmailAndPassword() {
    mockCreateUserWithEmailAndPassword(...arguments);
    return Promise.resolve({ user: this.currentUserRecord });
  }

  deleteUser() {
    mockDeleteUser(...arguments);
    return Promise.resolve('👍');
  }

  signInWithEmailAndPassword() {
    mockSignInWithEmailAndPassword(...arguments);
    return Promise.resolve({ user: this.currentUserRecord });
  }

  signOut() {
    mockSignOut();
    return Promise.resolve('👍');
  }

  sendPasswordResetEmail() {
    mockSendPasswordResetEmail(...arguments);
  }

  verifyIdToken() {
    return Promise.resolve(mockVerifyIdToken(...arguments) || this.currentUserRecord);
  }

  getUser() {
    return Promise.resolve(mockGetUser(...arguments) || {});
  }

  createCustomToken() {
    return Promise.resolve(mockCreateCustomToken(...arguments) || '');
  }

  setCustomUserClaims() {
    return Promise.resolve(mockSetCustomUserClaims(...arguments) || {});
  }

  useEmulator() {
    mockUseEmulator(...arguments);
  }

  get currentUser() {
    const { uid, ...data } = this.currentUserRecord;
    return { uid, data };
  }
}
