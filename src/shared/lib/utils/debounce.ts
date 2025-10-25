export function debounce(fn: Function, delay: number = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return function (this: void | ThisType<void>, ...args: unknown[]) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
