import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FakeFirestore } from '../index.js';
import {
  mockCollection,
  mockDoc,
  mockDelete,
  mockWhere,
  mockLimit,
  mockOrderBy,
  mockStartAfter,
  mockStartAt,
} from '../mocks/firestore.js';

describe('Reference Sentinels', () => {
  beforeEach(() => {
    mockCollection.mock.resetCalls();
    mockDoc.mock.resetCalls();
    mockDelete.mock.resetCalls();
    mockWhere.mock.resetCalls();
    mockLimit.mock.resetCalls();
    mockOrderBy.mock.resetCalls();
    mockStartAfter.mock.resetCalls();
    mockStartAt.mock.resetCalls();
  });

  const db = new FakeFirestore({
    characters: [
      { id: 'homer', name: 'Homer', occupation: 'technician' },
      { id: 'krusty', name: 'Krusty', occupation: 'clown' },
      {
        id: 'bob',
        name: 'Bob',
        occupation: 'repairman',
        _collections: {
          family: [
            { id: 'thing1', name: 'Thing 1', relation: 'pet' },
            { id: 'thing2', name: 'Thing 2', relation: 'pet' },
            { id: 'deborah', name: 'Deborah', relation: 'wife' },
          ],
        },
      },
    ],
  });

  describe('Collection Reference', () => {
    test('it returns a collection reference', () => {
      const charactersRef = db.collection('characters');
      assert.ok(charactersRef instanceof FakeFirestore.CollectionReference);
      // In JS: `coll = new FakeFirestore.CollectionReference(collectionId, doc, this);`
      // If doc is null (root), parent is doc.
      // `_docAndColForPathArray` calls it with `doc`. Initial doc is null.
      assert.strictEqual(charactersRef.parent, null);
      
      const calls = mockCollection.mock.calls.map(c => c.arguments[0]);
      assert.ok(calls.includes('characters'));

      assert.ok(db.collection('non-existent') instanceof FakeFirestore.CollectionReference);
      const calls2 = mockCollection.mock.calls.map(c => c.arguments[0]);
      assert.ok(calls2.includes('non-existent'));
    });

    test('it compares collection references', () => {
      const collectionRef = db.collection('characters');
      assert.strictEqual(collectionRef.firestore, db);
      assert.strictEqual(collectionRef.id, 'characters');
      assert.strictEqual(collectionRef.path, 'characters');

      const other = db.collection('characters');
      assert.strictEqual(collectionRef.isEqual(collectionRef), true);
      assert.strictEqual(collectionRef.isEqual(other), true);
      assert.strictEqual(collectionRef.isEqual({}), false);
    });

    const collectionRef = db.collection('characters');

    test('it calls mockWhere', () => {
      collectionRef.where('occupation', '==', 'technician');
      assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['occupation', '==', 'technician']);
    });

    test('it calls mockLimit', () => {
      collectionRef.limit(2);
      assert.deepStrictEqual(mockLimit.mock.calls[0].arguments, [2]);
    });

    test('it calls mockOrderBy', () => {
      collectionRef.orderBy('name');
      assert.deepStrictEqual(mockOrderBy.mock.calls[0].arguments, ['name']);
    });

    test('it calls mockStartAfter', () => {
      collectionRef.startAfter(null);
      assert.deepStrictEqual(mockStartAfter.mock.calls[0].arguments, [null]);
    });

    test('it calls mockStartAt', () => {
      collectionRef.startAt(null);
      assert.deepStrictEqual(mockStartAt.mock.calls[0].arguments, [null]);
    });
  });

  describe('Document Reference', () => {
    test('it returns a document reference', () => {
      const homerRef = db.collection('characters').doc('homer');
      assert.ok(homerRef instanceof FakeFirestore.DocumentReference);
      assert.ok(homerRef.parent instanceof FakeFirestore.CollectionReference);
      // mockCollection call count > 0
      assert.ok(mockCollection.mock.callCount() > 0);
      assert.deepStrictEqual(mockDoc.mock.calls[0].arguments, ['homer']);

      assert.ok(db.collection('non-existent').doc('need-I-say-more') instanceof FakeFirestore.DocumentReference);
      // mockCollection call with non-existent
      // mockDoc call with need-I-say-more
      const docCalls = mockDoc.mock.calls.map(c => c.arguments[0]);
      assert.ok(docCalls.includes('need-I-say-more'));
    });

    test('it compares document references', () => {
      const docRef = db.collection('characters').doc('homer');
      assert.strictEqual(docRef.firestore, db);
      assert.strictEqual(docRef.id, 'homer');
      assert.strictEqual(docRef.path, 'characters/homer');

      const other = db.collection('characters').doc('homer');
      assert.strictEqual(docRef.isEqual(docRef), true);
      assert.strictEqual(docRef.isEqual(other), true);
      assert.strictEqual(docRef.isEqual({}), false);
    });

    test('it calls delete() mock', () => {
      const docRef = db.collection('characters').doc('homer');
      docRef.delete();
      assert.ok(mockDelete.mock.callCount() > 0);
    });
  });
});
