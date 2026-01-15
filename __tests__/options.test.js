import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FakeFirestore } from '../index.js';
import { mockCollection, mockDoc } from '../mocks/firestore.js';

describe('Firestore options', () => {
  beforeEach(() => {
    mockCollection.mock.resetCalls();
    mockDoc.mock.resetCalls();
  });

  const database = {
    characters: [
      {
        id: 'homer',
        name: 'Homer',
        occupation: 'technician',
        address: { street: '742 Evergreen Terrace' },
      },
      { id: 'krusty', name: 'Krusty', occupation: 'clown' },
      {
        id: 'bob',
        name: 'Bob',
        occupation: 'insurance agent',
        _collections: {
          family: [
            { id: 'violet', name: 'Violet', relation: 'daughter' },
            { id: 'dash', name: 'Dash', relation: 'son' },
            { id: 'jackjack', name: 'Jackjack', relation: 'son' },
            { id: 'helen', name: 'Helen', relation: 'wife' },
          ],
        },
      },
    ],
  };

  const options = {
    includeIdsInData: true,
  };

  const db = new FakeFirestore(database, options);

  describe('Single records versus queries', () => {
    test('it can fetch a single record', async () => {
      const record = await db
        .collection('characters')
        .doc('krusty')
        .get();
      assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['characters']);
      assert.deepStrictEqual(mockDoc.mock.calls[0].arguments, ['krusty']);
      assert.strictEqual(record.exists, true);
      assert.strictEqual(record.id, 'krusty');
      const data = record.data();
      assert.strictEqual(data.name, 'Krusty');
      assert.strictEqual(data.occupation, 'clown');
      assert.strictEqual(data.id, 'krusty');
    });
  });
});
