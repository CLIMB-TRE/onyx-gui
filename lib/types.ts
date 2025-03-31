enum RecordTabKeys {
  Data = "record-data-tab",
  History = "record-history-tab",
  Analyses = "record-analyses-tab",
}

enum AnalysisTabKeys {
  Data = "analysis-data-tab",
  History = "analysis-history-tab",
  Records = "analysis-records-tab",
  Upstream = "analysis-upstream-tab",
  Downstream = "analysis-downstream-tab",
}

enum DataPanelTabKeys {
  Details = "data-panel-details",
}

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

type ListResponse = SuccessResponse & {
  data: RecordType[];
  next: string | null;
  previous: string | null;
};

type DetailResponse = SuccessResponse & {
  data: RecordType;
};

type FieldsResponse = SuccessResponse & {
  data: {
    name: string;
    description: string;
    fields: Record<string, ProjectField>;
  };
};

type ChoicesResponse = SuccessResponse & {
  data: Record<string, ChoiceDescription>;
};

export type {
  ChoiceDescription,
  ChoicesResponse,
  DetailResponse,
  ErrorResponse,
  ErrorType,
  FieldsResponse,
  FieldType,
  FilterConfig,
  GraphConfig,
  GraphType,
  ListResponse,
  LookupObject,
  OptionType,
  ProjectField,
  ProjectPermissionType,
  RecordType,
  SuccessResponse,
  SummaryType,
  TypeObject,
};

export { AnalysisTabKeys, DataPanelTabKeys, ExportStatus, RecordTabKeys };
