export enum HyperLink {
  ONYX_GITHUB = "https://github.com/CLIMB-TRE/onyx",
  ONYX_DOCS = "https://climb-tre.github.io/onyx/",
}

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export enum DarkModeColour {
  BS_BODY_COLOR = "#dee2e6", // Bootstrap body text color for dark mode
  BS_BODY_BG = "#121212", // Bootstrap body background color for dark mode
  BS_GRAY_600 = "#6c757d", // Bootstrap gray-600 for dark mode
  BS_GRAY_900 = "#212529", // Bootstrap gray-900 for dark mode
}

export enum OnyxTabKey {
  USER = "user-tab",
  SITE = "site-tab",
  OVERVIEW = "overview-tab",
  RECORDS = "records-tab",
  ANALYSES = "analyses-tab",
  GRAPHS = "graphs-tab",
}

export enum RecordTabKey {
  LIST = "record-list-tab",
  DETAIL = "record-detail-tab",
}

export enum AnalysisTabKey {
  LIST = "analysis-list-tab",
  DETAIL = "analysis-detail-tab",
}

export enum RecordDetailTabKey {
  DATA = "record-detail-data-tab",
  HISTORY = "record-detail-history-tab",
  ANALYSES = "record-detail-analyses-tab",
}

export enum AnalysisDetailTabKey {
  DATA = "analysis-detail-data-tab",
  HISTORY = "analysis-detail-history-tab",
  RECORDS = "analysis-detail-records-tab",
  UPSTREAM = "analysis-detail-upstream-tab",
  DOWNSTREAM = "analysis-detail-downstream-tab",
}

export enum DataPanelTabKey {
  DETAILS = "data-panel-details",
}

export enum GraphPanelTabKey {
  GRAPH = "graph-panel-graph",
  FILTERS = "graph-panel-filters",
  DISPLAY = "graph-panel-display",
}

export enum ExportStatus {
  READY = "export-ready",
  RUNNING = "export-running",
  WRITING = "export-writing",
  FINISHED = "export-finished",
  CANCELLED = "export-cancelled",
  ERROR = "export-error",
}

export enum ObjectType {
  RECORD = "record",
  ANALYSIS = "analysis",
}

export enum DefaultPrimaryID {
  RECORD = "climb_id",
  ANALYSIS = "analysis_id",
}

export enum FieldType {
  TEXT = "text",
  CHOICE = "choice",
  INTEGER = "integer",
  DECIMAL = "decimal",
  DATE = "date",
  DATETIME = "datetime",
  BOOL = "bool",
  RELATION = "relation",
  ARRAY = "array",
  STRUCTURE = "structure",
  NONE = "",
}

export enum GraphType {
  LINE = "line",
  BAR = "bar",
  PIE = "pie",
  NONE = "",
}

export type TabState = {
  tabKey: OnyxTabKey;
  recordTabKey: RecordTabKey;
  recordDetailTabKey: RecordDetailTabKey;
  recordDataPanelTabKey: DataPanelTabKey;
  recordID: string;
  analysisTabKey: AnalysisTabKey;
  analysisDetailTabKey: AnalysisDetailTabKey;
  analysisDataPanelTabKey: DataPanelTabKey;
  analysisID: string;
};

export type RecentlyViewed = {
  objectType: ObjectType;
  ID: string;
  timestamp: string;
};

export type Navigation = {
  history: TabState[];
  index: number;
};

export type Profile = {
  username: string;
  site: string;
  email: string;
};

// TODO: Add description
export type Project = {
  code: string;
  name: string;
};

export type ProjectPermissionGroup = {
  project: string;
  name: string;
  scope: string;
  actions: string[];
};

export type Field = {
  type: FieldType;
  code: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, Field>;
};

export type Fields = {
  name: string;
  description: string;
  object_type: string; // TODO: Should be ObjectType
  primary_id?: string;
  version: string;
  fields: Record<string, Field>;
  fields_map: Map<string, Field>;
  default_fields?: string[];
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

export type Lookup = {
  lookup: string;
  description: string;
};

export type ChoiceDescription = {
  description: string;
  is_active: boolean;
};

export type Choices = Record<string, ChoiceDescription>;

export type SelectOption = { label: string; value: string };

export type RecordType = Record<
  string,
  string | number | boolean | object | null | RecordType[]
>;

export type InputRow = Record<
  string,
  string | number | boolean | object | null
>;
export type TableRow = Record<string, string | number>;

export type HistoricalEntry = {
  username?: string;
  timestamp: string;
  action: "add" | "change" | "delete";
  changes: RecordType[];
};

export type HistoricalEntries = {
  history: HistoricalEntry[];
};

export type Count = {
  count: number;
};

export type Summary = Record<"count", number> &
  Record<string, string | number | boolean | object | null>;

export type ErrorMessages = Record<string, string | string[]>;

export interface ErrorResponse {
  status: "fail" | "error";
  code: number;
  messages: ErrorMessages;
}

export interface SuccessResponse {
  status: "success";
  code: number;
}

export interface ListResponse<T> extends SuccessResponse {
  data: T[];
  next: string | null;
  previous: string | null;
}

export interface DetailResponse<T> extends SuccessResponse {
  data: T;
}
