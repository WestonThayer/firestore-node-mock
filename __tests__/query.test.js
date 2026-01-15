import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { mockFirebase } from '../index.js';
import {
  mockCollection,
  mockDoc,
  mockGet,
  mockWhere,
  mockOffset,
  FakeFirestore,
} from '../mocks/firestore.js';

mockFirebase(
  {
    database: {
      animals: [
        {
          id: 'monkey',
          name: 'monkey',
          type: 'mammal',
          legCount: 2,
          food: ['banana', 'mango'],
          foodCount: 1,
          foodEaten: [500, 20],
          createdAt: new FakeFirestore.Timestamp(1628939119, 0),
        },
        {
          id: 'elephant',
          name: 'elephant',
          type: 'mammal',
          legCount: 4,
          food: ['banana', 'peanut'],
          foodCount: 0,
          foodEaten: [0, 500],
          createdAt: new FakeFirestore.Timestamp(1628939129, 0),
        },
        {
          id: 'chicken',
          name: 'chicken',
          type: 'bird',
          legCount: 2,
          food: ['leaf', 'nut', 'ant'],
          foodCount: 4,
          foodEaten: [80, 20, 16],
          createdAt: new FakeFirestore.Timestamp(1628939139, 0),
          _collections: {
            foodSchedule: [
              {
                id: 'nut',
                interval: 'whenever',
              },
              {
                id: 'leaf',
                interval: 'hourly',
              },
            ],
          },
        },
        {
          id: 'ant',
          name: 'ant',
          type: 'insect',
          legCount: 6,
          food: ['leaf', 'bread'],
          foodCount: 2,
          foodEaten: [80, 12],
          createdAt: new FakeFirestore.Timestamp(1628939149, 0),
          _collections: {
            foodSchedule: [
              {
                id: 'leaf',
                interval: 'daily',
              },
              {
                id: 'peanut',
                interval: 'weekly',
              },
            ],
          },
        },
        {
          id: 'worm',
          name: 'worm',
          legCount: null,
        },
        {
          id: 'pogo-stick',
          name: 'pogo-stick',
          food: false,
        },
        {
          id: 'cow',
          name: 'cow',
          appearance: {
            color: 'brown',
            size: 'large',
          },
        },
      ],
      foodSchedule: [
        { id: 'ants', interval: 'daily' },
        { id: 'cows', interval: 'twice daily' },
      ],
      nested: [
        {
          id: 'collections',
          _collections: {
            have: [
              {
                id: 'lots',
                _collections: {
                  of: [
                    {
                      id: 'applications',
                      _collections: {
                        foodSchedule: [
                          {
                            id: 'layer4_a',
                            interval: 'daily',
                          },
                          {
                            id: 'layer4_b',
                            interval: 'weekly',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    currentUser: { uid: 'homer-user' },
  },
  { simulateQueryFilters: true }
);

const { default: firebase } = await import('firebase');
firebase.initializeApp({
  apiKey: '### FIREBASE API KEY ###',
  authDomain: '### FIREBASE AUTH DOMAIN ###',
  projectId: '### CLOUD FIRESTORE PROJECT ID ###',
});

const db = firebase.firestore();

describe('Queries', () => {
  beforeEach(() => {
    mockCollection.mock.resetCalls();
    mockDoc.mock.resetCalls();
    mockGet.mock.resetCalls();
    mockWhere.mock.resetCalls();
    mockOffset.mock.resetCalls();
  });

  test('it can query a single document', async () => {
    const monkey = await db
      .collection('animals')
      .doc('monkey')
      .get();

    assert.strictEqual(monkey.exists, true);
    assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['animals']);
    assert.deepStrictEqual(mockDoc.mock.calls[0].arguments, ['monkey']);
    assert.ok(mockGet.mock.callCount() > 0);
  });

  test('it can query null values', async () => {
    const noLegs = await db
      .collection('animals')
      .where('legCount', '==', null)
      .get();

    assert.strictEqual(noLegs.size, 1);
    const worm = noLegs.docs[0];
    assert.notStrictEqual(worm, undefined);
    assert.strictEqual(worm.id, 'worm');
  });

  test('it can query false values', async () => {
    const noFood = await db
      .collection('animals')
      .where('food', '==', false)
      .get();

    assert.strictEqual(noFood.size, 1);
    const pogoStick = noFood.docs[0];
    assert.notStrictEqual(pogoStick, undefined);
    assert.strictEqual(pogoStick.id, 'pogo-stick');
  });

  test('it can query nested values', async () => {
    const brownColor = await db
      .collection('animals')
      .where('appearance.color', '==', 'brown')
      .get();

    assert.strictEqual(brownColor.size, 1);
    const cow = brownColor.docs[0];
    assert.notStrictEqual(cow, undefined);
    assert.strictEqual(cow.id, 'cow');
  });

  test('it can select nested values', async () => {
    const res = await db
      .collection('animals')
      .where('id', '==', 'cow')
      .select('appearance.color')
      .get();

    assert.strictEqual(res.size, 1);
    const cow = res.docs[0].data();
    assert.notStrictEqual(cow, undefined);
    assert.deepStrictEqual(cow.appearance, { color: 'brown' });
  });

  test('it can select and get nested values', async () => {
    const res = await db
      .collection('animals')
      .where('id', '==', 'cow')
      .select('appearance.color')
      .get();

    assert.strictEqual(res.size, 1);
    const appearance = res.docs[0].get('appearance');
    assert.deepStrictEqual(appearance, { color: 'brown' });
    const color = res.docs[0].get('appearance.color');
    assert.strictEqual(color, 'brown');
  });

  test('it can handle missing nested values', async () => {
    const res = await db
      .collection('animals')
      .where('id', '==', 'cow')
      .select('size.height.shoulder')
      .get();

    assert.strictEqual(res.size, 1);
    const data = res.docs[0].data();
    assert.deepStrictEqual(data.size, {});
  });

  test('it can select many nested values', async () => {
    const res = await db
      .collection('animals')
      .where('id', '==', 'cow')
      .select('appearance.color', 'appearance.size')
      .get();

    assert.strictEqual(res.size, 1);
    const cow = res.docs[0].data();
    assert.notStrictEqual(cow, undefined);
    assert.deepStrictEqual(cow.appearance, {color: 'brown', size: 'large'});
  });

  test('it can query date values for equality', async () => {
    const elephant = await db
      .collection('animals')
      .where('createdAt', '==', new Date(1628939129 * 1000))
      .get();

    assert.strictEqual(elephant.size, 1);
    assert.strictEqual(elephant.docs[0].id, 'elephant');
  });

  test('it can query date values for greater than condition', async () => {
    const res = await db
      .collection('animals')
      .where('createdAt', '>', new Date(1628939129 * 1000))
      .get();

    assert.strictEqual(res.size, 2);
    assert.strictEqual(res.docs[0].id, 'chicken');
    assert.strictEqual(res.docs[1].id, 'ant');
  });

  test('it can query multiple documents', async () => {
    const animals = await db
      .collection('animals')
      .where('type', '==', 'mammal')
      .get();

    assert.ok(Array.isArray(animals.docs));
    assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['animals']);

    // Make sure that the filter behaves appropriately
    assert.strictEqual(animals.docs.length, 2);

    // Make sure that forEach works properly
    assert.strictEqual(typeof animals.forEach, 'function');
    animals.forEach(doc => {
      assert.strictEqual(doc.exists, true);
    });

    // Check where call args (mockWhere called multiple times for other tests maybe, but reset in beforeEach)
    assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['type', '==', 'mammal']);
    assert.ok(mockGet.mock.callCount() > 0);
    assert.strictEqual(animals.size, 2); // Returns 2 of 4 documents
  });

  test('it can filter firestore equality queries in subcollections', async () => {
    const antSchedule = await db
      .collection('animals')
      .doc('ant')
      .collection('foodSchedule')
      .where('interval', '==', 'daily')
      .get();

    // mockCollection called 'animals' then 'foodSchedule'
    const colCalls = mockCollection.mock.calls.map(c => c.arguments[0]);
    assert.ok(colCalls.includes('animals'));
    assert.ok(colCalls.includes('foodSchedule'));
    assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['interval', '==', 'daily']);
    assert.ok(mockGet.mock.callCount() > 0);
    assert.ok(Array.isArray(antSchedule.docs));
    assert.strictEqual(antSchedule.size, 1); // Returns 1 of 2 documents
  });

  test('in a transaction, it can filter firestore equality queries in subcollections', async () => {
    // mockGet.mockReset(); // reset in beforeEach

    const antSchedule = db
      .collection('animals')
      .doc('ant')
      .collection('foodSchedule')
      .where('interval', '==', 'daily');

    await db.runTransaction(async transaction => {
      const scheduleItems = await transaction.get(antSchedule);
      // mockCollection called 'animals' then 'foodSchedule'
      const colCalls = mockCollection.mock.calls.map(c => c.arguments[0]);
      assert.ok(colCalls.includes('animals'));
      assert.ok(colCalls.includes('foodSchedule'));
      assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['interval', '==', 'daily']);
      
      // mockGet should NOT be called directly, transaction.get uses transaction mocks?
      // Wait, transaction.get calls ref.get()? No, transaction logic.
      // src/mocks/transaction.js: get(ref) { ... return Promise.resolve(ref._get()); }
      // It calls ref._get(). ref.get() calls mockGet. ref._get() doesn't call mockGet.
      // So mockGet should NOT be called.
      assert.strictEqual(mockGet.mock.callCount(), 0);
      assert.ok(Array.isArray(scheduleItems.docs));
      assert.strictEqual(scheduleItems.size, 1); // Returns 1 of 2 documents
    });
  });

  test('it can filter firestore comparison queries in subcollections', async () => {
    const chickenSchedule = db
      .collection('animals')
      .doc('chicken')
      .collection('foodSchedule')
      .where('interval', '<=', 'hourly'); // should have 1 result

    const scheduleItems = await chickenSchedule.get();
    assert.ok(Array.isArray(scheduleItems.docs));
    assert.strictEqual(scheduleItems.size, 1); // Returns 1 document
    assert.ok(scheduleItems.docs[0].ref instanceof FakeFirestore.DocumentReference);
    assert.strictEqual(scheduleItems.docs[0].id, 'leaf');
    assert.strictEqual(scheduleItems.docs[0].data().interval, 'hourly');
    assert.strictEqual(scheduleItems.docs[0].ref.path, 'animals/chicken/foodSchedule/leaf');
  });

  test('in a transaction, it can filter firestore comparison queries in subcollections', async () => {
    const chickenSchedule = db
      .collection('animals')
      .doc('chicken')
      .collection('foodSchedule')
      .where('interval', '<=', 'hourly'); // should have 1 result

    await db.runTransaction(async transaction => {
      const scheduleItems = await transaction.get(chickenSchedule);
      assert.ok(Array.isArray(scheduleItems.docs));
      assert.strictEqual(scheduleItems.size, 1); // Returns 1 document
      assert.ok(scheduleItems.docs[0].ref instanceof FakeFirestore.DocumentReference);
      assert.strictEqual(scheduleItems.docs[0].id, 'leaf');
      assert.strictEqual(scheduleItems.docs[0].data().interval, 'hourly');
      assert.strictEqual(scheduleItems.docs[0].ref.path, 'animals/chicken/foodSchedule/leaf');
    });
  });

  test('it can query collection groups', async () => {
    const allSchedules = await db.collectionGroup('foodSchedule').get();

    assert.strictEqual(allSchedules.size, 8); // Returns all 8
    const paths = allSchedules.docs.map(doc => doc.ref.path).sort();
    const expectedPaths = [
      'nested/collections/have/lots/of/applications/foodSchedule/layer4_a',
      'nested/collections/have/lots/of/applications/foodSchedule/layer4_b',
      'animals/ant/foodSchedule/leaf',
      'animals/ant/foodSchedule/peanut',
      'animals/chicken/foodSchedule/leaf',
      'animals/chicken/foodSchedule/nut',
      'foodSchedule/ants',
      'foodSchedule/cows',
    ].sort();
    assert.deepStrictEqual(paths, expectedPaths);
  });

  test('it returns the same instance from query methods', () => {
    const ref = db.collection('animals');
    const notThisRef = db.collection('elsewise');
    assert.strictEqual(ref.where('type', '==', 'mammal'), ref);
    assert.notStrictEqual(ref.where('type', '==', 'mammal'), notThisRef);
    assert.strictEqual(ref.limit(1), ref);
    assert.notStrictEqual(ref.limit(1), notThisRef);
    assert.strictEqual(ref.orderBy('type'), ref);
    assert.notStrictEqual(ref.orderBy('type'), notThisRef);
    assert.strictEqual(ref.startAfter(null), ref);
    assert.notStrictEqual(ref.startAfter(null), notThisRef);
    assert.strictEqual(ref.startAt(null), ref);
    assert.notStrictEqual(ref.startAt(null), notThisRef);
  });

  test('it returns a Query from query methods', () => {
    const ref = db.collection('animals');
    assert.ok(ref.where('type', '==', 'mammal') instanceof FakeFirestore.Query);
    assert.ok(ref.limit(1) instanceof FakeFirestore.Query);
    assert.ok(ref.orderBy('type') instanceof FakeFirestore.Query);
    assert.ok(ref.startAfter(null) instanceof FakeFirestore.Query);
    assert.ok(ref.startAt(null) instanceof FakeFirestore.Query);
  });

  test('it throws an error when comparing to null', () => {
    assert.throws(() => db.collection('animals').where('legCount', '>', null));
    assert.throws(() => db.collection('animals').where('legCount', '>=', null));
    assert.throws(() => db.collection('animals').where('legCount', '<', null));
    assert.throws(() => db.collection('animals').where('legCount', '<=', null));
    assert.throws(() => db.collection('animals').where('legCount', 'array-contains', null));
    assert.throws(() => db.collection('animals').where('legCount', 'array-contains-any', null));
    assert.throws(() => db.collection('animals').where('legCount', 'in', null));
    assert.throws(() => db.collection('animals').where('legCount', 'not-in', null));
  });

  test('it allows equality comparisons with null', () => {
    assert.doesNotThrow(() => db.collection('animals').where('legCount', '==', null));
    assert.doesNotThrow(() => db.collection('animals').where('legCount', '!=', null));
  });

  test('it permits mocking the results of a where clause', async () => {
    const ref = db.collection('animals');

    let result = await ref.where('type', '==', 'mammal').get();
    assert.strictEqual(result.docs.length, 2);

    // There's got to be a better way to mock like this, but at least it works.
    mockWhere.mock.mockImplementationOnce(() => ({
      get() {
        return Promise.resolve({
          docs: [
            { id: 'monkey', name: 'monkey', type: 'mammal' },
            { id: 'elephant', name: 'elephant', type: 'mammal' },
          ],
        });
      },
    }));
    result = await ref.where('type', '==', 'mammal').get();
    assert.strictEqual(result.docs.length, 2);
  });

  test('it can offset query', async () => {
    const firstTwoMammals = await db
      .collection('animals')
      .where('type', '==', 'mammal')
      .offset(2)
      .get();

    assert.ok(Array.isArray(firstTwoMammals.docs));
    assert.deepStrictEqual(mockWhere.mock.calls[0].arguments, ['type', '==', 'mammal']);
    assert.deepStrictEqual(mockCollection.mock.calls[0].arguments, ['animals']);
    assert.ok(mockGet.mock.callCount() > 0);
    assert.deepStrictEqual(mockOffset.mock.calls[0].arguments, [2]);
  });

  describe('Query Operations', () => {
    const queryCases = [
      { comp: '==', value: 2, count: 2 },
      { comp: '==', value: 4, count: 1 },
      { comp: '==', value: 6, count: 1 },
      { comp: '==', value: 7, count: 0 },
      { comp: '!=', value: 7, count: 5 },
      { comp: '!=', value: 4, count: 4 },
      { comp: '>', value: 1000, count: 0 },
      { comp: '>', value: 1, count: 4 },
      { comp: '>', value: 6, count: 0 },
      { comp: '>=', value: 1000, count: 0 },
      { comp: '>=', value: 6, count: 1 },
      { comp: '>=', value: 0, count: 4 },
      { comp: '<', value: -10000, count: 0 },
      { comp: '<', value: 10000, count: 4 },
      { comp: '<', value: 2, count: 0 },
      { comp: '<', value: 6, count: 3 },
      { comp: '<=', value: -10000, count: 0 },
      { comp: '<=', value: 10000, count: 4 },
      { comp: '<=', value: 2, count: 2 },
      { comp: '<=', value: 6, count: 4 },
      { comp: 'in', value: [6, 2], count: 3 },
      { comp: 'not-in', value: [6, 2], count: 2 },
      { comp: 'not-in', value: [4], count: 4 },
      { comp: 'not-in', value: [7], count: 5 },
    ];
    queryCases.forEach(({ comp, value, count }) => {
      test(`it performs '${comp}' queries on number values (${count} doc(s) where legCount ${comp} ${value})`, async () => {
        const results = await db.collection('animals').where('legCount', comp, value).get();
        assert.strictEqual(results.size, count);
      });
    });

    const queryCasesZero = [
      { comp: '==', value: 0, count: 1 },
      { comp: '==', value: 1, count: 1 },
      { comp: '==', value: 2, count: 1 },
      { comp: '==', value: 4, count: 1 },
      { comp: '==', value: 6, count: 0 },
      { comp: '>', value: -1, count: 4 },
      { comp: '>', value: 0, count: 3 },
      { comp: '>', value: 1, count: 2 },
      { comp: '>', value: 4, count: 0 },
      { comp: '>=', value: 6, count: 0 },
      { comp: '>=', value: 4, count: 1 },
      { comp: '>=', value: 0, count: 4 },
      { comp: '<', value: 2, count: 2 },
      { comp: '<', value: 6, count: 4 },
      { comp: '<=', value: 2, count: 3 },
      { comp: '<=', value: 6, count: 4 },
      { comp: 'in', value: [2, 0], count: 2 },
      { comp: 'not-in', value: [2, 0], count: 2 },
    ];
    queryCasesZero.forEach(({ comp, value, count }) => {
      test(`it performs '${comp}' queries on number values that may be zero (${count} doc(s) where foodCount ${comp} ${value})`, async () => {
        const results = await db.collection('animals').where('foodCount', comp, value).get();
        assert.strictEqual(results.size, count);
      });
    });

    const queryCasesString = [
      { comp: '==', value: 'mammal', count: 2 },
      { comp: '==', value: 'bird', count: 1 },
      { comp: '==', value: 'fish', count: 0 },
      { comp: '!=', value: 'bird', count: 3 },
      { comp: '!=', value: 'fish', count: 4 },
      { comp: '>', value: 'insect', count: 2 },
      { comp: '>', value: 'z', count: 0 },
      { comp: '>=', value: 'mammal', count: 2 },
      { comp: '>=', value: 'insect', count: 3 },
      { comp: '<', value: 'bird', count: 0 },
      { comp: '<', value: 'mammal', count: 2 },
      { comp: '<=', value: 'mammal', count: 4 },
      { comp: '<=', value: 'bird', count: 1 },
      { comp: '<=', value: 'a', count: 0 },
      { comp: 'in', value: ['a', 'bird', 'mammal'], count: 3 },
      { comp: 'not-in', value: ['a', 'bird', 'mammal'], count: 1 },
    ];
    queryCasesString.forEach(({ comp, value, count }) => {
      test(`it performs '${comp}' queries on string values (${count} doc(s) where type ${comp} '${value}')`, async () => {
        const results = await db.collection('animals').where('type', comp, value).get();
        assert.strictEqual(results.size, count);
      });
    });

    const queryCasesArray = [
      { comp: '==', value: ['banana', 'mango'], count: 1 },
      { comp: '==', value: ['mango', 'banana'], count: 0 },
      { comp: '==', value: ['banana', 'peanut'], count: 1 },
      { comp: '!=', value: ['banana', 'peanut'], count: 4 },
      { comp: 'array-contains', value: 'banana', count: 2 },
      { comp: 'array-contains', value: 'leaf', count: 2 },
      { comp: 'array-contains', value: 'bread', count: 1 },
      { comp: 'array-contains-any', value: ['banana', 'mango', 'peanut'], count: 2 },
    ];
    queryCasesArray.forEach(({ comp, value, count }) => {
      test(`it performs '${comp}' queries on array values (${count} doc(s) where food ${comp} '${value}')`, async () => {
        const results = await db.collection('animals').where('food', comp, value).get();
        assert.strictEqual(results.size, count);
      });
    });

    const queryCasesArrayZero = [
      { comp: '==', value: [500, 20], count: 1 },
      { comp: '==', value: [20, 500], count: 0 },
      { comp: '==', value: [0, 500], count: 1 },
      { comp: '!=', value: [20, 500], count: 4 },
      { comp: 'array-contains', value: 500, count: 2 },
      { comp: 'array-contains', value: 80, count: 2 },
      { comp: 'array-contains', value: 12, count: 1 },
      { comp: 'array-contains', value: 0, count: 1 },
      { comp: 'array-contains-any', value: [0, 11, 500], count: 2 },
    ];
    queryCasesArrayZero.forEach(({ comp, value, count }) => {
      test(`it performs '${comp}' queries on array values that may be zero (${count} doc(s) where foodEaten ${comp} '${value}')`, async () => {
        const results = await db.collection('animals').where('foodEaten', comp, value).get();
        assert.strictEqual(results.size, count);
      });
    });
  });
});
