import { describe, test } from 'node:test';
import assert from 'node:assert';
import { mockFirebase } from '../index.js';
import { Path } from '../mocks/path.js';

mockFirebase({ database: {} });
const { default: firebase } = await import('firebase');

describe('Single values transformed by field sentinels', () => {
  test('isEqual', () => {
    const path1 = new firebase.firestore.FieldPath('collection', 'doc1');
    const path2 = new firebase.firestore.FieldPath('collection', 'doc2');
    assert.strictEqual(path1.isEqual(path1), true);
    assert.strictEqual(path2.isEqual(path2), true);
    assert.strictEqual(path1.isEqual(path2), false);
  });

  test('compareTo', () => {
    const path1 = new Path(['abc', 'def', 'ghij']);
    const path2 = new Path(['abc', 'def', 'ghik']);
    assert.strictEqual(path1.compareTo(path2), -1);
    const path3 = new Path(['abc', 'def', 'ghi']);
    assert.strictEqual(path1.compareTo(path3), 1);
    const path4 = new Path(['abc', 'def']);
    const path5 = new Path(['abc', 'def']);
    assert.strictEqual(path1.compareTo(path4), 1);
    assert.strictEqual(path4.compareTo(path5), 0);
    const path6 = new Path(['abc', 'def', 'ghi', 'klm']);
    assert.strictEqual(path6.compareTo(path1), -1);
    assert.strictEqual(path3.compareTo(path6), -1);
  });

  test('documentId', () => {
    const path = firebase.firestore.FieldPath.documentId();
    assert.strictEqual(path === firebase.firestore.FieldPath.documentId(), true);
  });
});
