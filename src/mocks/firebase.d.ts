import { Mock } from 'node:test';
import type { FirebaseUser, FakeAuth } from './auth.js';
import type { FakeFirestore } from './firestore.js';

export interface DatabaseDocument {
  id: string;
  _collections?: DatabaseCollections;
  [key: string]: unknown;
}

export interface DatabaseCollections {
  [collectionName: string]: Array<DatabaseDocument> | undefined;
}

export type FakeFirestoreDocumentData = Record<string, unknown>;

export interface StubOverrides {
  database?: DatabaseCollections;
  currentUser?: FirebaseUser;
}

type DefaultOptions = typeof import('./helpers/defaultMockOptions.js');
export interface StubOptions extends Partial<DefaultOptions> {}

export interface FirebaseMock {
  initializeApp: Mock<any>;
  credential: {
    cert: Mock<any>;
  };
  auth(): FakeAuth;
  firestore(): FakeFirestore;
}

export const firebaseStub: (overrides?: StubOverrides, options?: StubOptions) => FirebaseMock;
export const mockFirebase: (overrides?: StubOverrides, options?: StubOptions) => void;
export const mockInitializeApp: Mock<any>;
export const mockCert: Mock<any>;
