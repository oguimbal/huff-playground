import { useCallback, useState } from 'react';
import { useEventListener, useIsomorphicLayoutEffect } from 'usehooks-ts';


export type HexString = `0x${string}`;

export interface Size {
  width: number
  height: number
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  (node: T | null) => void,
  Size,
] {
  // Mutable values like 'ref.current' aren't valid dependencies
  // because mutating them doesn't re-render the component.
  // Instead, we use a state as a ref to be reactive.
  const [ref, setRef] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  // Prevent too many rendering using useCallback
  const handleSize = useCallback(() => {
    setSize({
      width: ref?.offsetWidth || 0,
      height: ref?.offsetHeight || 0,
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.offsetHeight, ref?.offsetWidth])

  useEventListener('resize', handleSize)

  useIsomorphicLayoutEffect(() => {
    handleSize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.offsetHeight, ref?.offsetWidth])

  return [setRef, size]
}


export function deepEqual<T>(obj1: T, obj2: T) {
  if (obj1 === obj2) {
    return true;
  } else if (isObject(obj1) && isObject(obj2)) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
      return false;
    }
    for (const prop in obj1) {
      if (!deepEqual(obj1[prop], obj2[prop])) {
        return false;
      }
    }
    return true;
  }
  // Private
  function isObject(obj: any): obj is object {
    if (typeof obj === 'object' && obj != null) {
      return true;
    } else {
      return false;
    }
  }
}



export function by<TKey, TOrig, TTarget>(
  col: TOrig[],
  key: (val: TOrig) => TKey,
  value: (val: TOrig) => TTarget,
): Map<TKey, TTarget>;
export function by<TKey, T>(col: T[], key: (val: T) => TKey, overrideDuplicates?: boolean): Map<TKey, T>;
export function by(col: any[], key: (val: any) => string, valOrKey?: boolean | ((val: any) => any)): Map<any, any> {
  const ret = new Map();
  const val = typeof valOrKey === 'boolean' || !valOrKey ? (x: any) => x : valOrKey;
  const ovr = valOrKey === true;
  for (const v of col) {
    const k = key(v);
    if (!ovr && ret.has(k)) {
      throw new Error(`Duplicate key "${k}"`);
    }
    ret.set(k, val(v));
  }
  return ret;
}

export function toLookup<T, TKey>(
  array: readonly T[],
  keySelector: (item: T, idx: number) => TKey,
): Map<TKey, T[]> {
  const map = new Map<TKey, T[]>();
  let i = 0;
  for (const a of array) {
    const key = keySelector(a, i++);
    const arr = map.get(key);
    if (arr) {
      arr.push(a);
    } else {
      map.set(key, [a]);
    }
  }
  return map;
}

export type nil = null | undefined;

export function nullish(val: any): val is nil {
  return val === null || val === undefined;
}

export function notNil<T>(value: (T | nil)[]): Exclude<T, null>[] {
  return value.filter(x => !nullish(x)) as any[];
}

export function isHexString(str: string): str is HexString {
  return /^0x[0-9a-fA-F]*$/.test(str);
}