export enum RecordTabKeys {
  Data = "record-data-tab",
  History = "record-history-tab",
  Analyses = "record-analyses-tab",
}

export enum AnalysisTabKeys {
  Data = "analysis-data-tab",
  History = "analysis-history-tab",
  Records = "analysis-records-tab",
  Upstream = "analysis-upstream-tab",
  Downstream = "analysis-downstream-tab",
}

export enum DataPanelTabKeys {
  Details = "data-panel-details",
}

export enum ExportStatus {
  READY,
  RUNNING,
  WRITING,
  FINISHED,
  CANCELLED,
  ERROR,
}

export type FieldType =
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

export type GraphType = "line" | "bar" | "pie" | "";

export type ProjectField = {
  type: FieldType;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

export type FilterConfig = {
  key: string;
  type: FieldType;
  field: string;
  lookup: string;
  value: string;
};

export type GraphConfig = {
  key: string;
  type: GraphType;
  field: string;
  groupBy: string;
  groupMode: string;
  filters: FilterConfig[];
  yAxisType: string;
};

export type TypeObject = {
  type: FieldType;
  lookups: string[];
};

export type LookupObject = {
  lookup: string;
  description: string;
};

export type ChoiceDescription = {
  description: string;
  is_active: boolean;
};

export type OptionType = { label: string; value: string };

export type ErrorType = Record<string, string | string[]>;

export type RecordType = Record<
  string,
  string | number | boolean | object | null | RecordType[]
>;

export type SummaryType = Record<"count", number> &
  Record<string, string | number | boolean | object | null>;

export type ProjectPermissionType = {
  project: string;
  scope: string;
  actions: string[];
};

export interface ErrorResponse {
  status: "fail" | "error";
  code: number;
  messages: ErrorType;
}

export interface SuccessResponse {
  status: "success";
  code: number;
}

export interface ListResponse extends SuccessResponse {
  data: RecordType[];
  next: string | null;
  previous: string | null;
}

export interface DetailResponse extends SuccessResponse {
  data: RecordType;
}

export interface FieldsResponse extends SuccessResponse {
  data: {
    name: string;
    description: string;
    fields: Record<string, ProjectField>;
  };
}

export interface ChoicesResponse extends SuccessResponse {
  data: Record<string, ChoiceDescription>;
}
