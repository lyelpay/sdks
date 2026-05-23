import type { Ref } from "react";

import { cn } from "./cn";

export function mergeClassNames(
  ...classNames: Array<string | undefined | false | null>
) {
  return cn(classNames.filter(Boolean));
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

export function mergeProps<T extends { className?: string }, U extends { className?: string }>(
  base: T,
  overrides?: U,
) {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    className: mergeClassNames(base.className, overrides.className),
  };
}

