import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type MutableRefObject, useRef, useCallback, useEffect } from "react";
import { toast } from "@rootcx/ui";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_ID = "documents";

export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  ) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return debounced;
}

export async function withToast<T>(
  fn: () => Promise<T>,
  errorMsg: string,
  successMsg?: string
): Promise<T | undefined> {
  try {
    const result = await fn();
    if (successMsg) toast.success(successMsg);
    return result;
  } catch {
    toast.error(errorMsg);
    return undefined;
  }
}
