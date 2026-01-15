import { describe, test, beforeEach, afterEach, before } from 'node:test';
import assert from 'node:assert';
import * as FirestoreMock from '../index.js';
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
  mockQueryOnSnapshot,
  mockQueryOnSnapshotUnsubscribe,
  mockListCollections,
  mockTimestampNow,
  mockCreate,
  mockRecursiveDelete,
} from '../mocks/firestore.js';

const flushPromises = () => new Promise(setImmediate);

const libraries = [
  { library: '@google-cloud/firestore', mockFunction: 'mockGoogleCloudFirestore' },
  { library: '@react-native-firebase/firestore', mockFunction: 'mockReactNativeFirestore' },
];

libraries.forEach(({ library, mockFunction }) => {
  describe(`mocking ${library} with ${mockFunction}`, () => {
    let Firestore;

    before(() => {
      FirestoreMock[mockFunction]({
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
                ],
              },
            },
          ],
          cities: [
            { id: 'LA', name: 'Los Angeles', state: 'CA', country: 'USA' },
            { id: 'DC', name: 'Disctric of Columbia', state: 'DC', country: 'USA' },
          ],
        },
      });
    });

    beforeEach(async () => {
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
      mockQueryOnSnapshot.mock.resetCalls();
      mockListCollections.mock.resetCalls();
      mockTimestampNow.mock.resetCalls();
      mockCreate.mock.resetCalls();
      mockRecursiveDelete.mock.resetCalls();

      const mod = await import(library);
      // Depending on library structure, Firestore might be default export or named export.
      // @google-cloud/firestore exports Firestore class.
      // @react-native-firebase/firestore usually exports default as factory or namespace.
      // But mock implementation returns { Firestore: ... }.
      // So if I mock default export with that object, `mod.default.Firestore`?
      // Or if I mock named exports?
      // Check `src/mocks/googleCloudFirestore.js`: `mock.module(moduleName, { defaultExport: stub, namedExports: stub });`
      // Stub returns `{ Firestore, ... }`.
      // So `import { Firestore } from '...'` works (named export).
      // `import lib from '...'` -> `lib.Firestore`.
      
      Firestore = mod.Firestore || mod.default?.Firestore;
    });

    afterEach(() => {
        mockTimestampNow.mock.resetCalls();
        // clear implementation?
        // mockTimestampNow implementation is persistent if set via mockReturnValue (mockImplementation).
        // `mockTimestampNow` logic in `timestamp.js` is: `return mockTimestampNow(...) || Timestamp.fromDate(...)`.
        // If I mocked implementation to return fixed value, I should restore it?
        // `mock.fn` doesn't have restore. I can set implementation to undefined?
        mockTimestampNow.mock.mockImplementation(() => undefined);
    });

    test('We can start an application', async () => {
      const firestore = new Firestore();
      firestore.settings({ ignoreUndefinedProperties: true });
      assert.deepStrictEqual(mockSettings.mock.calls[0].arguments, [{ ignoreUndefinedProperties: true }]);
    });

    describe('Examples from documentation', () => {
      test('add a user', () => {
        const firestore = new Firestore();

        return firestore
          .collection('users')
          .add({
            first: 'Ada',
            last: 'Lovelace',
            born: 1815,
          })
          .then(function(docRef) {
            assert.ok(mockAdd.mock.callCount() > 0);
            assert.ok(docRef.id);
          });
      });

      test('get all users', () => {
        const firestore = new Firestore();

        return firestore
          .collection('users')
          .get()
          .then(querySnapshot => {
            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, 2);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
            });
          });
      });

      test('select specific fields only', () => {
        const firestore = new Firestore();

        return firestore
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
        const firestore = new Firestore();

        return firestore
          .collection('users')
          .select()
          .get()
          .then(querySnapshot => {
            // assert.deepStrictEqual(mockSelect.mock.calls[0].arguments, []); // args might be undefined or empty array
            // check call count
            assert.ok(mockSelect.mock.callCount() > 0);

            const data = querySnapshot.docs[0].data();
            assert.strictEqual(Object.keys(data).length, 0);
          });
      });

      test('collectionGroup at root', () => {
        const firestore = new Firestore();

        return firestore
          .collectionGroup('users')
          .where('last', '==', 'builder')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockCollectionGroup.mock.calls[0].arguments, ['users']);
            assert.ok(mockGet.mock.callCount() > 0);
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
        mockGet.mock.resetCalls();
        mockWhere.mock.resetCalls();
        const firestore = new Firestore();

        return firestore
          .collectionGroup('cities')
          .where('country', '==', 'USA')
          .get()
          .then(querySnapshot => {
            assert.deepStrictEqual(mockCollectionGroup.mock.calls[0].arguments, ['cities']);
            assert.strictEqual(mockGet.mock.callCount(), 1);
            assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['country', '==', 'USA']);

            assert.ok(querySnapshot.forEach);
            assert.strictEqual(querySnapshot.docs.length, 3);
            assert.strictEqual(querySnapshot.size, querySnapshot.docs.length);

            querySnapshot.forEach(doc => {
              assert.strictEqual(doc.exists, true);
              assert.ok(doc.data());
            });
          });
      });

      test('set a city', () => {
        const firestore = new Firestore();

        return firestore
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

      test('create a city', () => {
        const firestore = new Firestore();

        return firestore
          .collection('cities')
          .doc('LA')
          .create({
            name: 'Los Angeles',
            state: 'CA',
            country: 'USA',
          })
          .then(function() {
            assert.deepStrictEqual(mockCreate.mock.calls[0].arguments, [{
              name: 'Los Angeles',
              state: 'CA',
              country: 'USA',
            }]);
          });
      });

      test('updating a city', () => {
        const firestore = new Firestore();
        const now = Timestamp._fromMillis(new Date().getTime());
        const washingtonRef = firestore.collection('cities').doc('DC');

        mockTimestampNow.mock.mockImplementation(() => now);

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
        const firestore = new Firestore();

        // Get a new write batch
        const batch = firestore.batch();

        // Set the value of 'NYC'
        const nycRef = firestore.collection('cities').doc('NYC');
        batch.set(nycRef, { name: 'New York City' });

        // Create new city 'CHI'
	      const chiRef = firestore.collection('cities').doc('CHI');
	      batch.create(chiRef, { name: 'Chicago', state: 'IL', country: 'USA' });

        // Update the population of 'SF'
        const sfRef = firestore.collection('cities').doc('SF');
        batch.update(sfRef, { population: 1000000 });

        // Delete the city 'LA'
        const laRef = firestore.collection('cities').doc('LA');
        batch.delete(laRef);

        // Commit the batch
        return batch.commit().then(function() {
          assert.ok(mockBatch.mock.callCount() > 0);
          assert.deepStrictEqual(mockBatchDelete.mock.calls[0].arguments, [laRef]);
          assert.deepStrictEqual(mockBatchUpdate.mock.calls[0].arguments, [sfRef, { population: 1000000 }]);
          assert.deepStrictEqual(mockBatchSet.mock.calls[0].arguments, [nycRef, { name: 'New York City' }]);
          assert.deepStrictEqual(mockBatchCreate.mock.calls[0].arguments, [chiRef, { name: 'Chicago', state: 'IL', country: 'USA' }]);
          assert.ok(mockBatchCommit.mock.callCount() > 0);
        });
      });

      test('listCollections returns a promise', async () => {
        const firestore = new Firestore();

        const listCollectionsPromise = firestore.collection('cities').doc('LA').listCollections();

        assert.ok(listCollectionsPromise instanceof Promise);
      });

      test('listCollections resolves with child collections', async () => {
        const firestore = new Firestore();

        const result = await firestore.collection('users').doc('123abc').listCollections();

        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 1);
        assert.ok(result[0] instanceof Firestore.CollectionReference);
        assert.strictEqual(result[0].id, 'cities');
      });

      test('listCollections resolves with empty array if there are no collections in document', async () => {
        const firestore = new Firestore();

        const result = await firestore.collection('users').doc('abc123').listCollections();

        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 0);
      });

      test('listCollections calls mockListCollections', async () => {
        const firestore = new Firestore();

        await firestore.collection('users').doc('abc123').listCollections();

        assert.ok(mockListCollections.mock.callCount() > 0);
      });

      test('onSnapshot single doc', async () => {
        const firestore = new Firestore();
        const now = Timestamp._fromMillis(new Date().getTime());

        mockTimestampNow.mock.mockImplementation(() => now);

        firestore
          .collection('cities')
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
      });

      test('onSnapshot can work with options', async () => {
        const firestore = new Firestore();
        const now = Timestamp._fromMillis(new Date().getTime());

        mockTimestampNow.mock.mockImplementation(() => now);

        firestore
          .collection('cities')
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
      });

      test('onSnapshot with query', async () => {
        const firestore = new Firestore();

        const unsubscribe = firestore
          .collection('cities')
          .where('state', '==', 'CA')
          .onSnapshot(querySnapshot => {
            assert.strictEqual(typeof querySnapshot.forEach, 'function');
            assert.ok('docChanges' in querySnapshot);
            assert.ok(Array.isArray(querySnapshot.docs));

            assert.strictEqual(typeof querySnapshot.forEach, 'function');
            assert.strictEqual(typeof querySnapshot.docChanges, 'function');
            assert.ok(Array.isArray(querySnapshot.docs));

            assert.ok(Array.isArray(querySnapshot.docChanges()));
          });

        await flushPromises();

        assert.strictEqual(unsubscribe, mockQueryOnSnapshotUnsubscribe);
        assert.ok(mockWhere.mock.callCount() > 0);
        assert.ok(mockQueryOnSnapshot.mock.callCount() > 0);
      });

      test('recursiveDelete', async () => {
        const firestore = new Firestore();
	      const citiesRef = firestore.collection('cities');
	  
	      firestore.recursiveDelete(citiesRef)

        assert.deepStrictEqual(mockRecursiveDelete.mock.calls[0].arguments, [citiesRef]);
      });
    });
  });
});
