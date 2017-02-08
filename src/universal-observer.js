import {observedMap} from './observed-map';
import ProxyFactory from './proxy-factory';

export function observe(target, callback, options = {}) {
  if (target !== Object(target)) {
    throw new Error("Primitive values can't be observed.");
  }

  const config = {
    deliveryMode: 'singleUpdate',
    reportLength: false
  };

  if (options.deliveryMode !== undefined) {
    config.deliveryMode = options.deliveryMode;
  }

  if (options.reportLength !== undefined) {
    config.reportLength = options.reportLength;
  }

  const factory = new ProxyFactory(target, callback, config);
  const proxy = factory.make(target);
  observedMap.set(proxy, factory);
  return proxy;
}

export function pause(proxy) {
  if (!observedMap.has(proxy)) {
    throw new Error("Can't pause a non-observed object.");
  }
  observedMap.get(proxy).pause = true;
}

export function resume(proxy) {
  if (!observedMap.has(proxy)) {
    throw new Error("Can't resume a non-observed object.");
  }
  observedMap.get(proxy).pause = false;
}

export function unobserve(proxy) {
  if (!observedMap.has(proxy)) {
    throw new Error("Can't unobserve a non-observed object.");
  }
  const factory = observedMap.get(proxy);
  // Proxy.revocable is not widely supported atm
  factory.deactivate();
  observedMap.delete(proxy);
  return factory.target;
}
