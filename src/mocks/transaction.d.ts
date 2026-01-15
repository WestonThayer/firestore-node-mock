import { Mock } from 'node:test';
import type { Query } from './query.js';
import type { MockedQuerySnapshot } from './helpers/buildQuerySnapShot.js';

export class Transaction {
  getAll(...refsOrReadOptions: Array<Query | Record<string, never>>): Promise<Array<MockedQuerySnapshot>>;
  get(ref: Query): Promise<MockedQuerySnapshot>;
  set(ref: Query): Transaction;
  update(ref: Query): Transaction;
  delete(ref: Query): Transaction;
  create(ref: Query, options: unknown): Transaction;
}

export const mocks: {
  mockGetAll: Mock<any>;
  mockGetAllTransaction: Mock<any>;
  mockGetTransaction: Mock<any>;
  mockSetTransaction: Mock<any>;
  mockUpdateTransaction: Mock<any>;
  mockDeleteTransaction: Mock<any>;
  mockCreateTransaction: Mock<any>;
};
