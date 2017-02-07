export default class StrategyHandler {

  constructor(factory, handler) {
    this._factory = factory;
    this._handler = new handler(this._factory);
  }

  get(target, key, receiver) {
    if (this._factory.pause) {
      return Reflect.get(target, key, receiver);
    } else {
      return this._handler.get(target, key, receiver)
    }
  }

  set(target, key, value) {
    if (this._factory.pause) {
      return Reflect.set(target, key, value);
    } else {
      return this._handler.set(target, key, value);
    }
  }

  deleteProperty(target, key) {
    if (this._factory.pause) {
      return Reflect.deleteProperty(target, key);
    } else {
      return this._handler.deleteProperty(target, key);
    }
  }

}
