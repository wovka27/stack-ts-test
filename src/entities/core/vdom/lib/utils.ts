import { type ClassValue, clsx } from 'clsx';

import type { Patch, VNodeProps } from '../model/vdom.types';

type Listener = EventListenerOrEventListenerObject;
const elementListeners = new WeakMap<Node, Map<string, Listener>>();

function isListenerKey(key: string) {
  return key.startsWith('on') && key.length > 2;
}

function setListener(element: Node, eventName: string, listener?: Listener | null) {
  let map = elementListeners.get(element);
  if (!map) {
    map = new Map();
    elementListeners.set(element, map);
  }
  const prev = map.get(eventName);
  if (prev && element instanceof EventTarget) {
    element.removeEventListener(eventName, prev);
  }
  if (listener && element instanceof EventTarget) {
    element.addEventListener(eventName, listener);
    map.set(eventName, listener);
  } else {
    map.delete(eventName);
  }
}

export function updateProps(
  element: HTMLElement,
  newProps: VNodeProps<any> = {},
  oldProps: VNodeProps<any> = {}
): void {
  const newClass = clsx(newProps.class as ClassValue);
  const oldClass = clsx(oldProps.class as ClassValue);
  if (newClass !== oldClass) {
    if (newClass) element.className = newClass;
    else element.removeAttribute('class');
  }

  if (newProps.ref !== oldProps.ref) {
    if (isFn(oldProps.ref)) oldProps.ref(null);
    if (isFn(newProps.ref)) newProps.ref(element);
  }

  const newStyle = newProps.style;
  const oldStyle = oldProps.style;
  if (newStyle !== oldStyle) {
    if (typeof newStyle === 'string') {
      (element as HTMLElement).style.cssText = newStyle;
    } else if (isObj(newStyle)) {
      const elStyle = (element as HTMLElement).style;

      if (isObj(oldStyle)) {
        for (const k of Object.keys(oldStyle)) {
          if (!(k in newStyle)) (elStyle as any)[k] = '';
        }
      }
      for (const key of Object.keys(newStyle)) {
        (elStyle as any)[key] = (newStyle as any)[key];
      }
    } else {
      (element as HTMLElement).style.cssText = '';
    }
  }

  if (newProps.dataset !== oldProps.dataset) {
    const dataset = (element as HTMLElement).dataset;
    if (isObj(oldProps.dataset)) {
      for (const k of Object.keys(oldProps.dataset)) {
        if (!newProps.dataset || !(k in newProps.dataset)) delete (dataset as any)[k];
      }
    }
    if (isObj(newProps.dataset)) {
      for (const k of Object.keys(newProps.dataset)) {
        (dataset as any)[k] = String((newProps.dataset as any)[k]);
      }
    }
  }

  const skip = new Set(['class', 'children', 'key', 'ref', 'style', 'dataset']);
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
  for (const key of allKeys) {
    if (skip.has(key) || isListenerKey(key)) continue;

    const newValue = (newProps as any)[key];
    const oldValue = (oldProps as any)[key];

    if (newValue === oldValue) continue;

    const booleanAttrs = new Set(['checked', 'disabled', 'selected', 'readonly', 'multiple', 'hidden']);
    if (!isNonNullable(newValue) || newValue === false) {
      if (booleanAttrs.has(key)) {
        (element as any)[key] = false;
        element.removeAttribute(key);
      } else {
        element.removeAttribute(key);
      }
    } else {
      if (booleanAttrs.has(key)) {
        (element as any)[key] = true;
        element.setAttribute(key, '');
      } else if (
        key === 'value' &&
        (element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement)
      ) {
        (element as any).value = String(newValue);
      } else {
        element.setAttribute(key, String(newValue));
      }
    }
  }

  const eventKeys = [...Object.keys(oldProps).filter(isListenerKey), ...Object.keys(newProps).filter(isListenerKey)];
  for (const eventKey of new Set(eventKeys)) {
    const eventName = eventKey.slice(2).toLowerCase();
    const newListener = (newProps as any)[eventKey] as Listener | undefined;
    const oldListener = (oldProps as any)[eventKey] as Listener | undefined;

    if (newListener === oldListener) continue;

    setListener(element, eventName, newListener ?? null);
  }
}

export function applyPatches(dom: Node, patches: Patch[]): void {
  patches.forEach((patch) => {
    try {
      patch(dom);
    } catch (error) {}
  });
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isFn<T>(value: T): value is T & Function {
  return typeof value === 'function';
}

export function isObj<T extends Record<keyof T, T[keyof T]>>(value: T): value is T {
  return isNonNullable(value) && !Array.isArray(value) && typeof value === 'object';
}

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true;

  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;

  let countA = 0;
  let countB = 0;

  for (const key in a) {
    if (!(key in b) || a[key] !== b[key]) return false;
    countA++;
  }

  for (const _ in b) countB++;

  return countA === countB;
}

export function deepEqual<T>(a: T, b: T, cache: WeakMap<object, Set<object>> = new WeakMap()): boolean {
  if (a === b) return true;

  if (a === null || b === null || typeof a !== typeof b) return a === b;

  if (typeof a !== 'object') return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  let bSet = cache.get(objA);

  if (bSet?.has(objB)) return true;

  if (!bSet) {
    bSet = new Set();
    cache.set(objA, bSet);
  }

  bSet.add(objB);

  if (Array.isArray(objA) && Array.isArray(objB)) {
    if (objA.length !== objB.length) return false;

    for (let i = 0; i < objA.length; i++) {
      if (!deepEqual(objA[i], objB[i], cache)) return false;
    }

    return true;
  }

  if (Array.isArray(objA) !== Array.isArray(objB)) return false;

  if (!isObj(objA) || !isObj(objB)) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!(key in objB) || !deepEqual(objA[key], objB[key], cache)) return false;
  }

  return true;
}

export function getNestedValue(obj: any, path: string): any {
  return path
    .split('.')
    .reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), obj);
}

export function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const nestedObj = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  nestedObj[lastKey] = value;
  return obj;
}
