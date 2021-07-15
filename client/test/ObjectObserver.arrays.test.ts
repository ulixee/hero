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
import ObjectObserver from '../lib/ObjectObserver';

test('array push - primitives', () => {
  const events = [];
  let callBacks = 0;
  const pa = ObjectObserver.create([1, 2, 3, 4], changes => {
    events.push(...changes);
    callBacks += 1;
  });

  pa.push(5);
  pa.push(6, 7);

  expect(events).toHaveLength(3);
  expect(callBacks).toBe(2);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [4],
    value: 5,
  });
  expect(events[1]).toEqual({
    type: 'insert',
    path: [5],
    value: 6,
  });
  expect(events[2]).toEqual({
    type: 'insert',
    path: [6],
    value: 7,
  });
});

test('array push - objects', () => {
  const events = [];
  const pa = ObjectObserver.create([], changes => events.push(...changes));

  pa.push({ text: 'initial' }, { text: 'secondary' });
  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0],
    value: { text: 'initial' },
  });
  expect(events[1]).toEqual({
    type: 'insert',
    path: [1],
    value: { text: 'secondary' },
  });
  pa[0].text = 'name';
  expect(events).toHaveLength(3);
  expect(events[2]).toEqual({
    type: 'update',
    path: [0, 'text'],
    value: 'name',
  });

  pa[1].text = 'more';
  expect(events).toHaveLength(4);
  expect(events[3]).toEqual({
    type: 'update',
    path: [1, 'text'],
    value: 'more',
  });
});

test('array push - arrays', () => {
  const events = [];
  const pa = ObjectObserver.create([], changes => events.push(...changes));

  pa.push([], [{}]);
  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0],
    value: [],
  });
  expect(events[1]).toEqual({
    type: 'insert',
    path: [1],
    value: [{}],
  });
  pa[0].push('name');
  expect(events).toHaveLength(3);

  expect(events[2]).toEqual({
    type: 'insert',
    path: [0, 0],
    value: 'name',
  });
  pa[1][0].prop = 'more';
  expect(events).toHaveLength(4);
  expect(events[3]).toEqual({
    type: 'insert',
    path: [1, 0, 'prop'],
    value: 'more',
  });
});

test('array pop - primitives', () => {
  const events = [];
  const pa = ObjectObserver.create(['some'], changes => events.push(...changes));

  const popped = pa.pop();

  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [0],
  });
  expect(popped).toBe('some');
});

test('array pop - objects', () => {
  const events = [];
  const pa = ObjectObserver.create([{ test: 'text' }], changes => events.push(...changes));
  const pad: any = pa[0];

  pa[0].test = 'test';
  pad.test = 'more';
  expect(events).toHaveLength(2);

  const popped: any = pa.pop();
  expect(popped.test).toBe('more');
  expect(events).toHaveLength(3);

  popped.new = 'value';
  expect(events).toHaveLength(3);

  const eventsA = [];
  const newPad = ObjectObserver.create(pad, changes => eventsA.push(...changes));
  newPad.test = 'change';
  expect(eventsA).toHaveLength(1);
});

test('array unshift - primitives', () => {
  const events = [];
  let callbacks = 0;
  const pa = ObjectObserver.create([], changes => {
    events.push(...changes);
    callbacks += 1;
  });

  pa.unshift('a');
  pa.unshift('b', 'c');
  expect(events).toHaveLength(3);
  expect(callbacks).toBe(2);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0],
    value: 'a',
  });
  expect(events[1]).toEqual({
    type: 'insert',
    path: [0],
    value: 'b',
  });
  expect(events[2]).toEqual({
    type: 'insert',
    path: [1],
    value: 'c',
  });
});

test('array unshift - objects', () => {
  const events = [];
  const pa = ObjectObserver.create([{ text: 'original' }], changes => {
    events.push(...changes);
  });

  pa.unshift({ text: 'initial' });
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0],
    value: { text: 'initial' },
  });
  events.splice(0);

  pa[0].text = 'name';
  pa[1].text = 'other';
  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0, 'text'],
    value: 'name',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1, 'text'],
    value: 'other',
  });
});

test('array unshift - arrays', () => {
  const events = [];
  const pa = ObjectObserver.create([{ text: 'original' }], changes => {
    events.push(...changes);
  });

  pa.unshift([{}] as any);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0],
    value: [{}],
  });
  events.splice(0);

  pa[0][0].text = 'name';
  pa[1].text = 'other';
  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'insert',
    path: [0, 0, 'text'],
    value: 'name',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1, 'text'],
    value: 'other',
  });
});

test('array shift - primitives', () => {
  const events = [];
  const pa = ObjectObserver.create(['some'], changes => {
    events.push(...changes);
  });

  const shifted = pa.shift();
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [0],
  });
  expect(shifted).toBe('some');
});

