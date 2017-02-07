import BaseHandler from './base-handler';

export default class SetHandler extends BaseHandler {

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

  get(target, key) {
    switch (key) {
      case 'add': return k => this._add(target, k);
      case 'delete': return k => this._delete(target, k);
      case 'clear': return () => this._clear(target);
    }
    return target[key].bind(target);
  }

  _add(target, key) {
    const exist = target.has(key);
    const ret = target.add(key);
    if (!exist) {
      this._callback({
        object: target,
        type: 'add',
        name: key,
        oldValue: undefined
      });
    }
    return ret;
  }

  _delete(target, key) {
    const oldValue = key;
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
    for (let value of target) {
      target.delete(value);
      this._callback({
        object: target,
        type: 'delete',
        name: value,
        oldValue: value
      });
    }
  }

  _clearBulk(target) {
    const changes = [];
    for (let value of target) {
      target.delete(value);
      changes.push({
        object: target,
        type: 'delete',
        name: value,
        oldValue: value
      });
    }
    // call the genuine (non bulk) this._factory.callback and pass the array
    this._factory.callback(changes);
  }

  _clearSingleOperation(target) {
    for (let value of target) {
      target.delete(value);
    }
    this._callback({
      object: target,
      type: 'clear'
    });
  }
}
