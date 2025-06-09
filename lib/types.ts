export enum Themes {
  LIGHT = "light",
  DARK = "dark",
}

export enum DarkModeColours {
  BS_BODY_COLOR = "#dee2e6", // Bootstrap body text color for dark mode
  BS_BODY_BG = "#121212", // Bootstrap body background color for dark mode
  BS_GRAY_600 = "#6c757d", // Bootstrap gray-600 for dark mode
  BS_GRAY_900 = "#212529", // Bootstrap gray-900 for dark mode
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

export type TabState = {
  tabKey: OnyxTabKeys;
  recordTabKey: RecordTabKeys;
  recordDetailTabKey: RecordDetailTabKeys;
  recordDataPanelTabKey: DataPanelTabKeys;
  recordID: string;
  analysisTabKey: AnalysisTabKeys;
  analysisDetailTabKey: AnalysisDetailTabKeys;
  analysisDataPanelTabKey: DataPanelTabKeys;
  analysisID: string;
};

export type RecentlyViewed = {
  ID: string;
  timestamp: Date;
  handleShowID: (id: string) => void;
};

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
  fields: Record<string, Field>;
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

export type HistoricalEntry = {
  username?: string;
  timestamp: string;
  action: "add" | "change" | "delete";
  changes: RecordType[];
};

export type HistoricalEntries = {
  history: HistoricalEntry[];
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
