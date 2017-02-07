import ObjectHandler from './object-handler';

const mutators = new Set(['push', 'pop', 'shift', 'unshift', 'copyWithin', 'fill', 'splice', 'reverse', 'sort']);

export default class ArrayHandler extends ObjectHandler {

  constructor(factory) {
    super(factory);
    switch(this._factory.config.deliveryMode) {
      case 'bulk':
        this.get = this._getBulk;
        break;
      case 'singleOperation':
        this.get = this._getSingleOperation;
    }
    if (!this._factory.config.reportLength) {
      this.set = this._setLengthDisabled;
    } else {
      this.set = this._setLengthEnabled;
    }
  }

  _getBulk(target, key, receiver) {
    const arr = [];
    if (mutators.has(key)) {
      return (...args) => {
        this.get = super.get;
        this._callback = changes => arr.push(changes);
        const ret = receiver[key](...args);
        this._callback = this._factory.callback;
        this._callback(arr);
        this.get = this._getBulk;
        return ret;
      }
    } else {
      return Reflect.get(target, key, receiver);
    }
  }

  _getSingleOperation(target, key, receiver) {
    if (mutators.has(key)) {
      return (...args) => {
        const ret = target[key](...args);
        this._callback({
          object: target,
          type: key
        });
        return ret;
      }
    } else {
      return Reflect.get(target, key, receiver);
    }
  }

  _setLengthDisabled(target, key, value) {
    if (key === 'length') {
      return Reflect.set(target, key, value);
    }
    return super.set(target, key, value);
  }

  _setLengthEnabled(target, key, value) {
    if (key === 'length') {
      const oldValue = undefined;
      const ret = Reflect.set(target, key, value);
      this._callback({
        object: target,
        type: 'update',
        name: key,
        oldValue
      });
      return ret;
    }
    return super.set(target, key, value);
  }
}
