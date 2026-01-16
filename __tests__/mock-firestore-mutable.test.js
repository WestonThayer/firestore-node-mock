import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FakeFirestore } from '../index.js';
import { mockCollection, mockDoc } from '../mocks/firestore.js';

describe('database mutations', () => {
  beforeEach(() => {
    mockCollection.mock.resetCalls();
    mockDoc.mock.resetCalls();
  });

  // db is a fn, instead a shared variable to enforce sandboxing data on each test.
  const db = () =>
    new FakeFirestore(
      {
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
      },
      { mutable: true },
    );

  test('it can set simple record data', async () => {
    const mdb = db();
    await mdb
      .collection('animals')
      .doc('fantasy')
      .collection('dragons')
      .doc('whisperingDeath')
      .set({
        age: 15,
        food: 'omnivore',
        special: 'tunneling',
      });
    // Note: mockCollection is called multiple times.
    // animals, dragons.
    // check that it was called with 'dragons' at some point?
    // original: expect(mockCollection).toHaveBeenCalledWith('dragons');
    // We can iterate calls.
    const calls = mockCollection.mock.calls.map(c => c.arguments[0]);
    assert.ok(calls.includes('dragons'));
    const docCalls = mockDoc.mock.calls.map(c => c.arguments[0]);
    assert.ok(docCalls.includes('whisperingDeath'));

    const doc = await mdb.doc('animals/fantasy/dragons/whisperingDeath').get();
    assert.strictEqual(doc.exists, true);
    assert.strictEqual(doc.id, 'whisperingDeath');
  });

  test('it correctly merges data on update', async () => {
    const mdb = db();
    const homer = mdb.collection('characters').doc('homer');
    await homer.set({ occupation: 'Astronaut' }, { merge: true });
    const doc = await homer.get();
    assert.strictEqual(doc.data().name, 'Homer');
    assert.strictEqual(doc.data().occupation, 'Astronaut');
  });

  test('it correctly overwrites data on set', async () => {
    const mdb = db();
    const homer = mdb.collection('characters').doc('homer');
    await homer.set({ occupation: 'Astronaut' });
    const doc = await homer.get();
    assert.strictEqual(doc.data().name, undefined);
    assert.strictEqual(doc.data().occupation, 'Astronaut');
  });

  test('it can batch appropriately', async () => {
    const mdb = db();
    const homer = mdb.collection('characters').doc('homer');
    const krusty = mdb.collection('characters').doc('krusty');
    await mdb
      .batch()
      .update(homer, { drink: 'duff' })
      .set(krusty, { causeOfDeath: 'Simian homicide' })
      .commit();

    const homerData = (await homer.get()).data();
    assert.strictEqual(homerData.name, 'Homer');
    assert.strictEqual(homerData.drink, 'duff');
    const krustyData = (await krusty.get()).data();
    assert.strictEqual(krustyData.name, undefined);
    assert.strictEqual(krustyData.causeOfDeath, 'Simian homicide');
  });

  test('it can add to collection', async () => {
    const col = db().collection('characters');
    const newDoc1 = await col.add({
      name: 'Lisa',
      occupation: 'President-in-waiting',
      address: { street: '742 Evergreen Terrace' },
    });

    const test = await newDoc1.get();
    assert.strictEqual(test.exists, true);

    const newDoc2 = await col.add({
      name: 'Lisa',
      occupation: 'President-in-waiting',
      address: { street: '742 Evergreen Terrace' },
    });
    assert.notStrictEqual(newDoc2.id, newDoc1.id);
  });

  test('it can delete from collection', async () => {
    const col = db().collection('characters');
    const homerDoc = col.doc('homer');
    await homerDoc.delete();

    const test = await homerDoc.get();
    assert.strictEqual(test.exists, false);
  });
});
