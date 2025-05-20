import { useEffect, useState } from "react";

export const useDebouncedValue = (inputValue: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(inputValue);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(inputValue), delay);
    return () => clearTimeout(timeout);
  }, [inputValue, delay]);

  return debouncedValue;
};

export const useDelayedValue = (delay?: number) => {
  const [showValue, setShowValue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowValue(true), delay || 500);
    return () => clearTimeout(timer);
  });

  return showValue;
};

export const useCyclicValue = (start: number, end: number, pause?: number) => {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v + 1) % (end + 1));
    }, pause || 500);
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
