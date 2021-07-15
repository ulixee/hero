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
import IObservableChange from '@ulixee/hero-interfaces/IObservableChange';
import ObjectObserver from '../lib/ObjectObserver';

//	object
//
test('verify object - root - insert', () => {
  let c;
  const o: any = ObjectObserver.create({}, cs => {
    c = cs[0];
  });
  o.some = 'new';

  expect(c).toEqual({
    type: 'insert',
    path: ['some'],
    value: 'new',
  });
});

test('verify object - deep - insert', () => {
  let c;
  const o: any = ObjectObserver.create({ a: {} }, cs => {
    c = cs[0];
  });
  o.a.some = 'new';
  expect(c).toEqual({
    type: 'insert',
    path: ['a', 'some'],
    value: 'new',
  });
});

test('verify object - root - update', () => {
  let c: IObservableChange;
  const o = ObjectObserver.create({ p: 'old' }, cs => {
    c = cs[0];
  });
  o.p = 'new';
  expect(c).toEqual({
    type: 'update',
    path: ['p'],
    value: 'new',
  });
});

test('verify object - deep - update', () => {
  let c;
  const o = ObjectObserver.create({ a: { p: 'old' } }, cs => {
    c = cs[0];
  });
  o.a.p = 'new';
  expect(c).toEqual({
    type: 'update',
    path: ['a', 'p'],
    value: 'new',
  });
});

test('verify object - root - delete', () => {
  let c;
  const o = ObjectObserver.create({ p: 'old' }, cs => {
    c = cs[0];
  });
  delete o.p;
  expect(c).toEqual({
    type: 'delete',
    path: ['p'],
  });
});

test('verify object - deep - delete', () => {
  let c;
  const o = ObjectObserver.create({ a: { p: 'old' } }, cs => {
    c = cs[0];
  });
  delete o.a.p;
  expect(c).toEqual({
    type: 'delete',
    path: ['a', 'p'],
  });
});

//	array
//
test('verify array - root - insert', () => {
  let c;
  const o = ObjectObserver.create([], cs => {
    c = cs[0];
  });
  o.push('new');
  expect(c).toEqual({
    type: 'insert',
    path: [0],
    value: 'new',
  });
});

test('verify array - deep - insert', () => {
  let c;
  const o = ObjectObserver.create([[]], cs => {
    c = cs[0];
  });
  o[0].push('new');
  expect(c).toEqual({
    type: 'insert',
    path: [0, 0],
    value: 'new',
  });
});

test('verify array - root - update', () => {
  let c;
  const o = ObjectObserver.create(['old'], cs => {
    c = cs[0];
  });
  o[0] = 'new';
  expect(c).toEqual({
    type: 'update',
    path: [0],
    value: 'new',
  });
});

test('verify array - deep - update', () => {
  let c;
  const o = ObjectObserver.create([['old']], cs => {
    c = cs[0];
  });
  o[0][0] = 'new';
  expect(c).toEqual({
    type: 'update',
    path: [0, 0],
    value: 'new',
  });
});

test('verify array - root - delete', () => {
  let c;
  const o = ObjectObserver.create(['old'], cs => {
    c = cs[0];
  });
  o.pop();
  expect(c).toEqual({
    type: 'delete',
    path: [0],
  });
});

test('verify array - deep - delete', () => {
  let c;
  const o = ObjectObserver.create([['old']], cs => {
    c = cs[0];
  });
  o[0].pop();
  expect(c).toEqual({
    type: 'delete',
    path: [0, 0],
  });
});

// advanced types
//
test('verify date - changes', () => {
  const changes = [];
  const o = ObjectObserver.create([{ name: 'test', date: new Date() }], cs => {
    changes.push(...cs);
  });
  expect(o[0].date).toEqual(expect.any(String));
  const date2 = new Date();
  date2.setTime(new Date().getTime() - 100000);

  o[0].date = date2 as any;

  expect(changes[0]).toEqual({
    type: 'update',
    path: [0, 'date'],
    value: date2.toISOString(),
  });
});

test('buffer - records changes', () => {
  const events = [];
  const buffer = Buffer.from('This is a test');
  const po = ObjectObserver.create({ buffer }, changes => events.push(...changes));

  expect(po.buffer).toBe(buffer.toString('base64'));
  expect(po.buffer).not.toEqual(buffer);

  buffer.write('More');
  expect(po.buffer).not.toBe(buffer.toString('base64'));

  po.buffer = buffer;
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: ['buffer'],
    value: Buffer.from('More is a test').toString('base64'),
  });
});

// object tests
//
test('creating observable preserves original object keys order', () => {
  const person = {
    name: 'name',
    age: 7,
    street: 'street',
    block: 9,
    apt: 1,
  };
  const oPerson = ObjectObserver.create(person);
  const sKeys = Object.keys(person);
  const oKeys = Object.keys(oPerson);

  expect(sKeys).toStrictEqual(oKeys);
});

test('plain object operations', () => {
  const o: any = {
    name: 'name',
    age: 7,
    address: null,
  };
  const events = [];
  const tmpAddress = { street: 'some' };

  const po = ObjectObserver.create(o, changes => events.push(...changes));

  const v1 = (po.name = 'new name'); // eslint-disable-line no-multi-assign
  const v2 = (po.age = 9); // eslint-disable-line no-multi-assign
  const v3 = (po.address = tmpAddress); // eslint-disable-line no-multi-assign
  expect(v1).toBe('new name');
  expect(v2).toBe(9);
  expect(v3).toBe(tmpAddress);

  expect(events).toHaveLength(3);
  expect(events[0]).toEqual({
    type: 'update',
    path: ['name'],
    value: 'new name',
  });
  expect(events[1]).toEqual({
    type: 'update',
    path: ['age'],
    value: 9,
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: ['address'],
    value: po.address,
  });

  const v4 = (po.address = null); // eslint-disable-line no-multi-assign
  const v5 = (po.sex = 'male'); // eslint-disable-line no-multi-assign
  delete po.sex;
  expect(v4).toBe(null);
  expect(v5).toBe('male');

  expect(events).toHaveLength(6);

  expect(events[3]).toEqual({
    type: 'update',
    path: ['address'],
    value: null,
  });
  expect(events[4]).toEqual({
    type: 'insert',
    path: ['sex'],
    value: 'male',
  });
  expect(events[5]).toEqual({
    type: 'delete',
    path: ['sex'],
  });
});

test('sub tree object operations', () => {
  const person = {
    name: 'name',
    age: 7,
    address: null,
    addressB: {
      street: {
        name: 'street name',
        apt: 123,
      },
    },
  };
  const events = [];
  const newAddress = {};

  const po = ObjectObserver.create(person, changes => {
    [].push.apply(events, changes);
  });

  po.address = newAddress;
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual({
    type: 'update',
    path: ['address'],
    value: po.address,
  });

  po.address.street = 'street';
  po.addressB.street.name = 'new street name';

  expect(events).toHaveLength(3);
  expect(events[1]).toEqual({
    type: 'insert',
    path: ['address', 'street'],
    value: 'street',
  });
  expect(events[2]).toEqual({
    type: 'update',
    path: ['addressB', 'street', 'name'],
    value: 'new street name',
  });
});

test('Object.assign with multiple properties yields many callbacks', () => {
  const events = [];
  let callbacks = 0;
  const observable: any = ObjectObserver.create({}, changes => {
    callbacks += 1;
    events.push(...changes);
  });
  const newData = { a: 1, b: 2, c: 3 };

  Object.assign(observable, newData);
  observable.a = 4;
  expect(callbacks).toBe(4);
  expect(events).toHaveLength(4);
});
