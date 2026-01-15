import { mock } from 'node:test';

export const mockGetAll = mock.fn();
export const mockGetAllTransaction = mock.fn();
export const mockGetTransaction = mock.fn();
export const mockSetTransaction = mock.fn();
export const mockUpdateTransaction = mock.fn();
export const mockDeleteTransaction = mock.fn();
export const mockCreateTransaction = mock.fn();

export class Transaction {
  getAll(...refsOrReadOptions) {
    mockGetAll(...arguments);
    mockGetAllTransaction(...arguments);
    // TODO: Assert that read options, if provided, are the last argument
    // Filter out the read options before calling .get()
    return Promise.all(refsOrReadOptions.filter(ref => !!ref.get).map(ref => ref.get()));
  }

  get(ref) {
    mockGetTransaction(...arguments);
    return Promise.resolve(ref._get());
  }

  set(ref) {
    mockSetTransaction(...arguments);
    const args = [...arguments];
    args.shift();
    ref.set(...args);
    return this;
  }

  update(ref) {
    mockUpdateTransaction(...arguments);
    const args = [...arguments];
    args.shift();
    ref.update(...args);
    return this;
  }

  delete(ref) {
    mockDeleteTransaction(...arguments);
    ref.delete();
    return this;
  }

  create(ref, options) {
    mockCreateTransaction(...arguments);
    ref.set(options);
    return this;
  }
}

export const mocks = {
  mockGetAll,
  mockGetAllTransaction,
  mockGetTransaction,
  mockSetTransaction,
  mockUpdateTransaction,
  mockDeleteTransaction,
  mockCreateTransaction,
};