test('array shift - objects', () => {
  const events = [];
  const pa = ObjectObserver.create(
    [{ text: 'a', inner: { test: 'more' } }, { text: 'b' }],
    changes => events.push(...changes),
  );
  const pa0 = pa[0];
  const pa0i: any = pa0.inner;

  pa[0].text = 'b';
  pa0i.test = 'test';
  expect(events).toHaveLength(2);
  events.splice(0);

  const shifted = pa.shift();
  expect(shifted.text).toBe('b');
  expect(shifted.inner.test).toBe('test');

  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [0],
  });
  events.splice(0);

  pa[0].text = 'c';
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0, 'text'],
    value: 'c',
  });
  events.splice(0);

  shifted.text = 'd';
  expect(events).toHaveLength(0);
});

test('array reverse - primitives (flat array)', () => {
  const events = [];
  const pa = ObjectObserver.create([1, 2, 3], changes => events.push(...changes));

  const reversed = pa.reverse();

  expect(reversed).toEqual(pa);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 1, 0],
  });
});

test('array reverse - primitives (nested array)', () => {
  const events = [];
  const pa = ObjectObserver.create({ a1: { a2: [1, 2, 3] } }, changes => events.push(...changes));

  const reversed = pa.a1.a2.reverse();

  expect(reversed).toEqual(pa.a1.a2);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'reorder',
    path: ['a1', 'a2'],
    value: [2, 1, 0],
  });
});

test('array reverse - objects', () => {
  const events = [];
  const pa = ObjectObserver.create([{ name: 'a' }, { name: 'b' }, { name: 'c' }], changes =>
    events.push(...changes),
  );

  pa[0].name = 'A';
  const reversed = pa.reverse();
  pa[0].name = 'C';

  expect(reversed).toEqual(pa);
  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0, 'name'],
    value: 'A',
  });
  expect(events[1]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 1, 0],
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: [0, 'name'],
    value: 'C',
  });
});

test('array sort - primitives (flat array)', () => {
  const events = [];
  const pa = ObjectObserver.create([3, 2, 1], changes => events.push(...changes));

  let sorted = pa.sort();

  expect(sorted).toEqual(pa);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 1, 0],
  });
  expect(pa).toEqual([1, 2, 3]);

  sorted = pa.sort((a, b) => {
    return a < b ? 1 : -1;
  });
  expect(sorted).toEqual(pa);

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 1, 0],
  });
  expect(pa).toEqual([3, 2, 1]);
});

test('array sort - primitives (flat array with duplicates)', () => {
  const events = [];
  const pa = ObjectObserver.create([3, 2, 1, 2, 1], changes => events.push(...changes));

  const sorted = pa.sort();

  expect(sorted).toEqual(pa);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 4, 1, 3, 0],
  });
  expect(pa).toEqual([1, 1, 2, 2, 3]);
});

test('array sort - objects', () => {
  const events = [];
  const pa = ObjectObserver.create([{ name: 'a' }, { name: 'b' }, { name: 'c' }], changes =>
    events.push(...changes),
  );

  pa[0].name = 'A';
  const sorted = pa.sort((a, b) => {
    return a.name < b.name ? 1 : -1;
  });
  pa[0].name = 'C';

  if (sorted !== pa) throw new Error('sort base functionality broken');

  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0, 'name'],
    value: 'A',
  });
  expect(events[1]).toEqual({
    type: 'reorder',
    path: [],
    value: [2, 1, 0],
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: [0, 'name'],
    value: 'C',
  });
});

test('array fill - primitives', () => {
  const events = [];
  const pa: any[] = ObjectObserver.create([1, 2, 3], changes => events.push(...changes));

  const filled = pa.fill('a');
  if (filled !== pa) throw new Error('fill base functionality broken');

  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0],
    value: 'a',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1],
    value: 'a',
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: [2],
    value: 'a',
  });
  events.splice(0);

  pa.fill('b', 1, 3);

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'update',
    path: [1],
    value: 'b',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [2],
    value: 'b',
  });
  events.splice(0);

  pa.fill('c', -1, 3);

  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: [2],
    value: 'c',
  });
  events.splice(0);

  //	simulating insertion of a new item into array (fill does not extend an array, so we may do it only on internal items)
  delete pa[1];
  pa.fill('d', 1, 2);

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [1],
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1],
    value: 'd',
  });
});

test('array fill - objects', () => {
  const events = [];
  const pa: any = ObjectObserver.create(
    [{ some: 'text' }, { some: 'else' }, { some: 'more' }],
    changes => events.push(...changes),
  );

  const filled = pa.fill({ name: 'Niv' });
  if (filled !== pa) throw new Error('fill base functionality broken');

  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0],
    value: { name: 'Niv' },
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1],
    value: { name: 'Niv' },
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: [2],
    value: { name: 'Niv' },
  });
  events.length = 0;

  pa[1].name = 'David';
  expect(events[0]).toEqual({
    type: 'update',
    path: [1, 'name'],
    value: 'David',
  });
  expect(events).toHaveLength(1);
});

test('array fill - arrays', () => {
  const events = [];
  const pa: any = ObjectObserver.create(
    [{ some: 'text' }, { some: 'else' }, { some: 'more' }],
    changes => events.push(...changes),
  );

  const filled = pa.fill([{ name: 'Niv' }]);
  expect(filled).toEqual(pa);

  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: [0],
    value: [{ name: 'Niv' }],
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [1],
    value: [{ name: 'Niv' }],
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: [2],
    value: [{ name: 'Niv' }],
  });
  events.length = 0;

  pa[1][0].name = 'David';

  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: [1, 0, 'name'],
    value: 'David',
  });
});

