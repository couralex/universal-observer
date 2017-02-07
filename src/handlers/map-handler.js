import BaseHandler from './base-handler';

export default class MapHandler extends BaseHandler {

  constructor(factory) {
    super(factory);
    switch(this._factory.config.deliveryMode) {
      case 'bulk':
        this._callback = change => this._factory.callback([change]);
        this._clear = this._clearBulk;
        break;
      case 'singleOperation':
        this._clear = this._clearSingleOperation;
    }
  }

  get(target, key, receiver) {
    switch (key) {
      case 'get': return k => this._get(target, k, receiver);
      case 'set': return (k, v) => this._set(target, k, v);
      case 'delete': return k => this._delete(target, k);
      case 'clear': return () => this._clear(target);
    }
    return target[key].bind(target);
  }

  _get(target, key) {
    const element = target.get(key);
    const proxy = this._factory.make(element);
    return proxy;
  }

  _set(target, key, value) {
    const type = target.has(key) ? 'update' : 'add';
    const oldValue = target.get(key);
    const ret = target.set(key, value);
    this._callback({
      object: target,
      type,
      name: key,
      oldValue
    });
    return ret;
  }

  _delete(target, key) {
    const oldValue = target.get(key);
    const ret = target.delete(key);
    this._callback({
      object: target,
      type: 'delete',
      name: key,
      oldValue: oldValue
    });
    return ret;
  }

  _clear(target) {
    for (let [key, value] of target) {
      target.delete(key);
      this._callback({
        object: target,
        type: 'delete',
        name: key,
        oldValue: value
      });
    }
  }

  _clearBulk(target) {
    const changes = [];
    for (let [key, value] of target) {
      target.delete(value);
      changes.push({
        object: target,
        type: 'delete',
        name: key,
        oldValue: value
      });
    }
    // call the genuine (non bulk) this._factory.callback and pass the array
    this._factory.callback(changes);
  }

  _clearSingleOperation(target) {
    for (let [key] of target) {
      target.delete(key);
    }
    this._callback({
      object: target,
      type: 'clear'
    });
  }
}
