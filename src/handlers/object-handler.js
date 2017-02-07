import BaseHandler from './base-handler';

export default class ObjectHandler extends BaseHandler {

  constructor(factory) {
    super(factory);
    if (this._factory.config.deliveryMode === 'bulk') {
      this._callback = change => this._factory.callback([change]);
    }
  }

  get(target, key, receiver) {
    const element = Reflect.get(target, key, receiver);
    return this._factory.make(element);
  }

  set(target, key, value) {
    const type = key in target ? 'update' : 'add';
    const oldValue = target[key];
    const ret = Reflect.set(target, key, value);
    this._callback({
      object: target,
      type,
      name: key,
      oldValue
    });
    return ret;
  }

  deleteProperty(target, key) {
    const oldValue = target[key];
    const ret = Reflect.deleteProperty(target, key);
    this._callback({
      object: target,
      type: 'delete',
      name: key,
      oldValue
    });
    return ret;
  }

}
