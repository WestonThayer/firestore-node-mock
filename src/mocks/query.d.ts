import { Mock } from 'node:test';
import type { FakeFirestore } from './firestore.js';
import type { MockedQuerySnapshot } from './helpers/buildQuerySnapShot.js';

export class Query {
  constructor(collectionName: string, firestore: typeof FakeFirestore);

  get(): Promise<MockedQuerySnapshot>;
  select(): Query;
  where(): Query;
  offset(): Query;
  limit(): Query;
  orderBy(): Query;
  startAfter(): Query;
  startAt(): Query;
  withConverter(): Query;
  onSnapshot(): () => void;
}

export const mocks: {
  mockGet: Mock<any>,
  mockSelect: Mock<any>,
  mockWhere: Mock<any>,
  mockLimit: Mock<any>,
  mockOrderBy: Mock<any>,
  mockOffset: Mock<any>,
  mockStartAfter: Mock<any>,
  mockStartAt: Mock<any>,
  mockQueryOnSnapshot: Mock<any>,
  mockQueryOnSnapshotUnsubscribe: Mock<any>,
  mockWithConverter: Mock<any>,
};
