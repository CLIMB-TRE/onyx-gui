import { useEffect, useState } from "react";
import { OnyxProps } from "../interfaces";

export function useDebouncedValue<T>(inputValue: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(inputValue);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(inputValue), delay);
    return () => clearTimeout(timeout);
  }, [inputValue, delay]);

  return debouncedValue;
}

export const useDelayedValue = (delay?: number) => {
  const [showValue, setShowValue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setShowValue(true),
      delay === undefined ? 500 : delay
    );
    return () => clearTimeout(timer);
  });

  return showValue;
};

export const useCyclicValue = (start: number, end: number, pause?: number) => {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v + 1) % (end + 1));
    }, pause || 200);
    return () => clearInterval(interval);
  });

  return value;
};

export const useQueryRefresh = (
  refresh: number | null,
  dataUpdatedAt: number,
  errorUpdatedAt: number,
  refetch: () => void,
  setLastUpdated: (lastUpdated: string | null) => void
) => {
  useEffect(() => {
    // The refresh value begins as null, and is set to a number when the user clicks the refresh button.
    // It then alternates between 0 and 1 on every refresh click, to trigger the refetch in this useEffect.
    // If the refresh value is null, then the user has not clicked the refresh button, and we do not want to refetch.
    if (refresh === null) return;
    refetch();
  }, [refetch, refresh]);

  useEffect(() => {
    setLastUpdated(
      errorUpdatedAt
        ? new Date(errorUpdatedAt).toLocaleString()
        : dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleString()
        : null
    );
  }, [dataUpdatedAt, errorUpdatedAt, setLastUpdated]);
};

export function usePersistedState<T>(
  props: OnyxProps,
  key: string,
  initialValue: T
) {
  const { getItem, setItem } = props;

  // Initialise state with the persisted value or the initial value
  const [state, setState] = useState<T>(() => {
    return (getItem && (getItem(key) as T)) ?? initialValue;
  });

  // Use a debounced value to avoid excessive writes
  const debouncedState = useDebouncedValue(state, 500);

  // Update the persisted state when the debounced state changes
  useEffect(() => {
    if (setItem) setItem(key, debouncedState);
  }, [setItem, key, debouncedState]);

  // Clear the persisted state when the component unmounts
  useEffect(() => {
    return () => {
      if (setItem) setItem(key, null);
    };
  }, [setItem, key]);

  return [state, setState] as const;
}
