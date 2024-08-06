type ProjectField = {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

type OptionType = { label: string; value: string };

type ResultType = Record<string, string | number | boolean | null>;

type ErrorType = Record<string, string | string[]>;

export type { ProjectField, OptionType, ResultType, ErrorType };
