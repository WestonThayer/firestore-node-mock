import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FakeFirestore } from '../index.js';
import { mockCollection, mockDoc } from '../mocks/firestore.js';

describe('Queries', () => {
  beforeEach(() => {
    mockCollection.mock.resetCalls();
    mockDoc.mock.resetCalls();
  });

  const db = (simulateQueryFilters = false) =>
    new FakeFirestore(
      {
        characters: [
          {
            id: 'homer',
            name: 'Homer',
            occupation: 'technician',
            address: { street: '742 Evergreen Terrace' },
            // May 12, 1956.  Conveniently, a negative number
            birthdate: {
              seconds: -430444800,
              nanoseconds: 0,
            },
            // Test a pre-constructed Timestamp
            timestamp: new FakeFirestore.Timestamp(123, 456),
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
        checkEmpty: [
          {
            id: 'emptyDocument',
            _collections: {
              validChildren: {
                family: [
                  { id: '1', name: 'One' },
                  { id: '2', name: 'Two' },
                  { id: '3', name: 'Three' },
                ],
              },
            },
          },
        ],
        'subcollection/as/string': [
          { id: '1', name: 'One' },
          { id: '2', name: 'Two' }
        ]
      },
      { simulateQueryFilters },
    );

  describe('Single records versus queries', () => {
    test('it can fetch a single record', async () => {
      const record = await db()
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
    });

    test('it flags records do not exist', async () => {
      const record = await db()
        .collection('animals')
        .doc('monkey')
        .get();
      assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['animals']);
      assert.deepStrictEqual(mockDoc.mock.calls[0].arguments, ['monkey']);
      assert.strictEqual(record.id, 'monkey');
      assert.strictEqual(record.exists, false);
    });

    test('it can fetch a single record with a promise', () =>
      db()
        .collection('characters')
        .doc('homer')
        .get()
        .then(record => {
          assert.strictEqual(record.exists, true);
          assert.strictEqual(record.id, 'homer');
          assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['characters']);
          const data = record.data();
          assert.ok(record.exists);
          assert.notStrictEqual(data, undefined);
          assert.strictEqual(data.name, 'Homer');
          assert.strictEqual(data.occupation, 'technician');

          assert.strictEqual(record.get('name'), 'Homer');
          assert.strictEqual(record.get('address.street'), '742 Evergreen Terrace');
          assert.strictEqual(record.get('address.street.doesntExist'), null); // or {}? Test expected null
        }));

    test('it can fetch a single record with a promise without a specified collection', () =>
      db()
        .doc('characters/homer')
        .get()
        .then(record => {
          assert.strictEqual(record.exists, true);
          assert.strictEqual(record.id, 'homer');
          assert.strictEqual(mockCollection.mock.callCount(), 0);
          const data = record.data();
          assert.ok(record.exists);
          assert.notStrictEqual(data, undefined);
          assert.strictEqual(data.name, 'Homer');
          assert.strictEqual(data.occupation, 'technician');
        }));

    test('it can fetch multiple records and returns documents', async () => {
      const records = await db()
        .collection('characters')
        .where('name', '==', 'Homer')
        .get();

      assert.strictEqual(records.empty, false);
      assert.ok(Array.isArray(records.docs));
      const doc = records.docs[0];
      assert.strictEqual(doc.id, 'homer');
      assert.strictEqual(doc.exists, true);
      const data = doc.data();
      assert.notStrictEqual(data, undefined);
      assert.strictEqual(data.name, 'Homer');
    });

    test('it throws an error if the collection path ends at a document', () => {
      assert.throws(() => db().collection(''), Error);
      assert.ok(db().collection('foo') instanceof FakeFirestore.CollectionReference);
      assert.throws(() => db().collection('foo/bar'), Error);
      assert.ok(db().collection('foo/bar/baz') instanceof FakeFirestore.CollectionReference);
    });

    test('it throws an error if the document path ends at a collection', () => {
      assert.throws(() => db().doc(''), Error);
      assert.throws(() => db().doc('characters'), Error);
      assert.ok(db().doc('characters/bob') instanceof FakeFirestore.DocumentReference);
      assert.throws(() => db().doc('characters/bob/family'), Error);
    });

    test('it can fetch nonexistent documents from a root collection', async () => {
      const nope = await db()
        .doc('characters/joe')
        .get();
      assert.strictEqual(nope.exists, false);
      assert.strictEqual(nope.id, 'joe');
      assert.ok('ref' in nope);
      assert.strictEqual(nope.ref.path, 'characters/joe');
    });

    test('it can fetch nonexistent documents from extant subcollections', async () => {
      const nope = await db()
        .doc('characters/bob/family/thing3')
        .get();
      assert.strictEqual(nope.exists, false);
      assert.strictEqual(nope.id, 'thing3');
      assert.ok('ref' in nope);
      assert.strictEqual(nope.ref.path, 'characters/bob/family/thing3');
    });

    test('it can fetch nonexistent documents from nonexistent subcollections', async () => {
      const nope = await db()
        .doc('characters/sam/family/phil')
        .get();
      assert.strictEqual(nope.exists, false);
      assert.strictEqual(nope.id, 'phil');
      assert.ok('ref' in nope);
      assert.strictEqual(nope.ref.path, 'characters/sam/family/phil');
    });

    test('it can fetch nonexistent documents from nonexistent root collections', async () => {
      const nope = await db()
        .doc('foo/bar/baz/bin')
        .get();
      assert.strictEqual(nope.exists, false);
      assert.strictEqual(nope.id, 'bin');
      assert.ok('ref' in nope);
      assert.strictEqual(nope.ref.path, 'foo/bar/baz/bin');
    });

    test('it flags when a collection is empty', async () => {
      const records = await db()
        .collection('animals')
        .where('type', '==', 'mammal')
        .get();
      assert.strictEqual(records.empty, true);
    });

    const cases = [
      { simulateQueryFilters: true, expectedSize: 1 },
      { simulateQueryFilters: false, expectedSize: 3 }
    ];
    cases.forEach(({ simulateQueryFilters, expectedSize }) => {
      test(`it can fetch multiple records as a promise (simulateQueryFilters=${simulateQueryFilters})`, () =>
        db(simulateQueryFilters)
          .collection('characters')
          .where('name', '==', 'Homer')
          .get()
          .then(records => {
            assert.strictEqual(records.empty, false);
            assert.ok(Array.isArray(records.docs));
            assert.strictEqual(records.size, expectedSize);
            assert.strictEqual(records.docs[0].id, 'homer');
            assert.strictEqual(records.docs[0].exists, true);
            assert.strictEqual(records.docs[0].data().name, 'Homer');
          }));
    });

    test('it can return all root records', async () => {
      const firstRecord = db()
        .collection('characters')
        .doc('homer');
      const secondRecord = db()
        .collection('characters')
        .doc('krusty');

      const records = await db().getAll(firstRecord, secondRecord);
      assert.strictEqual(records.length, 2);
      assert.strictEqual(records[0].id, 'homer');
      assert.strictEqual(records[0].exists, true);
      assert.strictEqual(records[0].data().name, 'Homer');
    });

    test('it does not fetch subcollections unless we tell it to', async () => {
      const record = await db()
        .collection('characters')
        .doc('bob')
        .get();
      assert.strictEqual(record.exists, true);
      assert.strictEqual(record.id, 'bob');
      assert.strictEqual(record.data().name, 'Bob');
      assert.strictEqual('_collections' in record.data(), false);
    });

    test('it can fetch records from subcollections', async () => {
      const family = db()
        .collection('characters')
        .doc('bob')
        .collection('family');
      assert.strictEqual(family.path, 'characters/bob/family');

      const allFamilyMembers = await family.get();
      assert.strictEqual(allFamilyMembers.docs.length, 4);
      assert.ok(allFamilyMembers.forEach);

      const ref = family.doc('violet');
      assert.strictEqual(ref.path, 'characters/bob/family/violet');

      const record = await ref.get();
      assert.strictEqual(record.exists, true);
      assert.strictEqual(record.id, 'violet');
      assert.ok(record.data);
      assert.strictEqual(record.data().name, 'Violet');
    });

    test('it can fetch records from subcollections with a string path', async () => {
      // expect.assertions(8);
      const subCollection = await db()
        .collection('subcollection/as/string')

      const allSubcollectionItems = await subCollection.get();
      assert.strictEqual(allSubcollectionItems.docs.length, 2);
      assert.ok(allSubcollectionItems.forEach);
    });
    

    const subColCases = [
      { simulateQueryFilters: true, expectedSize: 2 },
      { simulateQueryFilters: false, expectedSize: 4 }
    ];
    subColCases.forEach(({ simulateQueryFilters, expectedSize }) => {
      test(`it can fetch records from subcollections with query parameters (simulateQueryFilters=${simulateQueryFilters})`,
      async () => {
        const family = db(simulateQueryFilters)
          .collection('characters')
          .doc('bob')
          .collection('family')
          .where('relation', '==', 'son'); // should return only sons
        assert.strictEqual(family.path, 'characters/bob/family');

        const docs = await family.get();
        assert.strictEqual(docs.size, expectedSize);
      });
    });
  });

  describe('Multiple records versus queries', () => {
    test('it fetches all records from a root collection', async () => {
      const characters = await db()
        .collection('characters')
        .get();
      assert.strictEqual(characters.empty, false);
      assert.strictEqual(characters.size, 3);
      assert.strictEqual(Array.isArray(characters.docs), true);
      assert.ok(characters.forEach);
    });

    test('it fetches no records from nonexistent collection', async () => {
      const nope = await db()
        .collection('foo')
        .get();
      assert.strictEqual(nope.empty, true);
      assert.strictEqual(nope.size, 0);
      assert.strictEqual(Array.isArray(nope.docs), true);
      assert.ok(nope.forEach);
    });

    test('it fetches all records from subcollection', async () => {
      const familyRef = db()
        .collection('characters')
        .doc('bob')
        .collection('family');
      const family = await familyRef.get();
      assert.strictEqual(family.empty, false);
      assert.strictEqual(family.size, 4);
      assert.strictEqual(Array.isArray(family.docs), true);
      assert.ok(family.forEach);
    });

    test('it fetches no records from nonexistent subcollection', async () => {
      const nope = await db()
        .collection('characters')
        .doc('bob')
        .collection('not-here')
        .get();
      assert.strictEqual(nope.empty, true);
      assert.strictEqual(nope.size, 0);
      assert.strictEqual(Array.isArray(nope.docs), true);
      assert.ok(nope.forEach);
    });

    test('it fetches no records from nonexistent root collection', async () => {
      const nope = await db()
        .collection('foo')
        .doc('bar')
        .collection('baz')
        .get();
      assert.strictEqual(nope.empty, true);
      assert.strictEqual(nope.size, 0);
      assert.strictEqual(Array.isArray(nope.docs), true);
      assert.ok(nope.forEach);
    });
  });

  test('it returns all results from listDocuments', async () => {
    const [emptyDoc] = await db()
      .collection('checkEmpty')
      .listDocuments();
    assert.ok(emptyDoc !== undefined);
    const data = await emptyDoc.get();
    assert.ok(data.exists);
    // Contains no data
    assert.strictEqual(Object.keys(data.data()).length, 0);
  });

  test('New documents with random ID', async () => {
    // See https://firebase.google.com/docs/reference/js/firestore_#doc
    // "If no path is specified, an automatically-generated unique ID will be used for the returned DocumentReference."
    const col = db().collection('foo');
    const newDoc = col.doc();
    const otherIds = col._records().map(doc => doc.id);
    assert.strictEqual(otherIds.includes(newDoc.id), false); // not.toContainEqual
    assert.strictEqual(newDoc.path, `foo/${newDoc.id}`);
  });

  test('it properly converts timestamps', () =>
    db()
      .doc('characters/homer')
      .get()
      .then(record => {
        assert.strictEqual(record.id, 'homer');
        const data = record.data();
        assert.strictEqual(typeof data.birthdate.toDate, 'function');
      }));
});
