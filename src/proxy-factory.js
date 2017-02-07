import ArrayHandler from './handlers/array-handler';
import ObjectHandler from './handlers/object-handler';
import MapHandler from './handlers/map-handler';
import SetHandler from './handlers/set-handler';
import DateHandler from './handlers/date-handler';
import StrategyHandler from './handlers/strategy-handler';

const tagMap = {
  '[object Null]': null,
  '[object Undefined]': null,
  '[object Boolean]': ObjectHandler,
  '[object Number]': ObjectHandler,
  '[object String]': ObjectHandler,
  '[object Symbol]': null,
  '[object Date]': DateHandler,
  '[object RegExp]': null,
  '[object Function]': null,
  '[object GeneratorFunction]': null,
  '[object Promise]': null,
  '[object Array]': ArrayHandler,
  '[object Set]': SetHandler,
  '[object Map]': MapHandler,
  '[object WeakSet]': SetHandler,
  '[object WeakMap]': MapHandler,
  '[object Object]': ObjectHandler
};

export default class ProxyFactory {

  constructor(target, callback, config) {
    this._proxyMap = new WeakMap();
    this._callback = callback;
    this._target = target;
    this._handlerCache = new Map();
    this._pause = false;
    this._config = config;
  }

  get callback() {
    return this._callback;
  }

  get target() {
    return this._target;
  }

  get pause() {
    return this._pause;
  }

  get config() {
    return this._config;
  }

  set pause(pause_) {
    this._pause = pause_;
  }

  make(target) {
    if (Object(target) !== target) {
      return target;
    }
    if (this._proxyMap.has(target)) {
      return this._proxyMap.get(target);
    }
    const stringTag = Object.prototype.toString.call(target);
    const handler = stringTag in tagMap ? tagMap[stringTag] : ObjectHandler;
    if (handler === null) {
      return target;
    }
    let strategyHandler;
    if (!this._handlerCache.has(handler)) {
      strategyHandler = new StrategyHandler(this, handler);
      this._handlerCache.set(handler, strategyHandler);
    } else {
      strategyHandler = this._handlerCache.get(handler);
    }
    const proxy = new Proxy(target, strategyHandler);
    this._proxyMap.set(target, proxy);
    return proxy;
  }

  deactivate() {
    this._proxyMap = null;
    this._callback = null;
    this._handlerCache = null;
    this._pause = true;
  }
}
