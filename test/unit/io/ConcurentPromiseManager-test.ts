import type { IOperation, IResult } from '../../../lib/io/ConcurentPromiseManager';
import { ConcurentPromiseManager } from '../../../lib/io/ConcurentPromiseManager';

Object.defineProperty(globalThis, 'performance', {
  writable: true,
});

globalThis.performance = <any>{ now: jest.fn() };
jest.spyOn(globalThis.performance, 'now').mockImplementation();

describe('ConcurentPromiseManager', () => {
  describe('push', () => {
    it('should directly get the result with a pool size of 1', async () => {
      const expectedResult = true;
      const expectedLabel = 'test';
      const poolSize = 1;

      const expectedOutputedResult: IResult<boolean> = {
        result: expectedResult,
        label: expectedLabel,
        startingTime: 1,
        endingTime: 2,
      };
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);

      const manager = new ConcurentPromiseManager(poolSize, []);
      await manager.push(expectedLabel, new Promise((resolve) => {
        resolve(expectedResult);
      }));

      expect(manager.size()).toBe(0);
      expect(manager.results).toHaveLength(1);
      expect(manager.results[0]).toStrictEqual(expectedOutputedResult);
    });

    it('should reject when the promise is rejected', async () => {
      const expectedLabel = 'test';
      const poolSize = 1;

      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);

      const manager = new ConcurentPromiseManager(poolSize, []);

      // eslint-disable-next-line ts/no-floating-promises, jest/valid-expect
      expect(manager.push(expectedLabel, new Promise((resolve, reject) => {
        reject(new Error("error"));
      }))).rejects.toStrictEqual(new Error('error'));
    });

    it('should not get the result with a pool size of 2', async () => {
      const expectedResult = true;
      const expectedLabel = 'test';
      const poolSize = 2;

      const manager = new ConcurentPromiseManager(poolSize, []);
      await manager.push(expectedLabel, new Promise((resolve) => {
        resolve(expectedResult);
      }));

      expect(manager.size()).toBe(1);
      expect(manager.results).toHaveLength(0);
    });

    it('should get a result when a the number of operation is equal to the poll size', async () => {
      const poolSize = 6;

      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(6)
        .mockReturnValueOnce(7);

      const manager = new ConcurentPromiseManager(poolSize, []);
      for (let i = 1; i < poolSize; i++) {
        await manager.push(String(i), new Promise((resolve) => {
          resolve(i);
        }));
        expect(manager.size()).toBe(i);
        expect(manager.results).toHaveLength(0);
      }
      await manager.push(String(poolSize), new Promise((resolve) => {
        resolve(poolSize);
      }));
      expect(manager.size()).toBe(poolSize - 1);

      const expectedOutputedResult: IResult<number> = {
        result: 1,
        label: '1',
        startingTime: 1,
        endingTime: 7,
      };

      expect(manager.results).toHaveLength(1);
      expect(manager.results[0]).toStrictEqual(expectedOutputedResult);
    });

    it('should get multiple results when a the number of operation is equal to the poll size', async () => {
      const poolSize = 3;

      jest.spyOn(performance, 'now')
        .mockReturnValue(1);

      const manager = new ConcurentPromiseManager(poolSize, []);

      await manager.push(String(1), new Promise((resolve) => {
        resolve(1);
      }));
      expect(manager.size()).toBe(1);
      expect(manager.results).toHaveLength(0);

      await manager.push(String(2), new Promise((resolve) => {
        resolve(2);
      }));
      expect(manager.size()).toBe(2);
      expect(manager.results).toHaveLength(0);

      await manager.push(String(3), new Promise((resolve) => {
        resolve(3);
      }));
      expect(manager.size()).toBe(2);
      expect(manager.results).toHaveLength(1);

      expect(manager.results).toHaveLength(1);
      expect(manager.results[0]).toStrictEqual({
        result: 1,
        label: '1',
        startingTime: 1,
        endingTime: 1,
      });

      await manager.push(String(4), new Promise((resolve) => {
        resolve(4);
      }));
      expect(manager.size()).toBe(2);
      expect(manager.results).toHaveLength(2);
      expect(manager.results[0]).toStrictEqual({
        result: 1,
        label: '1',
        startingTime: 1,
        endingTime: 1,
      });
      expect(manager.results[1]).toStrictEqual({
        result: 2,
        label: '2',
        startingTime: 1,
        endingTime: 1,
      });

      await manager.push(String(5), new Promise((resolve) => {
        resolve(5);
      }));
      expect(manager.size()).toBe(2);
      expect(manager.results).toHaveLength(3);
      expect(manager.results[0]).toStrictEqual({
        result: 1,
        label: '1',
        startingTime: 1,
        endingTime: 1,
      });
      expect(manager.results[1]).toStrictEqual({
        result: 2,
        label: '2',
        startingTime: 1,
        endingTime: 1,
      });
      expect(manager.results[2]).toStrictEqual({
        result: 3,
        label: '3',
        startingTime: 1,
        endingTime: 1,
      });
    });
  });

  describe('waitUntilQueueEmpty', () => {
    it('should return no result if the queue is empty', async () => {
      const manager = new ConcurentPromiseManager(5, []);
      await manager.waitUntilQueueEmpty();

      expect(manager.results).toHaveLength(0);
    });

    it('should return all ther result of the queue', async () => {
      const operations: IOperation<number>[] = [
        {
          label: '1',
          operation: new Promise((resolve) => {
            resolve(1);
          }),
        },
        {
          label: '2',
          operation: new Promise((resolve) => {
            resolve(2);
          }),
        },
        {
          label: '3',
          operation: new Promise((resolve) => {
            resolve(3);
          }),
        },
      ];
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(6);

      const manager = new ConcurentPromiseManager(5, operations);
      await manager.waitUntilQueueEmpty();

      expect(manager.results).toHaveLength(operations.length);
      expect(manager.results).toStrictEqual(
        [
          {
            label: '1',
            result: 1,
            startingTime: 1,
            endingTime: 4,
          },
          {
            label: '2',
            result: 2,
            startingTime: 2,
            endingTime: 5,
          },
          {
            label: '3',
            result: 3,
            startingTime: 3,
            endingTime: 6,
          },
        ],
      );
    });
  });

  describe('size', () => {
    it('should return 0 on an empty queue', () => {
      const manager = new ConcurentPromiseManager(5, []);
      expect(manager.size()).toBe(0);
    });

    it('should return the right size of the queue', () => {
      const operations: IOperation<number>[] = [
        {
          label: '1',
          operation: new Promise((resolve) => {
            resolve(1);
          }),
        },
        {
          label: '2',
          operation: new Promise((resolve) => {
            resolve(2);
          }),
        },
        {
          label: '3',
          operation: new Promise((resolve) => {
            resolve(3);
          }),
        },
      ];
      const manager = new ConcurentPromiseManager(5, operations);
      expect(manager.size()).toBe(operations.length);
    });
  });
});
