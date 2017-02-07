import BaseHandler from './base-handler';

export default class DateHandler extends BaseHandler {

  constructor(factory) {
    super(factory);
    if (this._factory.config.deliveryMode === 'bulk') {
      this._callback = change => this._factory.callback([change]);
    }
  }

  get(target, key, receiver) {
    if (key.startsWith('set')) {
      return value => this._set(target, key, value);
    }
    const element = Reflect.get(target, key, receiver).bind(target);
    return this._factory.make(element);
  }

  _set(target, key, value) {
    const property = key.substring(1);
    // transform 'set' to 'get'
    const oldValue = target['g' + property](value);
    const ret = target[key](value);
    this._callback({
      object: target,
      type: 'update',
      name: key,
      oldValue
    });
    return ret;
  }

}
