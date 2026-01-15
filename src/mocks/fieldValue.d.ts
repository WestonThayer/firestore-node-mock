import { Mock } from 'node:test';

type FieldValueType = 'arrayUnion' | 'arrayRemove' | 'increment' | 'serverTimestamp' | 'delete';

export class FieldValue {
  constructor(type: FieldValueType, value: unknown);

  isEqual(other: FieldValue): boolean;

  static arrayUnion(elements?: Array<unknown>): FieldValue;
  static arrayRemove(elements: Array<unknown>): FieldValue;
  static increment(amount?: number): FieldValue;
  static serverTimestamp(): FieldValue;
  static delete(): FieldValue;
}

export const mocks: {
  mockArrayUnionFieldValue: Mock<any>;
  mockArrayRemoveFieldValue: Mock<any>;
  mockDeleteFieldValue: Mock<any>;
  mockIncrementFieldValue: Mock<any>;
  mockServerTimestampFieldValue: Mock<any>;
};
