import { Mock } from 'node:test';

export class Timestamp {
  constructor(seconds: number, nanoseconds: number);

  isEqual(other: Timestamp): boolean;
  toDate(): Date;
  toMillis(): number;
  valueOf(): string;

  static fromDate(date: Date): Timestamp;
  static fromMillis(millis: number): Timestamp;
  static now(): Timestamp;
}

export const mocks: {
  mockTimestampToDate: Mock<any>;
  mockTimestampToMillis: Mock<any>;
  mockTimestampFromDate: Mock<any>;
  mockTimestampFromMillis: Mock<any>;
  mockTimestampNow: Mock<any>;
};
