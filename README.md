# universal-observe
[![Build Status](https://travis-ci.org/couralex/universal-observe.svg?branch=master)](https://travis-ci.org/couralex/universal-observe)
[![Coverage Status](https://coveralls.io/repos/github/couralex/universal-observe/badge.svg?branch=master)](https://coveralls.io/github/couralex/universal-observe?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

universal-observe observes changes in objects, arrays, maps, sets, dates, etc.  
The implementation is based on es6 proxies, so it must be used in an environnement supporting them.

## Features
- synchronous delivery
- deep observation
- circular references handling
- different delivery modes (single/bulk)
- lazy construction of proxies (proxies on nested properties are constructed only when needed, leading to a performance increase in some cases)


## Installation

```
npm install universal-observe
```

## Example

```js
import {observe} from 'universal-observe';

const obj = {a: 1, b: [1, 2]};
const observed = observe(obj, change => console.log(change));

observed.a = 2; // console: {object: obj, type: 'update', name: 'a', oldValue: 1}
observed.b.push(3); // console: {object: obj.b, type: 'add', name: '2', oldValue: undefined}
observed.c = 3; // console: {object: obj, type: 'add', name: 'c', oldValue: undefined}
```

## API

```js
import {observe, unobserve, pause, resume} from 'universal-observe';

observe(object, callback, options); // calls <callback> when a change is observed on <object>
unobserve(object); // removes the observation trap
pause(object); // pauses the observation
resume(object); // resumes a paused observation
```

## The change object

When a change is observed, the specified callback is called with one argument, the change object, which has the following properties:
- object: the direct object being modified
- type: can be 'update, 'add', 'delete'
- name: the name of the property being changed
- oldValue: the value before the change

For Date objects, `name` is the name of the mutator method, e. g. : setYear, setDate, ...


## Options

Default options are :

```js
const observed = observe(obj, callback, {
  deliveryMode: 'singleUpdate',
  reportLength: false
});
```

### `deliveryMode`
*accepted values*: 'singleUpdate'(default), 'bulk', 'singleOperation'

Specifies the delivery mode, i.e. when the callback is called and what argument is passed to the callback.
This is useful for mutator functions like sort, reverse, ... which triggers multiple changes at once.

DeliveryMode may be:
- singleUpdate: each individual change triggers the callback
- bulk: groups the changes in an array. The array is passed instead of a single change object, even if there is only one change.
- singleOperation: multiple changes are merged into one change object. The `type` property is the name of the mutator (sort, reverse, ...). This options is faster than the bulk option.

Example :
```js
const observed = observe([1, 2], callback, options);
observed.reverse();

// deliveryMode = singleUpdate : reverse triggers 2 calls with one change object each time
// deliveryMode = bulk : reverse triggers 1 call with an array of 2 change object
// deliveryMode = singleOperation : reverse triggers 1 call with 1 change object whose type is 'reverse'
```



### `reportLength`
*accepted values*: false (default) or true

When a change modifies the length of an array, observation also reports the modification of the `length` property.

```js
const observed = observe([], callback, {reportLength: true});
observed.push(1);

// callback is called 2 times with the following parameters:
// 1) {object: [1], type: 'add', name: '0', oldValue: undefined}
// 2) {object: [1], type: 'update', name: 'length', oldValue: 0}
});
```
