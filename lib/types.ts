export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export enum OnyxTabKeys {
  USER = "user-tab",
  SITE = "site-tab",
  RECORDS = "records-tab",
  ANALYSES = "analyses-tab",
  GRAPHS = "graphs-tab",
}

export enum RecordTabKeys {
  LIST = "record-list-tab",
  DETAIL = "record-detail-tab",
}

export enum AnalysisTabKeys {
  LIST = "analysis-list-tab",
  DETAIL = "analysis-detail-tab",
}

export enum RecordDetailTabKeys {
  DATA = "record-detail-data-tab",
  HISTORY = "record-detail-history-tab",
  ANALYSES = "record-detail-analyses-tab",
}

export enum AnalysisDetailTabKeys {
  DATA = "analysis-detail-data-tab",
  HISTORY = "analysis-detail-history-tab",
  RECORDS = "analysis-detail-records-tab",
  UPSTREAM = "analysis-detail-upstream-tab",
  DOWNSTREAM = "analysis-detail-downstream-tab",
}

export enum DataPanelTabKeys {
  DETAILS = "data-panel-details",
}

export enum GraphPanelTabKeys {
  GRAPH = "graph-panel-graph",
  FILTERS = "graph-panel-filters",
  DISPLAY = "graph-panel-display",
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

export type Project = {
  code: string;
  name: string;
  description: string;
};

export type ProjectPermissionGroup = {
  project: string;
  name: string;
  scope: string;
  actions: string[];
};

export type ProjectField = {
  type: FieldType;
  code: string;
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
