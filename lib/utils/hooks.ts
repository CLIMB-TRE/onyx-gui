import { useEffect, useState } from "react";

const useDebouncedValue = (inputValue: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(inputValue);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, delay]);
  return debouncedValue;
};

const useQueryRefresh = (
  refresh: number | null,
  dataUpdatedAt: number,
  errorUpdatedAt: number,
  refetch: () => void,
  setLastUpdated: (lastUpdated: string | null) => void
) => {
  useEffect(() => {
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

export { useDebouncedValue, useQueryRefresh };
