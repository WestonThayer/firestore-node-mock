import { describe, test, beforeEach } from 'node:test';
import { mock } from 'node:test';
import assert from 'node:assert';
import { mockFirebase, FakeFirestore } from '../index.js';
import {
  mockRunTransaction,
  mockDelete,
  mockDeleteTransaction,
  mockUpdate,
  mockUpdateTransaction,
  mockSet,
  mockSetTransaction,
  mockGet,
  mockGetTransaction,
  mockGetAll,
  mockGetAllTransaction,
  mockCreateTransaction,
} from '../mocks/firestore.js';

mockFirebase({
  database: {},
});
const { default: firebase } = await import('firebase');
firebase.initializeApp({
  apiKey: '### FIREBASE API KEY ###',
  authDomain: '### FIREBASE AUTH DOMAIN ###',
  projectId: '### CLOUD FIRESTORE PROJECT ID ###',
});
const db = firebase.firestore();

describe('Transactions', () => {
  beforeEach(() => {
    mockRunTransaction.mock.resetCalls();
    mockDelete.mock.resetCalls();
    mockDeleteTransaction.mock.resetCalls();
    mockUpdate.mock.resetCalls();
    mockUpdateTransaction.mock.resetCalls();
    mockSet.mock.resetCalls();
    mockSetTransaction.mock.resetCalls();
    mockGet.mock.resetCalls();
    mockGetTransaction.mock.resetCalls();
    mockGetAll.mock.resetCalls();
    mockGetAllTransaction.mock.resetCalls();
    mockCreateTransaction.mock.resetCalls();
  });

  test('it returns a Promise', () => {
    const result = db.runTransaction(async () => {});

    assert.ok(result instanceof Promise);
    assert.ok(mockRunTransaction.mock.callCount() > 0);
  });

  test('it returns the same value returned by the transaction callback', async () => {
    const result = await db.runTransaction(() => 'Success!');
    assert.strictEqual(result, 'Success!');
  });

  test('it provides a Transaction object', () => {
    const runner = mock.fn(() => Promise.resolve());
    const result = db.runTransaction(runner);

    assert.ok(result instanceof Promise);
    assert.ok(runner.mock.callCount() > 0);
    assert.ok(runner.mock.calls[0].arguments[0] instanceof FakeFirestore.Transaction);
  });

  test('mockGet is accessible', async () => {
    assert.strictEqual(mockGetTransaction.mock.callCount(), 0);
    const ref = db.collection('some').doc('body');

    await db.runTransaction(async transaction => {
      // `get` should return a promise
      const result = transaction.get(ref);
      assert.ok(result instanceof Promise);
      const doc = await result;

      // Calling `get` on transaction no longer calls `get` on `ref`
      assert.strictEqual(mockGet.mock.callCount(), 0);
      assert.strictEqual(doc.id, 'body');
      assert.strictEqual(doc.exists, false);
      assert.strictEqual(doc.data(), undefined);
    });
    assert.ok(mockGetTransaction.mock.callCount() > 0);
  });

  test('mockSet is accessible', async () => {
    assert.strictEqual(mockSetTransaction.mock.callCount(), 0);
    const ref = db.collection('some').doc('body');

    await db.runTransaction(transaction => {
      const newData = { foo: 'bar' };
      const options = { merge: true };
      const result = transaction.set(ref, newData, options);

      assert.ok(result instanceof FakeFirestore.Transaction);
      assert.deepStrictEqual(mockSet.mock.calls[0].arguments, [newData, options]);
    });
    assert.ok(mockSetTransaction.mock.callCount() > 0);
  });

  test('mockUpdate is accessible', async () => {
    assert.strictEqual(mockUpdateTransaction.mock.callCount(), 0);
    const ref = db.collection('some').doc('body');

    await db.runTransaction(transaction => {
      const newData = { foo: 'bar' };
      const result = transaction.update(ref, newData);

      assert.ok(result instanceof FakeFirestore.Transaction);
      assert.deepStrictEqual(mockUpdate.mock.calls[0].arguments, [newData]);
    });
    assert.ok(mockUpdateTransaction.mock.callCount() > 0);
  });

  test('mockDelete is accessible', async () => {
    assert.strictEqual(mockDeleteTransaction.mock.callCount(), 0);
    const ref = db.collection('some').doc('body');

    await db.runTransaction(async transaction => {
      const result = transaction.delete(ref);

      assert.ok(result instanceof FakeFirestore.Transaction);
      assert.ok(mockDelete.mock.callCount() > 0);
    });
    assert.ok(mockDeleteTransaction.mock.callCount() > 0);
  });

  test('mockGetAll is accessible', async () => {
    assert.strictEqual(mockGetAllTransaction.mock.callCount(), 0);
    const ref1 = db.collection('some').doc('body');
    const ref2 = ref1.collection('once').doc('told');

    await db.runTransaction(async transaction => {
      // FIXME: getAll is not defined on the client library, so this is a shot in the dark
      const result = await transaction.getAll(ref1, ref2);

      assert.ok(result instanceof Array);
      assert.ok(mockGetAll.mock.callCount() > 0);
    });
    assert.ok(mockGetAllTransaction.mock.callCount() > 0);
  });

  test('mockCreateTransaction is accessible', async () => {
    assert.strictEqual(mockCreateTransaction.mock.callCount(), 0);
    // Example from documentation
    // https://googleapis.dev/nodejs/firestore/latest/Transaction.html#create-examples

    await db.runTransaction(async transaction => {
      const documentRef = db.doc('col/doc');
      return transaction.get(documentRef).then(doc => {
        if (!doc.exists) {
          transaction.create(documentRef, { foo: 'bar' });
        }
      });
    });

    assert.ok(mockCreateTransaction.mock.callCount() > 0);
  });
});
