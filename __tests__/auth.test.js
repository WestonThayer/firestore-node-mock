import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { mockFirebase } from '../index.js';
import { mockInitializeApp } from '../mocks/firebase.js';
import {
  mockCreateUserWithEmailAndPassword,
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockSendPasswordResetEmail,
  mockDeleteUser,
  mockVerifyIdToken,
  mockGetUser,
  mockCreateCustomToken,
  mockSetCustomUserClaims,
  mockUseEmulator,
} from '../mocks/auth.js';

let firebase;
let admin;

describe('we can start a firebase application', () => {
  mockFirebase({
    database: {
      users: [
        { id: 'abc123', first: 'Bob', last: 'builder', born: 1998 },
        {
          id: '123abc',
          first: 'Blues',
          last: 'builder',
          born: 1996,
          _collections: {
            cities: [{ id: 'LA', name: 'Los Angeles', state: 'CA', country: 'USA', visited: true }],
          },
        },
      ],
      cities: [
        { id: 'LA', name: 'Los Angeles', state: 'CA', country: 'USA' },
        { id: 'DC', name: 'Disctric of Columbia', state: 'DC', country: 'USA' },
      ],
    },
    currentUser: { uid: 'abc123', displayName: 'Bob' },
  });

  beforeEach(async () => {
    mockInitializeApp.mock.resetCalls();
    mockUseEmulator.mock.resetCalls();
    mockCreateUserWithEmailAndPassword.mock.resetCalls();
    mockSignInWithEmailAndPassword.mock.resetCalls();
    mockSignOut.mock.resetCalls();
    mockSendPasswordResetEmail.mock.resetCalls();
    mockDeleteUser.mock.resetCalls();
    mockVerifyIdToken.mock.resetCalls();
    mockGetUser.mock.resetCalls();
    mockCreateCustomToken.mock.resetCalls();
    mockSetCustomUserClaims.mock.resetCalls();
    
    // Use dynamic import to pick up the mock
    const fb = await import('firebase');
    firebase = fb.default;
    const adm = await import('firebase-admin');
    admin = adm.default;
    
    firebase.initializeApp({
      apiKey: '### FIREBASE API KEY ###',
      authDomain: '### FIREBASE AUTH DOMAIN ###',
      projectId: '### CLOUD FIRESTORE PROJECT ID ###',
    });
  });

  test('We can start an application', async () => {
    firebase.auth();
    assert.strictEqual(mockInitializeApp.mock.callCount() > 0, true);
  });

  test('We can use emulator', () => {
    firebase.auth().useEmulator('http://localhost:9099');
    assert.deepStrictEqual(mockUseEmulator.mock.calls[0].arguments, ['http://localhost:9099']);
  });

  describe('Client Auth Operations', () => {
    describe('Examples from documentation', () => {
      test('add a user', async () => {
        await firebase.auth().createUserWithEmailAndPassword('sam', 'hill');
        assert.deepStrictEqual(mockCreateUserWithEmailAndPassword.mock.calls[0].arguments, ['sam', 'hill']);
      });

      test('sign in', async () => {
        await firebase.auth().signInWithEmailAndPassword('sam', 'hill');
        assert.deepStrictEqual(mockSignInWithEmailAndPassword.mock.calls[0].arguments, ['sam', 'hill']);
      });

      test('sign out', async () => {
        await firebase.auth().signOut();
        assert.strictEqual(mockSignOut.mock.callCount() > 0, true);
      });

      test('send password reset email', async () => {
        await firebase.auth().sendPasswordResetEmail('sam', null);
        assert.deepStrictEqual(mockSendPasswordResetEmail.mock.calls[0].arguments, ['sam', null]);
      });
    });
  });

  describe('Admin Auth Operations', () => {
    describe('Examples from documentation', () => {
      test('delete a user', async () => {
        await admin.auth().deleteUser('some-uid');
        assert.deepStrictEqual(mockDeleteUser.mock.calls[0].arguments, ['some-uid']);
      });

      test('verify an ID token', async () => {
        await admin.auth().verifyIdToken('token_string', true);
        assert.deepStrictEqual(mockVerifyIdToken.mock.calls[0].arguments, ['token_string', true]);
      });

      test('get user object', async () => {
        await admin.auth().getUser('some-uid');
        assert.deepStrictEqual(mockGetUser.mock.calls[0].arguments, ['some-uid']);
      });

      test('get currentUser object', async () => {
        const currentUser = await admin.auth().currentUser;
        assert.strictEqual(currentUser.uid, 'abc123');
        assert.strictEqual(currentUser.data.displayName, 'Bob');
      });

      test('create custom token', async () => {
        const claims = {
          custom: true,
        };
        const token = await admin.auth().createCustomToken('some-uid', claims);
        assert.deepStrictEqual(mockCreateCustomToken.mock.calls[0].arguments, ['some-uid', claims]);
        assert.strictEqual(token, '');
      });

      test('set custom user claims', async () => {
        const claims = {
          do: 'the thing',
        };
        await admin.auth().setCustomUserClaims('some-uid', claims);
        assert.deepStrictEqual(mockSetCustomUserClaims.mock.calls[0].arguments, ['some-uid', claims]);
      });
    });

    describe('Mocking return values', () => {
      test('mocking the user object', async () => {
        const uid = 'some-uid';
        const userRecord = {
          customClaims: undefined,
          disabled: false,
          email: 'bob@example.com',
          emailVerified: false,
          metadata: {},
          multiFactor: undefined,
          passwordHash: undefined,
          passwordSalt: undefined,
          phoneNumber: '928-555-4321',
          photoURL: undefined,
          providerData: [],
          tenantId: null,
          tokensValidAfterTime: undefined,
          uid,
        };
        // Mock return value
        mockGetUser.mock.mockImplementationOnce(() => userRecord);
        
        const result = await admin.auth().getUser(uid);
        assert.deepStrictEqual(mockGetUser.mock.calls[0].arguments, [uid]);
        assert.deepStrictEqual(result, userRecord);
      });

      test('mocking verify ID token to throw Error', async () => {
        const error = new Error('test');
        mockVerifyIdToken.mock.mockImplementationOnce(() => Promise.reject(error));
        const result = await admin
          .auth()
          .verifyIdToken('token_string', true)
          .catch(err => err);
        assert.strictEqual(result, error);
      });
    });
  });
});
