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

// TODO: Need separate return types for list, detail, errors etc.
type ErrorType = Record<string, string | string[]>;

type ResultType = Record<string, string | number | boolean | object | null>;

type ResultData = {
  status: string;
  code: number;
  next?: string;
  previous?: string;
  data?: ResultType[];
  messages?: ErrorType;
};

type AnalysisType = {
  analysis_id: string;
  published_date: string;
  analysis_date: string;
  name: string;
  command_details: string;
  pipeline_details: string;
  experiment_details: object;
  result: string;
  report: string;
  outputs: string;
  upstream_analyses: string[];
  downstream_analyses: string[];
  identifiers: string[];
  records: string[];
};

type AnalysisData = {
  status: string;
  code: number;
  data?: AnalysisType[];
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
  ErrorType,
  ResultType,
  ResultData,
  AnalysisType,
  AnalysisData,
  GraphConfig,
};

export { ExportStatus };
