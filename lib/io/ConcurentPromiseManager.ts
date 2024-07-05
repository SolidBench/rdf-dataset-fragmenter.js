/**
 * A generic class to manage typed operation (Promises) in a pooling manner.
 * useful for executing concurrent operations with control of the size of the pool.
 */
export class ConcurentPromiseManager<T> {
  // Number of asyncronous operations
  public readonly poolSize: number;
  // Queue of operations
  private operationQueue: IOperation<T>[];
  // Results of the operations, might not be in the same order as their insertion in the queue
  public readonly results: IResult<T>[] = [];

  public constructor(poolSize: number, initialOperations: IOperation<T>[]) {
    initialOperations = initialOperations.map((operation) => {
      operation.startingTime = performance.now();
      return operation;
    });
    this.poolSize = poolSize;
    this.operationQueue = [ ...initialOperations ];
  }

  /**
   * Push the operation into the operation queue.
   * If the number of operation is higher or equal to the pool size it will wait until one operation finished.
   * The results of the operation are store in the attribute "results" of the class instance
   * @param {string} label - label of the operation
   * @param {Promise<T>} operation - operation
   */
  public async push(label: string, operation: Promise<T>): Promise<void> {
    this.operationQueue.push(
      {
        label,
        operation,
        startingTime: performance.now(),
      },
    );

    if (this.size() >= this.poolSize) {
      const result = await this.process();
      this.results.push(result);
    }
  }

  /**
   * Wait until all the operation finishes executing and
   * accumulate the results in the "results" class instance attribute.
   * Can be used before the destruction of the object
   * to collect all the results and make sure every operation is completed.
   */
  public async waitUntilQueueEmpty(): Promise<void> {
    while (this.size() !== 0) {
      const result = await this.process();
      this.results.push(result);
    }
  }

  /**
   * Get the size of the operation queue.
   * @returns {number} the size of the operation queue
   */
  public size(): number {
    return this.operationQueue.length;
  }

  /**
   * Wait until the fastest operation finishes processing, delete it from the queue, and return its result.
   * @returns {Promise<IResult<T>>} result of the operation
   */
  private async process(): Promise<IResult<T>> {
    const pool = this.operationQueue.slice(0, this.poolSize);
    const operations: Promise<[T, number]>[] = pool.map((operation, index) => new Promise((resolve, reject) => {
      operation.operation.then((res) => {
        resolve([ res, index ]);
      }).catch((err) => {
        reject(err);
      });
    }));

    const [ result, index ] = await Promise.race(operations);
    this.operationQueue = this.operationQueue.filter((element, i) => i !== index);

    return {
      result,
      label: pool[index].label,
      startingTime: pool[index].startingTime!,
      endingTime: performance.now(),
    };
  }
}

/**
 * An typed operation
 */
export interface IOperation<T> {
  label: string;
  operation: Promise<T>;
  startingTime?: number;
}
/**
 * A typed result
 */
export interface IResult<T> {
  result: T;
  label: string;
  startingTime: number;
  endingTime: number;
}
