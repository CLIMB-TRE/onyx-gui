type ProjectField = {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

type FilterField = {
  key: string;
  field: string;
  lookup: string;
  value: string;
};

type OptionType = { label: string; value: string };

type ResultType = Record<string, string | number | boolean | object | null>;

type ErrorType = Record<string, string | string[]>;

type ResultData = {
  status: string;
  code: number;
  next?: string;
  previous?: string;
  data?: ResultType[];
  messages?: ErrorType;
};

enum ExportStatus {
  READY,
  RUNNING,
  WRITING,
  FINISHED,
  CANCELLED,
  ERROR,
}

type GraphConfig = {
  key: string;
  type: string;
  field: string;
  groupBy: string;
  groupMode: string;
  yAxisType: string;
};

export type {
  ProjectField,
  FilterField,
  OptionType,
  ResultType,
  ErrorType,
  ResultData,
  GraphConfig,
};

export { ExportStatus };
