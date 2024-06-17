export class AsyncChannel<T> {
  private queuedItems: T[] = [];
  private waitingListeners: Array<(t: IteratorResult<T, void>) => void> = [];

  push(t: T): void {
    const waitingListener = this.waitingListeners.shift();
    if (waitingListener) {
      waitingListener({ done: false, value: t });
    } else {
      this.queuedItems.push(t);
    }
  }

  next(): Promise<IteratorResult<T, void>> {
    if (this.queuedItems.length) {
      return Promise.resolve({ done: false, value: this.queuedItems.shift()! });
    } else {
      return new Promise((resolve) => this.waitingListeners.push(resolve));
    }
  }

  takeAll(): T[] {
    const { queuedItems } = this;
    this.queuedItems = [];
    return queuedItems;
  }

  return() {
    const listeners = this.waitingListeners;
    this.waitingListeners = [];
    listeners.forEach((resolve) => resolve({ done: true, value: undefined }));
  }

  iter() {
    const iter: AsyncGenerator<T, void, void> = {
      next: async () => await this.next(),
      return: async () => ({ value: undefined, done: true }),
      throw: async () => ({ value: undefined, done: true }),
      [Symbol.asyncIterator]: () => iter,
    };
    return iter;
  }

  [Symbol.asyncIterator]() {
    return this.iter();
  }
}
