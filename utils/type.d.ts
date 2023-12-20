declare type DeepPartial<T> = T extends object
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

declare type LoopRaf = import('./LoopRaf.js').LoopRaf
