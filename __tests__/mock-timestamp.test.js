import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FakeFirestore } from '../index.js';
import {
  mockTimestampToDate,
  mockTimestampToMillis,
  mockTimestampNow,
} from '../mocks/firestore.js';
import admin from 'firebase-admin';
const ref = admin.firestore.Timestamp;

describe('Timestamp mock', () => {
  beforeEach(() => {
      mockTimestampToDate.mock.resetCalls();
      mockTimestampToMillis.mock.resetCalls();
      mockTimestampNow.mock.resetCalls();
  });

  test('it is equal to itself', () => {
    const timestamp = new FakeFirestore.Timestamp(500, 20);
    assert.strictEqual(timestamp.isEqual(timestamp), true);
  });

  test('it is equal to a separate instance', () => {
    const timestamp = new FakeFirestore.Timestamp(500, 20);
    const other = new FakeFirestore.Timestamp(500, 20);
    assert.strictEqual(timestamp.isEqual(other), true);
  });

  test('it is not equal to an instance whose properties differ', () => {
    const timestamp = new FakeFirestore.Timestamp(500, 20);
    const diffSeconds = new FakeFirestore.Timestamp(550, 20);
    const diffNano = new FakeFirestore.Timestamp(500, 40);
    const diffAll = new FakeFirestore.Timestamp(550, 40);
    assert.strictEqual(timestamp.isEqual(diffSeconds), false);
    assert.strictEqual(timestamp.isEqual(diffNano), false);
    assert.strictEqual(timestamp.isEqual(diffAll), false);
  });

  test('it converts itself roughly to a Date representation', () => {
    // Since this is a mock (and I'm bad with time maths) we don't expect nanosecond accuracy
    const timestamp = new FakeFirestore.Timestamp(40, 0);
    assert.ok(timestamp.toDate() instanceof Date);
    assert.strictEqual(timestamp.toDate().getSeconds(), 40);
    assert.ok(mockTimestampToDate.mock.callCount() > 0);
  });

  test('it allows clients to override the Date representation', () => {
    const timestamp = new FakeFirestore.Timestamp(40, 0);
    const now = new Date();
    mockTimestampToDate.mock.mockImplementationOnce(() => now);
    assert.strictEqual(timestamp.toDate(), now);
    assert.strictEqual(timestamp.toDate().getSeconds(), 40); // second call should be the original
  });

  test('it converts itself roughly to millisecond representation', () => {
    // The mock only returns 0, but it calls mockTimestampToMillis first, returning its result if defined
    const timestamp = new FakeFirestore.Timestamp(40, 80);
    const now = new Date();
    mockTimestampToMillis.mock.mockImplementationOnce(() => now.getMilliseconds());
    assert.strictEqual(timestamp.toMillis(), now.getMilliseconds());
    assert.strictEqual(timestamp.toMillis(), 40000); // second call should be the original (40s)
    assert.strictEqual(mockTimestampToMillis.mock.callCount(), 2);
  });

  test('it creates an instance roughly from a Date representation', () => {
    const now = new Date();
    const timestamp = FakeFirestore.Timestamp.fromDate(now);
    assert.notStrictEqual(timestamp, undefined);
    assert.ok(timestamp instanceof FakeFirestore.Timestamp);
    assert.strictEqual(timestamp.toDate().getTime(), now.getTime());
  });

  test('it creates an instance roughly from a millisecond representation', () => {
    const date = new Date(0);
    date.setMilliseconds(54000);
    const timestamp = FakeFirestore.Timestamp.fromMillis(54000);
    assert.notStrictEqual(timestamp, undefined);
    assert.ok(timestamp instanceof FakeFirestore.Timestamp);
    assert.strictEqual(timestamp.seconds, date.getSeconds());
  });

  test('Timestamp.now reports calls to mockTimestampNow', () => {
    assert.strictEqual(mockTimestampNow.mock.callCount(), 0);
    const timestamp = FakeFirestore.Timestamp.now();
    assert.ok(timestamp instanceof FakeFirestore.Timestamp);
    assert.ok(mockTimestampNow.mock.callCount() > 0);
  });

  test('Timestamp.now can be mocked', () => {
    mockTimestampNow.mock.mockImplementationOnce(() => 'Success!');
    const timestamp = FakeFirestore.Timestamp.now();
    assert.strictEqual(timestamp, 'Success!');
  });

  test('it handles negative seconds', () => {
    // Since this is a mock (and I'm bad with time maths) we don't expect nanosecond accuracy
    const timestamp = FakeFirestore.Timestamp.fromMillis(-54001);
    const rts = ref.fromMillis(-54001);
    assert.strictEqual(timestamp.seconds, rts.seconds);
    assert.strictEqual(timestamp.nanoseconds, rts.nanoseconds);
  });
});
