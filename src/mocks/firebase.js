import { mock } from 'node:test';
import { createRequire } from 'node:module';
import { FakeFirestore } from './firestore.js';
import { FakeAuth } from './auth.js';
import defaultOptions from './helpers/defaultMockOptions.js';

const require = createRequire(import.meta.url);

export const mockInitializeApp = mock.fn();
export const mockCert = mock.fn();

let activeOverrides = {};
let activeOptions = defaultOptions;
const mockedModules = new Set();

export const firebaseStub = () => {
  // Prepare namespaced classes
  function firestoreConstructor() {
    return new FakeFirestore(activeOverrides.database, activeOptions);
  }

  firestoreConstructor.Query = FakeFirestore.Query;
  firestoreConstructor.CollectionReference = FakeFirestore.CollectionReference;
  firestoreConstructor.DocumentReference = FakeFirestore.DocumentReference;
  firestoreConstructor.FieldValue = FakeFirestore.FieldValue;
  firestoreConstructor.Timestamp = FakeFirestore.Timestamp;
  firestoreConstructor.Transaction = FakeFirestore.Transaction;
  firestoreConstructor.FieldPath = FakeFirestore.FieldPath;

  //Remove methods which do not exist in Firebase
  delete firestoreConstructor.DocumentReference.prototype.listCollections;

  // The Firebase mock
  return {
    initializeApp: mockInitializeApp,

    credential: {
      cert: mockCert,
    },

    auth() {
      return new FakeAuth(activeOverrides.currentUser);
    },

    firestore: firestoreConstructor,
  };
};

export const mockFirebase = (overrides = {}, options = defaultOptions) => {
  activeOverrides = overrides;
  activeOptions = options;

  const moduleFound = 
    mockModuleIfFound('firebase') |
    mockModuleIfFound('firebase-admin');
  
  if (!moduleFound && mockedModules.size === 0) {
    console.info(`Neither 'firebase' nor 'firebase-admin' modules found, mocking skipped.`);
  }
};

function mockModuleIfFound(moduleName) {
  if (mockedModules.has(moduleName)) {
    return true;
  }
  try {
    require.resolve(moduleName);
    const stub = firebaseStub();
    mock.module(moduleName, {
      defaultExport: stub,
      namedExports: stub,
    });
    mockedModules.add(moduleName);
    return true;
  } catch (e) {
    // console.error(`Error mocking ${moduleName}:`, e);
    return false;
  }
}
