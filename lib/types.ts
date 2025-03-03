type FieldType =
  | "text"
  | "choice"
  | "integer"
  | "decimal"
  | "date"
  | "datetime"
  | "bool"
  | "relation"
  | "array"
  | "structure"
  | "";

type GraphType = "line" | "bar" | "pie" | "";

type ProjectField = {
  type: FieldType;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

type FilterConfig = {
  key: string;
  type: FieldType;
  field: string;
  lookup: string;
  value: string;
};

type GraphConfig = {
  key: string;
  type: GraphType;
  field: string;
  groupBy: string;
  groupMode: string;
  filters: FilterConfig[];
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

type TypeObject = {
  type: FieldType;
  lookups: string[];
};

type LookupObject = {
  lookup: string;
  description: string;
};

type ChoiceDescription = {
  description: string;
  is_active: boolean;
};

type OptionType = { label: string; value: string };

type ErrorType = Record<string, string | string[]>;

type RecordType = Record<
  string,
  string | number | boolean | object | null | RecordType[]
>;

type SummaryType = Record<"count", number> &
  Record<string, string | number | boolean | object | null>;

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

type ProjectPermissionType = {
  project: string;
  scope: string;
  actions: string[];
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

type FieldsResponse = SuccessResponse & {
  data: {
    name: string;
    fields: Record<string, ProjectField>;
  };
};

type ChoicesResponse = SuccessResponse & {
  data: Record<string, ChoiceDescription>;
};

// TODO: Use a generic response type
// type Response<T> =
//   | ErrorResponse
//   | {
//       status: "success";
//       code: number;
//       data: T;
//     };

export type {
  FieldType,
  GraphType,
  ProjectField,
  FilterConfig,
  GraphConfig,
  TypeObject,
  LookupObject,
  ChoiceDescription,
  OptionType,
  ErrorType,
  RecordType,
  SummaryType,
  AnalysisType,
  ProjectPermissionType,
  ErrorResponse,
  SuccessResponse,
  RecordListResponse,
  RecordDetailResponse,
  FieldsResponse,
  ChoicesResponse,
};

export { ExportStatus };
