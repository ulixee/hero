/**
 ISC License (ISC)

 Copyright 2015 Yuri Guller (gullerya@gmail.com)
 Modifications 2021 Data Liberation Foundation

 Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
 provided that the above copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
 INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
 OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
import IObservableChange, {
  ObservableChangeType,
} from '@ulixee/hero-interfaces/IObservableChange';

export default class ObjectObserver implements ProxyHandler<any> {
  private static key = Symbol.for('object-observer-key-v0');

  public onChanges: (changes: IObservableChange[]) => void;
  public readonly target: any;
  public readonly proxy: any;

  public get path(): PropertyKey[] {
    const path = [];
    if (this.parentPath.length) path.push(...this.parentPath);
    if (this.ownKey !== undefined && this.ownKey !== null) path.push(this.ownKey);
    return path;
  }

  public ownKey: PropertyKey;

  private readonly isArray: boolean = false;
  private parentPath: PropertyKey[] = [];

  private readonly proxiedArrayMethods = {
    pop: this.pop,
    push: this.push,
    shift: this.shift,
    unshift: this.unshift,
    reverse: this.reverse,
    sort: this.sort,
    fill: this.fill,
    copyWithin: this.copyWithin,
    splice: this.splice,
  };

  constructor(
    source: any,
    onChanges?: ObjectObserver['onChanges'],
    ownKey: PropertyKey = null,
    parentPath: PropertyKey[] = [],
  ) {
    if (!source || typeof source !== 'object') {
      throw new Error('Observable MAY ONLY be created from a non-null object');
    }

    if (ArrayBuffer.isView(source) || Buffer.isBuffer(source) || source instanceof Date) {
      throw new Error('Observable cannot be a Buffer or Date');
    }

    this.ownKey = ownKey;
    this.parentPath = parentPath;
    this.onChanges = onChanges;
    this.isArray = Array.isArray(source);

    const target = this.isArray ? [] : {};
    for (const [key, value] of Object.entries(source)) {
      const storedKey = this.coerceKey(key);
      target[storedKey] = this.observeChild(value, storedKey);
    }

    Object.setPrototypeOf(target, Object.getPrototypeOf(source));

    Object.defineProperty(target, ObjectObserver.key, {
      configurable: true,
      value: this,
    });
    this.proxy = new Proxy(target, this);
    this.target = target;
  }

  emit(...changes: IObservableChange[]): void {
    if (!changes.length || !this.onChanges) return;
    for (const change of changes) {
      change.value = this.deepClone(change.value);
    }

    this.onChanges(changes);
  }

  detach(): any {
    delete this.target[ObjectObserver.key];
    return this.target;
  }

  set(target: any, key: PropertyKey, value: any): boolean {
    const oldValue = target[key];
    if (value !== oldValue) {
      key = this.coerceKey(key);
      value = this.observeChild(value, key);
      target[key] = value;
      ObjectObserver.detach(oldValue);

      const type =
        oldValue === undefined ? ObservableChangeType.insert : ObservableChangeType.update;
      const path = [...this.path, key];

      this.emit({ type, path, value });
    }

    return true;
  }

  get(target: any, key: PropertyKey): any {
    if (typeof target[key] === 'function') {
      if (this.proxiedArrayMethods.hasOwnProperty(key) && this.isArray) {
        return this.proxiedArrayMethods[key].bind(this);
      }

      return target[key].bind(target);
    }
    return target[key];
  }

  deleteProperty(target: any, key: PropertyKey): boolean {
    ObjectObserver.detach(target[key]);

    delete target[key];

    key = this.coerceKey(key);
    this.emit({ type: ObservableChangeType.delete, path: [...this.path, key] });

    return true;
  }

  deepClone(object: any): any {
    if (!object) return object;
    const type = typeof object;
    if (type === 'string' || type === 'number' || type === 'boolean') return object;

    if (type === 'object') {
      if (Array.isArray(object)) {
        return object.map(this.deepClone.bind(this));
      }
      const result: any = {};
      for (const [key, value] of Object.entries(object)) {
        result[key] = this.deepClone(value);
      }
      return result;
    }
    return object;
  }

  serialize(target): string {
    if (!target) return target;
    if (Buffer.isBuffer(target)) {
      return target.toString('base64');
    }
    if (ArrayBuffer.isView(target)) {
      return Buffer.from(target.buffer).toString('base64');
    }
    if (target instanceof Date) {
      return target.toISOString();
    }
    return target;
  }

  toJSON(): any {
    return {
      path: this.path,
    };
  }

  // /// PROXIED ARRAY FUNCTIONS

  private pop<T>(): T {
    const target = this.target as Array<T>;
    const poppedIndex = target.length - 1;

    const popResult = ObjectObserver.detach(target.pop());

    this.emit({
      type: ObservableChangeType.delete,
      path: [...this.path, poppedIndex],
    });

    return popResult;
  }

  private push<T>(...items: T[]): number {
    const target = this.target as Array<T>;

    const initialLength = target.length;
    const changes: IObservableChange[] = [];

    items = items.map((x, i) => {
      const value = this.observeChild(x, i + initialLength);
      changes.push({
        type: ObservableChangeType.insert,
        path: [...this.path, i + initialLength],
        value,
      });
      return value;
    });

    const pushResult = target.push(...items);

    this.emit(...changes);

    return pushResult;
  }

  private shift<T>(): T {
    const target = this.target as Array<T>;

    const shiftResult = ObjectObserver.detach(target.shift());
    this.updateArrayIndices();

    this.emit({
      type: ObservableChangeType.delete,
      path: [...this.path, 0],
    });

    return shiftResult;
  }

  private unshift<T>(...items: T[]): number {
    const target = this.target as Array<T>;

    const changes: IObservableChange[] = new Array(items.length);
    items = items.map((x, i) => {
      const value = this.observeChild(x, i);
      changes[i] = { type: ObservableChangeType.insert, path: [i], value };
      return value;
    });

    const unshiftResult = target.unshift(...items);
    this.updateArrayIndices();

    this.emit(...changes);

    return unshiftResult;
  }

  private reverse<T>(): T[] {
    const target = this.target as Array<T>;

    const prev = [...target];

    target.reverse();
    const newOrder = this.getNewSortOrder(prev);

    this.emit({
      type: ObservableChangeType.reorder,
      path: this.path,
      value: newOrder,
    });

    return this.proxy;
  }

  private sort<T>(comparator?: (a: T, b: T) => number): T[] {
    const target = this.target as Array<T>;

    const prev = [...target];

    target.sort(comparator);
    const newOrder = this.getNewSortOrder(prev);

    this.emit({
      type: ObservableChangeType.reorder,
      path: this.path,
      value: newOrder,
    });

    return this.proxy;
  }

  private copyWithin<T>(insertIndex: number, copyStart: number, copyEnd?: number): T[] {
    const target = this.target as Array<T>;
    const length = target.length;

    if (insertIndex < 0) insertIndex = Math.max(length + insertIndex, 0);

    copyStart = copyStart ?? 0;
    if (copyStart < 0) copyStart = Math.max(length + copyStart, 0);
    if (copyStart > length) copyStart = length;

    copyEnd = copyEnd ?? length;
    if (copyEnd < 0) copyEnd = Math.max(length + copyEnd, 0);
    if (copyEnd > length) copyEnd = length;

    const itemCount = Math.min(copyEnd - copyStart, length - insertIndex);

    if (insertIndex < length && insertIndex !== copyStart && itemCount > 0) {
      const prev = [...target];
      const changes: IObservableChange[] = [];

      target.copyWithin(insertIndex, copyStart, copyEnd);

      for (let i = insertIndex; i < insertIndex + itemCount; i += 1) {
        //	detach overridden observables, if any
        const previousItem = ObjectObserver.detach(prev[i]);
        ObjectObserver.detach(target[i]);
        //	update newly placed observables, if any
        const item = this.observeChild(target[i], i);
        target[i] = item;

        if (typeof item !== 'object' && item === previousItem) {
          continue;
        }
        changes.push({ type: ObservableChangeType.update, path: [...this.path, i], value: item });
      }
      this.updateArrayIndices();

      this.emit(...changes);
    }

    return this.proxy;
  }

  private splice<T>(start: number, deleteCount: number, ...items: T[]): T[] {
    const target = this.target as Array<T>;
    const startLength = target.length;

    items = items.map(this.observeChild.bind(this));

    const args: any[] = [deleteCount, ...items];
    if (args.length === 1 && deleteCount === undefined) {
      args.length = 0;
    }

    const deletedItems = target.splice(start, ...args);

    this.updateArrayIndices();

    for (const deleted of deletedItems) {
      ObjectObserver.detach(deleted);
    }

    let startIndex = start ?? 0;
    if (startIndex < 0) startIndex += startLength;

    const deleteOrUpdateCount = deleteCount ?? startLength - startIndex;

    const changes: IObservableChange[] = [];
    let changeCount = 0;
    while (changeCount < deleteOrUpdateCount) {
      const index = startIndex + changeCount;
      if (changeCount < items.length) {
        changes.push({
          type: ObservableChangeType.update,
          path: [...this.path, index],
          value: target[index],
        });
      } else {
        changes.push({
          type: ObservableChangeType.delete,
          path: [...this.path, index],
        });
      }
      changeCount += 1;
    }

    while (changeCount < items.length) {
      const index = startIndex + changeCount;
      changes.push({
        type: ObservableChangeType.insert,
        path: [...this.path, index],
        value: target[index],
      });
      changeCount += 1;
    }
    this.emit(...changes);

    return deletedItems;
  }

  private fill<T>(filVal: any, start: number, end?: number): T[] {
    const target = this.target as Array<T>;
    const prev = [...target];

    target.fill(filVal, start, end);

    const changes: IObservableChange[] = [];
    for (let i = 0; i < target.length; i += 1) {
      target[i] = this.observeChild(target[i], i);

      if (prev[i] !== target[i]) {
        const type = i in prev ? ObservableChangeType.update : ObservableChangeType.insert;
        if (i in prev) ObjectObserver.detach(prev[i]);

        changes.push({ type, path: [...this.path, i], value: target[i] });
      }
    }
    if (changes.length) this.emit(...changes);

    return this.proxy;
  }

  private getNewSortOrder<T>(previousArray: T[]): number[] {
    const target = this.target as Array<T>;
    const previousOrder: number[] = new Array(target.length);
    const lastItemIndices = new Map<any, number>();
    //	reindex the paths
    for (let i = 0; i < target.length; i += 1) {
      const item = target[i];
      if (item && typeof item === 'object') {
        const observable = item[ObjectObserver.key] as ObjectObserver;
        previousOrder[i] = observable.ownKey as number;
        // record new ownKey
        observable.ownKey = i;
      } else {
        // if primitive, need to progress through the array
        previousOrder[i] = previousArray.indexOf(item, (lastItemIndices.get(item) ?? -1) + 1);
        lastItemIndices.set(item, previousOrder[i]);
      }
    }
    return previousOrder;
  }

  private updateArrayIndices(): void {
    const target = this.target as Array<any>;
    //	reindex the paths
    for (let i = 0; i < target.length; i += 1) {
      const item = target[i];
      const observer = item[ObjectObserver.key] as ObjectObserver;
      if (observer) observer.ownKey = i;
    }
  }

  private observeChild(item: any, key: PropertyKey): any {
    if (!item || typeof item !== 'object') return item;

    if (Buffer.isBuffer(item)) {
      return item.toString('base64');
    }
    if (ArrayBuffer.isView(item)) {
      return Buffer.from(item.buffer).toString('base64');
    }
    if (item instanceof Date) {
      return item.toISOString();
    }

    const existing = item[ObjectObserver.key] as ObjectObserver;
    if (existing) {
      existing.ownKey = key;
      existing.parentPath = this.path;
      existing.onChanges = this.onChanges;
      return existing.proxy;
    }

    const observable = new ObjectObserver(item, this.onChanges, key, this.path);

    return observable.proxy;
  }

  private coerceKey(key: PropertyKey): PropertyKey {
    if (this.isArray && !Number.isInteger(key) && isNumberRegex.test(key as string)) {
      return parseInt(key as string, 10);
    }
    return key;
  }

  public static create<T>(target: T, onChanges?: (changes: IObservableChange[]) => any): T {
    const observable = new ObjectObserver(target, onChanges);
    return observable.proxy;
  }

  public static isObserved(item: any): boolean {
    return !!item[ObjectObserver.key];
  }

  private static detach<T>(item: T): T {
    if (item && typeof item === 'object') {
      const existing = item[ObjectObserver.key] as ObjectObserver;
      if (existing) return existing.detach();
    }
    return item;
  }
}

export function Observable<T>(source: T): T {
  const observable = new ObjectObserver(source);
  return observable.proxy;
}

const isNumberRegex = /^\d+$/;
