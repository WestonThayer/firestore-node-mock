import { Mock } from 'node:test';
import type { FieldValue } from './fieldValue.js';
import type { Query } from './query.js';
import type { Timestamp } from './timestamp.js';
import type { Transaction } from './transaction.js';
import type { FieldPath } from './path.js';

import type { MockedDocument, DocumentData } from './helpers/buildDocFromHash.js';
import type { MockedQuerySnapshot } from './helpers/buildQuerySnapShot.js';

interface DatabaseDocument extends DocumentData {
  id: string;
  _collections?: DatabaseCollections;
}

interface DatabaseCollections {
  [collectionName: string]: Array<DatabaseDocument> | undefined;
}

interface SetOptions {
  merge?: boolean;
}

interface FirestoreBatch {
  delete(): FirestoreBatch;
  set(doc: DocumentReference, data: DocumentData, options?: SetOptions): FirestoreBatch;
  update(doc: DocumentReference, data: DocumentData): FirestoreBatch;
  create(doc: DocumentReference, data: DocumentData): FirestoreBatch;
  commit(): Promise<void>;
}

export type FakeFirestoreDatabase = DatabaseCollections;

export class FakeFirestore {
  static FieldValue: typeof FieldValue;
  static Timestamp: typeof Timestamp
  static Query: typeof Query;
  static Transaction: typeof Transaction;
  static FieldPath: typeof FieldPath;

  static DocumentReference: typeof DocumentReference;
  static CollectionReference: typeof CollectionReference;

  database: FakeFirestoreDatabase;
  options: Record<string, never>;
  query: Query;
  collectionName: string;
  
  constructor(stubbedDatabase?: DatabaseCollections, options?: Record<string, never>);

  getAll(): Array<MockedQuerySnapshot>;
  batch(): FirestoreBatch;
  settings(): void;
  useEmulator(): void;
  collection(collectionName: string): CollectionReference;
  collectionGroup(collectionName: string): Query;
  doc(path: string): DocumentReference;
  runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T>;
  recursiveDelete(ref: DocumentReference|CollectionReference): Promise<void>;
}

declare class DocumentReference {
  id: string;
  parent: CollectionReference;
  firestore: FakeFirestore;
  path: string;
  
  constructor(id: string, parent: CollectionReference);

  collection(collectionName: string): CollectionReference;
  delete(): Promise<void>;
  get(): Promise<MockedDocument>;

  create(object: DocumentData): Promise<MockedDocument>;
  update(object: DocumentData): Promise<MockedDocument>;
  set(object: DocumentData): Promise<MockedDocument>;

  isEqual(other: DocumentReference): boolean;

  withConverter(): DocumentReference;

  onSnapshot(callback: () => void, errorCallback: () => void): () => void;
  onSnapshot(options: Record<string, never>, callback: () => void, errorCallback: () => void): () => void;

  /** @deprecated Call the analagous method on a `Query` instance instead. */
  orderBy(): never;

  /** @deprecated Call the analagous method on a `Query` instance instead. */
  limit(): never;

  /** @deprecated Call the analagous method on a `Query` instance instead. */
  offset(): never;

  /** @deprecated Call the analagous method on a `Query` instance instead. */
  startAfter(): never;

  /** @deprecated Call the analagous method on a `Query` instance instead. */
  startAt(): never;
}

declare class CollectionReference extends FakeFirestore.Query {
  id: string;
  parent: DocumentReference;
  path: string;
  
  constructor(id: string, parent: DocumentReference, firestore?: FakeFirestore);

  doc(id?: string): DocumentReference;
  get(): Promise<MockedQuerySnapshot>;
  add(data: DocumentData): Promise<DocumentReference>;
  isEqual(other: CollectionReference): boolean;

  /**
   * An internal method, meant mainly to be used by `get` and other internal objects to retrieve
   * the list of database records referenced by this CollectionReference.
   * @returns An array of mocked document records.
   */
  private _records(): Array<MockedDocument>
}

// Mocks exported from this module
export const mockBatch: Mock<any>;
export const mockRunTransaction: Mock<any>;
export const mockRecursiveDelete: Mock<any>;

export const mockCollection: Mock<any>;
export const mockCollectionGroup: Mock<any>;
export const mockDoc: Mock<any>;
export const mockCreate: Mock<any>;
export const mockUpdate: Mock<any>;
export const mockSet: Mock<any>;
export const mockAdd: Mock<any>;
export const mockDelete: Mock<any>;
export const mockSettings: Mock<any>;

// FIXME: We should decide whether this should be exported from auth or firestore
export const mockUseEmulator: Mock<any>;
export const mockListDocuments: Mock<any>;

export const mockBatchDelete: Mock<any>;
export const mockBatchCommit: Mock<any>;
export const mockBatchUpdate: Mock<any>;
export const mockBatchSet: Mock<any>;
export const mockBatchCreate: Mock<any>;

export const mockOnSnapShot: Mock<any>;

// Mocks exported from FieldValue
export const mockArrayUnionFieldValue: Mock<any>;
export const mockArrayRemoveFieldValue: Mock<any>;
export const mockDeleteFieldValue: Mock<any>;
export const mockIncrementFieldValue: Mock<any>;
export const mockServerTimestampFieldValue: Mock<any>;

// Mocks exported from Query
export const mockGet: Mock<any>;
export const mockWhere: Mock<any>;
export const mockLimit: Mock<any>;
export const mockOrderBy: Mock<any>;
export const mockOffset: Mock<any>;
export const mockStartAfter: Mock<any>;
export const mockStartAt: Mock<any>;
export const mockQueryOnSnapshot: Mock<any>;
export const mockQueryOnSnapshotUnsubscribe: Mock<any>;
export const mockWithConverter: Mock<any>;

// Mocks exported from Timestamp
export const mockTimestampToDate: Mock<any>;
export const mockTimestampToMillis: Mock<any>;
export const mockTimestampFromDate: Mock<any>;
export const mockTimestampFromMillis: Mock<any>;
export const mockTimestampNow: Mock<any>;

// Mocks exported from Transaction
export const mockGetAll: Mock<any>;
export const mockGetAllTransaction: Mock<any>;
export const mockGetTransaction: Mock<any>;
export const mockSetTransaction: Mock<any>;
export const mockUpdateTransaction: Mock<any>;
export const mockDeleteTransaction: Mock<any>;
export const mockCreateTransaction: Mock<any>;
