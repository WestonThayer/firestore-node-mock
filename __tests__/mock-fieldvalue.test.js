import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { mockFirebase } from '../index.js';
import {
  mockArrayRemoveFieldValue,
  mockArrayUnionFieldValue,
  mockDeleteFieldValue,
  mockIncrementFieldValue,
  mockServerTimestampFieldValue,
} from '../mocks/firestore.js';

mockFirebase({ database: {} });
const { default: firebase } = await import('firebase');

describe('Single values transformed by field sentinels', () => {
  beforeEach(() => {
    mockArrayRemoveFieldValue.mock.resetCalls();
    mockArrayUnionFieldValue.mock.resetCalls();
    mockDeleteFieldValue.mock.resetCalls();
    mockIncrementFieldValue.mock.resetCalls();
    mockServerTimestampFieldValue.mock.resetCalls();
  });

  test('it is distinct from other field value instances', () => {
    const incrementBy1 = firebase.firestore.FieldValue.increment();
    const unionNothing = firebase.firestore.FieldValue.arrayUnion();

    assert.strictEqual(incrementBy1.isEqual(incrementBy1), true);
    assert.strictEqual(unionNothing.isEqual(unionNothing), true);
    assert.strictEqual(incrementBy1.isEqual(unionNothing), false);

    assert.ok(mockIncrementFieldValue.mock.callCount() > 0);
  });

  test('mockArrayRemoveFieldValue is accessible', () => {
    const fieldValue = firebase.firestore.FieldValue.arrayRemove('val');
    // toMatchObject: check properties
    assert.strictEqual(fieldValue.type, 'arrayRemove');
    assert.deepStrictEqual(fieldValue.value, ['val']);
    assert.strictEqual(mockArrayRemoveFieldValue.mock.callCount(), 1);
  });

  test('mockArrayUnionFieldValue is accessible', () => {
    const fieldValue = firebase.firestore.FieldValue.arrayUnion('val');
    assert.strictEqual(fieldValue.type, 'arrayUnion');
    assert.deepStrictEqual(fieldValue.value, ['val']);
    assert.strictEqual(mockArrayUnionFieldValue.mock.callCount(), 1);
  });

  test('mockDeleteFieldValue is accessible', () => {
    const fieldValue = firebase.firestore.FieldValue.delete();
    assert.strictEqual(fieldValue.type, 'delete');
    assert.strictEqual(fieldValue.value, undefined);
    assert.strictEqual(mockDeleteFieldValue.mock.callCount(), 1);
  });

  test('mockServerTimestampFieldValue is accessible', () => {
    const fieldValue = firebase.firestore.FieldValue.serverTimestamp();
    assert.strictEqual(fieldValue.type, 'serverTimestamp');
    assert.strictEqual(fieldValue.value, undefined);
    assert.strictEqual(mockServerTimestampFieldValue.mock.callCount(), 1);
  });
});