test('array splice - primitives', () => {
  const events = [];
  let callbacks = 0;
  const pa: any = ObjectObserver.create([1, 2, 3, 4, 5, 6], changes => {
    events.push(...changes);
    callbacks += 1;
  });

  const spliced = pa.splice(2, 2, 'a');
  expect(spliced).toEqual([3, 4]);

  expect(events).toHaveLength(2);
  expect(callbacks).toBe(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: [2],
    value: 'a',
  });
  expect(events[1]).toEqual({
    type: 'delete',
    path: [3],
  });
  events.splice(0);
  callbacks = 0;

  //  pa = [1,2,'a',5,6]
  pa.splice(-3);

  expect(events).toHaveLength(3);
  expect(callbacks).toBe(1);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [2],
  });
  expect(events[1]).toEqual({
    type: 'delete',
    path: [3],
  });
  expect(events[2]).toEqual({
    type: 'delete',
    path: [4],
  });
  expect(pa).toHaveLength(2);
  events.length = 0;
  callbacks = 0;

  //  pa = [1,2]
  pa.splice(0);

  expect(events).toHaveLength(2);
  expect(callbacks).toBe(1);
  expect(events[0]).toEqual({
    type: 'delete',
    path: [0],
  });
  expect(events[1]).toEqual({
    type: 'delete',
    path: [1],
  });
});

test('array splice - objects', () => {
  const events = [];
  const pa = ObjectObserver.create(
    [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
    changes => events.push(...changes),
  );

  pa.splice(1, 2, { text: '1' });

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'update',
    path: [1],
    value: { text: '1' },
  });
  expect(events[1]).toEqual({
    type: 'delete',
    path: [2],
  });
  expect(pa).toHaveLength(3);
  events.splice(0);

  pa[1].text = 'B';
  pa[2].text = 'D';

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'update',
    path: [1, 'text'],
    value: 'B',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: [2, 'text'],
    value: 'D',
  });
  events.splice(0);

  pa.splice(1, 1, { text: 'A' }, { text: 'B' });

  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({
    type: 'update',
    path: [1],
    value: { text: 'A' },
  });
  expect(events[1]).toEqual({
    type: 'insert',
    path: [2],
    value: { text: 'B' },
  });
  events.splice(0);

  pa[3].text = 'C';

  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: [3, 'text'],
    value: 'C',
  });
});

describe('copyWithin', () => {
  test('array copyWithin - primitives', () => {
    const events = [];
    let callbacks = 0;
    const pa = ObjectObserver.create([1, 2, 3, 4, 5, 6], changes => {
      events.push(...changes);
      callbacks += 1;
    });

    let copied = pa.copyWithin(2, 0, 3);
    expect(pa).toEqual(copied);
    expect(events).toHaveLength(3);
    expect(callbacks).toBe(1);
    expect(events[0]).toEqual({
      type: 'update',
      path: [2],
      value: 1,
    });
    expect(events[1]).toEqual({
      type: 'update',
      path: [3],
      value: 2,
    });
    expect(events[2]).toEqual({
      type: 'update',
      path: [4],
      value: 3,
    });
    events.splice(0);
    callbacks = 0;

    //  pa = [1,2,1,2,3,6]
    copied = pa.copyWithin(-3, 0);
    expect(pa).toEqual(copied);
    expect(events).toHaveLength(3);
    expect(callbacks).toBe(1);
    expect(events[0]).toEqual({
      type: 'update',
      path: [3],
      value: 1,
    });
    expect(events[1]).toEqual({
      type: 'update',
      path: [4],
      value: 2,
    });
    expect(events[2]).toEqual({
      type: 'update',
      path: [5],
      value: 1,
    });
    events.splice(0);
    callbacks = 0;

    //  pa = [1,2,1,1,2,1]
    copied = pa.copyWithin(1, -3, 9);
    expect(pa).toEqual(copied);
    expect(events).toHaveLength(2);
    expect(callbacks).toBe(1);
    expect(events[0]).toEqual({
      type: 'update',
      path: [1],
      value: 1,
    });
    expect(events[1]).toEqual({
      type: 'update',
      path: [2],
      value: 2,
    });

    //	update at index 4 should not be evented, since 1 === 1
    events.splice(0);
    callbacks = 0;
  });

  test('array copyWithin - objects', () => {
    const events = [];
    const pa = ObjectObserver.create(
      [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
      changes => {
        events.push(...changes);
      },
    );

    const copied = pa.copyWithin(1, 2, 3);
    expect(pa).toEqual(copied);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: 'update',
      path: [1],
      value: { text: 'c' },
    });
    events.length = 0;

    pa[1].text = 'B';
    pa[2].text = 'D';
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      type: 'update',
      path: [1, 'text'],
      value: 'B',
    });
    expect(events[1]).toEqual({
      type: 'update',
      path: [2, 'text'],
      value: 'D',
    });
  });
});
