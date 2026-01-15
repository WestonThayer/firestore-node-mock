import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mockFirebase } from '../index.js';
import { mockInitializeApp } from '../mocks/firebase.js';
import { Timestamp } from '../mocks/timestamp.js';
import {
  mockGet,
  mockSelect,
  mockAdd,
  mockSet,
  mockUpdate,
  mockWhere,
  mockCollectionGroup,
  mockBatch,
  mockBatchCommit,
  mockBatchDelete,
  mockBatchUpdate,
  mockBatchSet,
  mockBatchCreate,
  mockSettings,
  mockOnSnapShot,
  mockUseEmulator,
  mockDoc,
  mockCollection,
  mockWithConverter,
  FakeFirestore,
  mockQueryOnSnapshot,
  mockQueryOnSnapshotUnsubscribe,
  mockTimestampNow,
  mockRecursiveDelete,
} from '../mocks/firestore.js';

const flushPromises = () => new Promise(setImmediate);

const filtersCases = [true, false];

filtersCases.forEach(filters => {
  describe(`we can start a firebase application (query filters: ${filters})`, () => {
    let firebase;

    beforeEach(async () => {
      mockInitializeApp.mock.resetCalls();
      mockGet.mock.resetCalls();
      mockSelect.mock.resetCalls();
      mockAdd.mock.resetCalls();
      mockSet.mock.resetCalls();
      mockUpdate.mock.resetCalls();
      mockWhere.mock.resetCalls();
      mockCollectionGroup.mock.resetCalls();
      mockBatch.mock.resetCalls();
      mockBatchCommit.mock.resetCalls();
      mockBatchDelete.mock.resetCalls();
      mockBatchUpdate.mock.resetCalls();
      mockBatchSet.mock.resetCalls();
      mockBatchCreate.mock.resetCalls();
      mockSettings.mock.resetCalls();
      mockOnSnapShot.mock.resetCalls();
      mockUseEmulator.mock.resetCalls();
      mockDoc.mock.resetCalls();
      mockCollection.mock.resetCalls();
      mockWithConverter.mock.resetCalls();
      mockQueryOnSnapshot.mock.resetCalls();
      mockQueryOnSnapshotUnsubscribe.mock.resetCalls(); // mock, not spy?
      mockTimestampNow.mock.resetCalls();
      mockRecursiveDelete.mock.resetCalls();

      mockFirebase(
        {
          database: {
            users: [
              { id: 'abc123', first: 'Bob', last: 'builder', born: 1998 },
              {
                id: '123abc',
                first: 'Blues',
                last: 'builder',
                born: 1996,
                _collections: {
                  cities: [
                    { id: 'LA', name: 'Los Angeles', state: 'CA', country: 'USA', visited: true },
                    { id: 'Mex', name: 'Mexico City', country: 'Mexico', visited: true },
                  ],
                },
              },
            ],
            cities: [
              { id: 'LA', name: 'Los Angeles', state: 'CA', country: 'USA' },
              { id: 'DC', name: 'Disctric of Columbia', state: 'DC', country: 'USA' },
            ],
          },
        },
        { simulateQueryFilters: filters },
      );

      const mod = await import('firebase');
      firebase = mod.default;

      firebase.initializeApp({
        apiKey: '### FIREBASE API KEY ###',
        authDomain: '### FIREBASE AUTH DOMAIN ###',
        projectId: '### CLOUD FIRESTORE PROJECT ID ###',
      });
    });

    afterEach(() => {
        mockTimestampNow.mock.resetCalls();
        mockTimestampNow.mock.mockImplementation(() => undefined);
    });

    test('We can start an application', async () => {
      const db = firebase.firestore();
      db.settings({ ignoreUndefinedProperties: true });
      assert.ok(mockInitializeApp.mock.callCount() > 0);
      assert.deepStrictEqual(mockSettings.mock.calls[0].arguments, [{ ignoreUndefinedProperties: true }]);
    });

    test('we can use emulator', async () => {
      const db = firebase.firestore();
      db.useEmulator('localhost', 9000);
      assert.deepStrictEqual(mockUseEmulator.mock.calls[0].arguments, ['localhost', 9000]);
    });

    describe('Examples from documentation', () => {
      test('add a user', () => {
        const db = firebase.firestore();

        // Example from documentation:
        // https://firebase.google.com/docs/firestore/quickstart#add_data

        return db
          .collection('users')
          .add({
            first: 'Ada',
            last: 'Lovelace',
            born: 1815,
          })
          .then(function(docRef) {
            assert.ok(mockAdd.mock.callCount() > 0);
            assert.ok(docRef.id);
            assert.strictEqual(docRef.path, `users/${docRef.id}`);
          });
      });

      test('get all users', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/quickstart#read_data

        return db
          .collection('users')
          .get()
          .then(querySnapshot => {
            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, 2);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            const paths = querySnapshot.docs.map(d => d.ref.path).sort();
            const expectedPaths = ['users/abc123', 'users/123abc'].sort();
            assert.deepStrictEqual(paths, expectedPaths);
            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
              assert.ok(!doc.data().id);
            });
          });
      });

      test('select specific fields only', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/quickstart#read_data

        return db
          .collection('users')
          .select('first', 'last')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockSelect.mock.calls[0].arguments, ['first', 'last']);

            const data = querySnapshot.docs[0].data();
            assert.strictEqual(Object.keys(data).length, 2);
            assert.strictEqual(data.first, 'Bob');
            assert.strictEqual(data.last, 'builder');
          });
      });

      test('select refs only', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/quickstart#read_data

        return db
          .collection('users')
          .select()
          .get()
          .then(querySnapshot => {
            // assert.deepStrictEqual(mockSelect.mock.calls[0].arguments, []);
            assert.ok(mockSelect.mock.callCount() > 0);

            const data = querySnapshot.docs[0].data();
            assert.strictEqual(Object.keys(data).length, 0);
          });
      });

      test('collectionGroup with collections only at root', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/query-data/queries#collection-group-query
        return db
          .collectionGroup('users')
          .where('last', '==', 'builder')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockCollectionGroup.mock.calls[0].arguments, ['users']);
            assert.strictEqual(mockGet.mock.callCount(), 1);
            assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['last', '==', 'builder']);

            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, 2);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
            });
          });
      });

      test('collectionGroup with subcollections', () => {
        const db = firebase.firestore();
        return db
          .collectionGroup('cities')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockCollectionGroup.mock.calls[0].arguments, ['cities']);
            assert.strictEqual(mockGet.mock.callCount(), 1);
            assert.strictEqual(mockWhere.mock.callCount(), 0);

            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, 4);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
            });
          });
      });

      test('collectionGroup with queried subcollections', () => {
        const db = firebase.firestore();
        return db
          .collectionGroup('cities')
          .where('country', '==', 'USA')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockCollectionGroup.mock.calls[0].arguments, ['cities']);
            assert.strictEqual(mockGet.mock.callCount(), 1);
            assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['country', '==', 'USA']);

            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, filters ? 3 : 4);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
            });
          });
      });

      test('set a city', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/manage-data/add-data#set_a_document\

        return db
          .collection('cities')
          .doc('LA')
          .set({
            name: 'Los Angeles',
            state: 'CA',
            country: 'USA',
          })
          .then(function() {
            assert.deepStrictEqual(mockSet.mock.calls[0].arguments, [{
              name: 'Los Angeles',
              state: 'CA',
              country: 'USA',
            }]);
          });
      });

      test('updating a city', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://firebase.google.com/docs/firestore/manage-data/add-data#update-data
        const washingtonRef = db.collection('cities').doc('DC');
        const now = Timestamp._fromMillis(new Date().getTime());

        mockTimestampNow.mock.mockImplementation(() => now);

        // Set the "capital" field of the city 'DC'
        return washingtonRef
          .update({
            capital: true,
          })
          .then(function(value) {
            assert.deepStrictEqual(value.updateTime, now);
            assert.deepStrictEqual(mockUpdate.mock.calls[0].arguments, [{ capital: true }]);
          });
      });

      test('batch writes', () => {
        const db = firebase.firestore();
        // Example from documentation:
        // https://cloud.google.com/firestore/docs/manage-data/transactions

        // Get a new write batch
        const batch = db.batch();

        // Set the value of 'NYC'
        const nycRef = db.collection('cities').doc('NYC');
        batch.set(nycRef, { name: 'New York City' });

        // Create new city 'CHI'
	    const chiRef = db.collection('cities').doc('CHI');
	    batch.create(chiRef, { name: 'Chicago', state: 'IL', country: 'USA' });

        // Update the population of 'SF'
        const sfRef = db.collection('cities').doc('SF');
        batch.update(sfRef, { population: 1000000 });

        // Delete the city 'LA'
        const laRef = db.collection('cities').doc('LA');
        batch.delete(laRef);

        // Commit the batch
        return batch.commit().then(function(result) {
          assert.ok(Array.isArray(result));
          assert.ok(mockBatch.mock.callCount() > 0);
          assert.deepStrictEqual(mockBatchDelete.mock.calls[0].arguments, [laRef]);
          assert.deepStrictEqual(mockBatchUpdate.mock.calls[0].arguments, [sfRef, { population: 1000000 }]);
          assert.deepStrictEqual(mockBatchSet.mock.calls[0].arguments, [nycRef, { name: 'New York City' }]);
          assert.deepStrictEqual(mockBatchCreate.mock.calls[0].arguments, [chiRef, { name: 'Chicago', state: 'IL', country: 'USA' }]);
          assert.ok(mockBatchCommit.mock.callCount() > 0);
        });
      });

      test('listCollections method does not exist', async () => {
        const db = firebase.firestore();

        // assert.throws expects function to throw.
        // If `listCollections` is undefined, `db...listCollections()` throws TypeError "is not a function".
        assert.throws(() => {
          db.collection('cities')
            .doc('LA')
            .listCollections();
        }, TypeError);
      });

      test('onSnapshot single doc', async () => {
        const db = firebase.firestore();
        const now = Timestamp._fromMillis(new Date().getTime());

        mockTimestampNow.mock.mockImplementation(() => now);

        // Example from documentation:
        // https://firebase.google.com/docs/firestore/query-data/listen

        db.collection('cities')
          .doc('LA')
          .onSnapshot(doc => {
            assert.ok('createTime' in doc);
            assert.ok('data' in doc);
            assert.strictEqual(typeof doc.data, 'function');
            assert.ok('metadata' in doc);
            assert.ok('readTime' in doc);
            assert.ok('updateTime' in doc);
            assert.deepStrictEqual(doc.readTime, now);
          });

        await flushPromises();

        assert.ok(mockOnSnapShot.mock.callCount() > 0);
        assert.strictEqual(mockQueryOnSnapshot.mock.callCount(), 0);
      });

      test('onSnapshot can work with options', async () => {
        const db = firebase.firestore();
        const now = Timestamp._fromMillis(new Date().getTime());

        mockTimestampNow.mock.mockImplementation(() => now);

        // Example from documentation:
        // https://firebase.google.com/docs/firestore/query-data/listen

        db.collection('cities')
          .doc('LA')
          .onSnapshot(
            {
              // Listen for document metadata changes
              includeMetadataChanges: true,
            },
            doc => {
              assert.ok('createTime' in doc);
              assert.ok('data' in doc);
              assert.strictEqual(typeof doc.data, 'function');
              assert.ok('metadata' in doc);
              assert.ok('readTime' in doc);
              assert.ok('updateTime' in doc);
              assert.deepStrictEqual(doc.readTime, now);
            },
          );

        await flushPromises();

        assert.ok(mockOnSnapShot.mock.callCount() > 0);
        assert.strictEqual(mockQueryOnSnapshot.mock.callCount(), 0);
      });

      test('onSnapshot with query', async () => {
        const db = firebase.firestore();

        // Example from documentation:
        // https://firebase.google.com/docs/firestore/query-data/listen

        const unsubscribe = db
          .collection('cities')
          .where('state', '==', 'CA')
          .onSnapshot(querySnapshot => {
            assert.strictEqual(typeof querySnapshot.forEach, 'function');
            assert.strictEqual(typeof querySnapshot.docChanges, 'function');
            assert.ok(Array.isArray(querySnapshot.docs));

            assert.strictEqual(typeof querySnapshot.forEach, 'function');
            assert.strictEqual(typeof querySnapshot.docChanges, 'function');
            assert.ok(Array.isArray(querySnapshot.docs));

            assert.ok(Array.isArray(querySnapshot.docChanges()));
          });

        await flushPromises();

        assert.strictEqual(unsubscribe, mockQueryOnSnapshotUnsubscribe);
        assert.ok(mockWhere.mock.callCount() > 0);
        assert.strictEqual(mockOnSnapShot.mock.callCount(), 0);
        assert.ok(mockQueryOnSnapshot.mock.callCount() > 0);
      });

      test('recursiveDelete', async () => {
        const db = firebase.firestore();
	    const citiesRef = db.collection('cities');
	  
	    db.recursiveDelete(citiesRef)

      assert.deepStrictEqual(mockRecursiveDelete.mock.calls[0].arguments, [citiesRef]);
      });

      describe('withConverter', () => {
        const converter = {
          fromFirestore: () => {},
          toFirestore: () => {},
        };

        test('single document', async () => {
          const db = firebase.firestore();

          const recordDoc = db.doc('cities/la').withConverter(converter);

          assert.deepStrictEqual(mockDoc.mock.calls[0].arguments, ['cities/la']);
          assert.deepStrictEqual(mockWithConverter.mock.calls[0].arguments, [converter]);
          assert.ok(recordDoc instanceof FakeFirestore.DocumentReference);

          const record = await recordDoc.get();
          assert.ok(mockGet.mock.callCount() > 0);
          assert.strictEqual(record.id, 'la');
          assert.strictEqual(typeof record.data, 'function');
        });

        test('single undefined document', async () => {
          const db = firebase.firestore();

          const recordDoc = db
            .collection('cities')
            .withConverter(converter)
            .doc();

          assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['cities']);
          assert.deepStrictEqual(mockWithConverter.mock.calls[0].arguments, [converter]);
          assert.ok(mockDoc.mock.callCount() > 0);
          assert.ok(recordDoc instanceof FakeFirestore.DocumentReference);

          const record = await recordDoc.get();
          assert.ok(mockGet.mock.callCount() > 0);
          assert.ok(record.id);
          assert.strictEqual(typeof record.data, 'function');
        });

        test('multiple documents', async () => {
          const db = firebase.firestore();

          const recordsCol = db.collection('cities').withConverter(converter);

          assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['cities']);
          assert.deepStrictEqual(mockWithConverter.mock.calls[0].arguments, [converter]);
          assert.ok(recordsCol instanceof FakeFirestore.CollectionReference);

          const records = await recordsCol.get();
          assert.ok(mockGet.mock.callCount() > 0);
          assert.ok(Array.isArray(records.docs));
        });
      });
    });
  });
});

