export default class BaseHandler {
  constructor(factory) {
    this._factory = factory;
    this._callback = this._factory.callback;
  }
}
