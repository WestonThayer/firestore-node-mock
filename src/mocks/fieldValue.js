import { mock } from 'node:test';

export const mockArrayUnionFieldValue = mock.fn();
export const mockArrayRemoveFieldValue = mock.fn();
export const mockDeleteFieldValue = mock.fn();
export const mockIncrementFieldValue = mock.fn();
export const mockServerTimestampFieldValue = mock.fn();

export class FieldValue {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  isEqual(other) {
    return other instanceof FieldValue && other.type === this.type && other.value === this.value;
  }

  static arrayUnion(elements = []) {
    mockArrayUnionFieldValue(...arguments);
    if (!Array.isArray(elements)) {
      elements = [elements];
    }
    return new FieldValue('arrayUnion', elements);
  }

  static arrayRemove(elements) {
    mockArrayRemoveFieldValue(...arguments);
    if (!Array.isArray(elements)) {
      elements = [elements];
    }
    return new FieldValue('arrayRemove', elements);
  }

  static increment(amount = 1) {
    mockIncrementFieldValue(...arguments);
    return new FieldValue('increment', amount);
  }

  static serverTimestamp() {
    mockServerTimestampFieldValue(...arguments);
    return new FieldValue('serverTimestamp');
  }

  static delete() {
    mockDeleteFieldValue(...arguments);
    return new FieldValue('delete');
  }
}

export const mocks = {
  mockArrayUnionFieldValue,
  mockArrayRemoveFieldValue,
  mockDeleteFieldValue,
  mockIncrementFieldValue,
  mockServerTimestampFieldValue,
};
