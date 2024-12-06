type ProjectField = {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

type FilterConfig = {
  key: string;
  field: string;
  lookup: string;
  value: string;
};

type GraphConfig = {
  key: string;
  type: string;
  field: string;
  groupBy: string;
  groupMode: string;
  yAxisType: string;
};

enum ExportStatus {
  READY,
  RUNNING,
  WRITING,
  FINISHED,
  CANCELLED,
  ERROR,
}

type OptionType = { label: string; value: string };

type ErrorType = Record<string, string | string[]>;

type RecordType = Record<
  string,
  string | number | boolean | object | null | RecordType[]
>;

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

type ErrorResponse = {
  status: "fail" | "error";
  code: number;
  messages: ErrorType;
};

type SuccessResponse = {
  status: "success";
  code: number;
};

type RecordListResponse = SuccessResponse & {
  data: RecordType[];
  next: string | null;
  previous: string | null;
};

type RecordDetailResponse = SuccessResponse & {
  data: RecordType;
};

type AnalysisListResponse = SuccessResponse & {
  data: AnalysisType[];
  next?: string;
  previous?: string;
};

type AnalysisDetailResponse = SuccessResponse & {
  data: AnalysisType;
};

export type {
  ProjectField,
  FilterConfig,
  GraphConfig,
  OptionType,
  ErrorType,
  RecordType,
  AnalysisType,
  ErrorResponse,
  SuccessResponse,
  RecordListResponse,
  RecordDetailResponse,
  AnalysisListResponse,
  AnalysisDetailResponse,
};

export { ExportStatus };
