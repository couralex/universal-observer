import {expect} from 'chai';
import {observe, unobserve, pause, resume} from '../../src/universal-observe';

function expectObserve(target, mutation, expected, options) {
  let report = null;
  const observed = observe(target, change => report = change, options);
  mutation(observed);
  expect(report).to.deep.equal(expected);
}

function expectBulkObserve(target, mutation, expected, options) {
  let report = [];
  const observed = observe(target, change => report.push(change), options);
  mutation(observed);
  expect(report).to.deep.equal(expected);
}

describe('UniversalObserve', function() {
  describe('observe', function () {
    describe('options: default', function() {
      it ('should throw on non-object targets', function () {
        expect(() => observe(1)).to.throw("Primitive values can't be observed.");
        expect(() => observe(undefined)).to.throw("Primitive values can't be observed.");
      });
      describe('Object', function () {
        it('should report change on property modification', function () {
          expectObserve(
            {a: 1},
            observed => observed.a = 2,
            {object: {a: 2}, type: 'update', name: 'a', oldValue: 1}
          );
        });
        it('should report change on property creation', function () {
          expectObserve(
            {},
            observed => observed.a = 2,
            {object: {a: 2}, type: 'add', name: 'a', oldValue: undefined}
          );
        });
        it('should report change on property deletion', function () {
          expectObserve(
            {a: 1},
            observed => delete observed.a,
            {object: {}, type: 'delete', name: 'a', oldValue: 1}
          );
        });
        it('should handle nested objects', function () {
          expectObserve(
            {a: {b: {}}},
            observed => observed.a.b.c= 1,
            {object: {c: 1}, type: 'add', name: 'c', oldValue: undefined}
          );
        });
        it('should handle circular references', function() {
          const a = {b: 1};
          a.a = a;
          expectBulkObserve(
            a,
            observed => {observed.a.b = 2; observed.a.a.b = 3}, [
              {object: a, type: 'update', name: 'b', oldValue: 1},
              {object: a, type: 'update', name: 'b', oldValue: 2}
            ]
          );
        });
      });
      describe('Array', function () {
        it('should report change on element modification', function() {
          expectObserve(
            [1],
            observed => observed[0] = 2,
            {object: [2], type: 'update', name: '0', oldValue: 1}
          );
        });
        it('should report change on push', function () {
          expectObserve(
            [],
            observed => observed.push(1),
            {object: [1], type: 'add', name: '0', oldValue: undefined}
          );
        });
        it('should report change on pop', function () {
          expectObserve(
            [1],
            observed => observed.pop(1),
            {object: [], type: 'delete', name: '0', oldValue: 1}
          );
        });
        it('should report change on shift', function () {
          expectBulkObserve(
            [1, 2],
            observed => observed.shift(), [
              {object: [2], type: 'update', name: '0', oldValue: 1},
              {object: [2], type: 'delete', name: '1', oldValue: 2}
            ]
          );
        });
        it('should report change on unshift', function () {
          expectBulkObserve(
            [1, 2],
            observed => observed.unshift(0), [
              {object: [0, 1, 2], type: 'add', name: '2', oldValue: undefined},
              {object: [0, 1, 2], type: 'update', name: '1', oldValue: 2},
              {object: [0, 1, 2], type: 'update', name: '0', oldValue: 1}
            ]
          );
        });
        it('should report change on copyWithin', function () {
          expectBulkObserve(
            [1, 2, 3, 4],
            observed => observed.copyWithin(2, 0), [
              {object: [1, 2, 1, 2], type: 'update', name: '2', oldValue: 3},
              {object: [1, 2, 1, 2], type: 'update', name: '3', oldValue: 4}
            ]
          );
        });
        it('should report change on fill', function () {
          expectBulkObserve(
            [1, 2],
            observed => observed.fill(1), [
              {object: [1, 1], type: 'update', name: '0', oldValue: 1},
              {object: [1, 1], type: 'update', name: '1', oldValue: 2}
            ]
          );
        });
        it('should report change on splice', function () {
          expectBulkObserve(
            [1, 4, 3],
            observed => observed.splice(1, 1, 2 ), [
              {object: [1, 2, 3], type: 'update', name: '1', oldValue: 4}
            ]
          );
        });
        it('should report change on reverse', function () {
          expectBulkObserve(
            [1, 2],
            observed => observed.reverse(), [
              {object: [2, 1], type: 'update', name: '0', oldValue: 1},
              {object: [2, 1], type: 'update', name: '1', oldValue: 2}
            ]
          );
        });
        it('should report change on sort', function () {
          expectBulkObserve(
            [2, 1],
            observed => observed.sort(), [
              {object: [1, 2], type: 'update', name: '1', oldValue: 1},
              {object: [1, 2], type: 'update', name: '0', oldValue: 2}
            ]
          );
        });
      });
      describe('Map', function () {
        it('should report change on set (creation)', function () {
          expectObserve(
            new Map(),
            observed => observed.set('a', 1),
            {object: new Map([['a', 1]]), type: 'add', name: 'a', oldValue: undefined}
          );
        });
        it('should report change on set (modification)', function () {
          expectObserve(
            new Map([['a', 1]]),
            observed => observed.set('a', 2),
            {object: new Map([['a', 2]]), type: 'update', name: 'a', oldValue: 1}
          );
        });
        it('should report change on delete', function () {
          expectObserve(
            new Map([['a', 1]]),
            observed => observed.delete('a'),
            {object: new Map(), type: 'delete', name: 'a', oldValue: 1}
          );
        });
        it('should report change on clear', function () {
          expectBulkObserve(
            new Map([['a', 1], ['b', 2]]),
            observed => observed.clear(), [
              {object: new Map(), type: 'delete', name: 'a', oldValue: 1},
              {object: new Map(), type: 'delete', name: 'b', oldValue: 2}
          ]);
        });
        it('should read value correctly', function () {
          const testee = new Map([['a', 1]]);
          const observed = observe(testee);
          expect(observed.get('a')).to.equal(1);
        });
        it('should iterate correctly', function () {
          const testee = [['a', 1], ['b', 2]];
          const observed = observe(new Map(testee));
          expect([...observed]).to.deep.equal(testee);
        });
      });
      describe('Set', function () {
        it('should report change on add', function () {
          expectObserve(
            new Set(),
            observed => observed.add('a'),
            {object: new Set(['a']), type: 'add', name: 'a', oldValue: undefined}
          );
        });
        it('should report change upon adding an existing item', function () {
          expectObserve(
            new Set(['a']),
            observed => observed.add('a'),
            null
          );
        });
        it('should report change on delete', function () {
          expectObserve(
            new Set(['a']),
            observed => observed.delete('a'),
            {object: new Set(), type: 'delete', name: 'a', oldValue: 'a'}
          );
        });
        it('should report change on clear', function () {
          expectBulkObserve(
            new Set(['a', 'b']),
            observed => observed.clear(), [
              {object: new Set(), type: 'delete', name: 'a', oldValue: 'a'},
              {object: new Set(), type: 'delete', name: 'b', oldValue: 'b'}
          ]);
        });
        it('should iterate correctly', function () {
          const testee = ['a', 'b'];
          const observed = observe(new Set(testee));
          expect([...observed]).to.deep.equal(testee);
        });
      });
      describe('Date', function () {
        it('should report change on modification', function() {
          expectObserve(
            new Date(1995, 10),
            observed => observed.setYear(2000),
            {object: new Date(2000, 10), type: 'update', name: 'setYear', oldValue: 95}
          );
        });
        it('should behave like a normal Date', function() {
          const testee = new Date(1995, 10);
          const observed = observe(testee, () => {});
          observed.setYear(1998);
          expect(observed.getYear()).to.equal(98);
        });
      });
      describe('Other Object', function () {
        it('should report change on modification', function() {
          expectObserve(
            new Error('a'),
            observed => observed.message = 'b',
            {object: new Error('b'), type: 'update', name: 'message', oldValue: 'a'}
          );
        });
      });
    });
    describe('options: reportLength: true', function() {
      describe('Array', function () {
        it('should report length changes', function() {
          expectBulkObserve(
            [],
            observed => observed.push(1), [
              {object: [1], type: 'add', name: '0', oldValue: undefined},
              {object: [1], type: 'update', name: 'length', oldValue: undefined}
            ],
            {reportLength: true}
          );
        });
      });
    });
    describe('options: deliveryMode: bulk', function() {
      describe('Object', function () {
        it('should report an array of changes', function() {
          expectObserve(
            {},
            observed => observed.a = 2,
            [{object: {a: 2}, type: 'add', name: 'a', oldValue: undefined}],
            {deliveryMode: 'bulk'}
          );
        });
      });
      describe('Array', function () {
        it('should report an array of changes', function() {
          expectObserve(
            [],
            observed => observed.push(1, 2), [
              {object: [1, 2], type: 'add', name: '0', oldValue: undefined},
              {object: [1, 2], type: 'add', name: '1', oldValue: undefined},
            ],
            {deliveryMode: 'bulk'}
          );
        });
        it('should behave like a normal Array', function() {
          const testee = [1, 2];
          const observed = observe(testee, () => {}, {deliveryMode: 'bulk'});
          expect(observed.slice(1)).to.deep.equal([2]);
        });
      });
      describe('Map', function () {
        it('should report an array of changes on set', function() {
          expectObserve(
            new Map(),
            observed => observed.set('a', 2),
            [{object: new Map([['a', 2]]), type: 'add', name: 'a', oldValue: undefined}],
            {deliveryMode: 'bulk'}
          );
        });
        it('should report an array of changes on clear', function() {
          expectObserve(
            new Map([['a', 1], ['b', 2]]),
            observed => observed.clear(), [
              {object: new Map(), type: 'delete', name: 'a', oldValue: 1},
              {object: new Map(), type: 'delete', name: 'b', oldValue: 2},
            ],
            {deliveryMode: 'bulk'}
          );
        });
      });
      describe('Set', function () {
        it('should report an array of changes on add', function() {
          expectObserve(
            new Set(),
            observed => observed.add(2),
            [{object: new Set([2]), type: 'add', name: 2, oldValue: undefined}],
            {deliveryMode: 'bulk'}
          );
        });
        it('should report an array of changes on clear', function() {
          expectObserve(
            new Set([1, 2]),
            observed => observed.clear(), [
              {object: new Set(), type: 'delete', name: 1, oldValue: 1},
              {object: new Set(), type: 'delete', name: 2, oldValue: 2},
            ],
            {deliveryMode: 'bulk'}
          );
        });
      });
      describe('Date', function () {
        it('should report an array of changes', function() {
          expectObserve(
            new Date(1995, 10),
            observed => observed.setYear(2000), [
              {object: new Date(2000, 10), type: 'update', name: 'setYear', oldValue: 95}
            ],
            {deliveryMode: 'bulk'}
          );
        });
      });
    });
  });
  describe('options: deliveryMode: singleOperation', function() {
    describe('Object', function () {
      it('should report changes as if the option was singleUpdate', function() {
        expectObserve(
          {},
          observed => observed.a = 2,
          {object: {a: 2}, type: 'add', name: 'a', oldValue: undefined}
        );
      });
    });
    describe('Map', function () {
      it('should report a single change on clear', function() {
        expectObserve(
          new Map([['a', 1], ['b', 2]]),
          observed => observed.clear(),
          {object: new Map(), type: 'clear'},
          {deliveryMode: 'singleOperation'}
        );
      });
    });
    describe('Set', function () {
      it('should report a single change on clear', function() {
        expectObserve(
          new Set(['a', 'b']),
          observed => observed.clear(),
          {object: new Set(), type: 'clear'},
          {deliveryMode: 'singleOperation'}
        );
      });
    });
    describe('Array', function () {
      it('should report a single change on reverse', function() {
        expectObserve(
          [3, 2, 1],
          observed => observed.reverse(),
          {object: [1, 2, 3], type: 'reverse'},
          {deliveryMode: 'singleOperation'}
        );
      });
      it('should behave like a normal Array', function() {
        const testee = [1, 2];
        const observed = observe(testee, () => {}, {deliveryMode: 'singleOperation'});
        expect(observed.slice(1)).to.deep.equal([2]);
      });
    });
  });
  describe('pause', function () {
    it('should throw if the object is not observed', function() {
      expect(()=> pause({})).to.throw();
    });
    it('should pause the observation', function() {
      const testee = [1, 2];
      let test = false;
      const observed = observe(testee, () => test = true);
      pause(observed);
      observed.pop();
      expect(test).to.be.false;
    });
  });
  describe('resume', function () {
    it('should throw if the object is not observed', function() {
      expect(()=> resume({})).to.throw();
    });
    it('should resume the observation', function() {
      const testee = [1, 2];
      let test = false;
      const observed = observe(testee, () => test = true);
      pause(observed);
      resume(observed);
      observed.push(3);
      expect(test).to.be.true;
    });
  });
  describe('unobserve', function () {
    it('should return the target object', function() {
      const testee = [1, 2];
      const observed = observe(testee);
      expect(unobserve(observed)).to.equal(testee);
    });
    it("should throw an error if it's not an observed object", function() {
      expect(() => unobserve({})).to.throw();
    });
  });
});
