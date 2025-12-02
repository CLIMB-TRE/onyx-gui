import { CustomCellRendererProps } from "@ag-grid-community/react";
import { ColDef, ITooltipParams } from "@ag-grid-community/core";
import { ExportHandlerProps, OnyxProps } from "../interfaces";
import {
  Field,
  RecordType,
  DetailResponse,
  ErrorResponse,
  ExportStatus,
  FilterConfig,
  Theme,
  TableRow,
  InputRow,
  DefaultPrimaryID,
} from "../types";

/** Returns a random hexadecimal string. */
export function generateKey() {
  return Math.random().toString(16).slice(2);
}

/** Generate a default file name prefix based on the project code and search parameters. */
export function getDefaultFileNamePrefix(
  project: string,
  searchParameters: string
) {
  // Create the default file name prefix based on the project and search parameters
  // Uses filter/search values only, replaces commas and spaces with underscores,
  // removes special characters, and truncates to 50 characters
  return [["", project]]
    .concat(Array.from(new URLSearchParams(searchParameters).entries()))
    .filter(
      ([parameter]) => !["include", "exclude", "page_size"].includes(parameter)
    )
    .map(([, value]) =>
      value
        // Split on all groups of spaces and commas
        .split(/[ ,]+/)
        // Remove all groups of characters that are not letters, numbers, underscores, or hyphens
        .map((v) => v.replace(/[^a-zA-Z0-9_-]+/g, ""))
        .filter((v) => v)
    )
    .flat()
    .join("_")
    .slice(0, 50);
}

interface DetailResponseProps extends OnyxProps {
  response: DetailResponse<RecordType> | ErrorResponse | undefined;
}

/** Handler for converting JSON data to a string for file export. */
export function handleJSONExport(props: DetailResponseProps) {
  return (exportProps: ExportHandlerProps) => {
    if (props.response?.status !== "success") return;
    const jsonData = JSON.stringify(props.response.data);

    exportProps.setExportStatus(ExportStatus.WRITING);
    props
      .fileWriter(exportProps.fileName, jsonData)
      .then(() => exportProps.setExportStatus(ExportStatus.FINISHED))
      .catch((error: Error) => {
        exportProps.setExportError(error);
        exportProps.setExportStatus(ExportStatus.ERROR);
      });
  };
}

/** Takes an array of FilterConfig objects and formats into an array of field (+lookup), value pairs. */
export function formatFilters(filters: FilterConfig[]) {
  return filters
    .filter((filter) => filter.field)
    .map((filter) => {
      if (filter.lookup)
        return [filter.field + "__" + filter.lookup, filter.value];
      else return [filter.field, filter.value];
    });
}

/** Takes a Response object and returns its status code, formatted as a string. */
export function formatResponseStatus(response: Response) {
  return `${response.status} (${response.statusText})`;
}

export function formatTimeAgo(timestamp: string): string {
  const diffInMs = new Date().getTime() - new Date(timestamp).getTime();

  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 1) {
    return "Now";
  } else if (seconds < 60) {
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else {
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
}

export function formatField(field: string) {
  return field.split("__").join(" ");
}

export function formatLookup(lookup: string) {
  switch (lookup) {
    case "exact":
      return "==";
    case "ne":
      return "!=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    default:
      return lookup.toUpperCase();
  }
}

// TODO: Issues arise if value contains commas
// TODO: Would be better to have field-type-dependent formatting
export function formatValue(value: string) {
  let values = value.split(",");
  if (values.length > 10) {
    values = values
      .slice(0, 10)
      .concat([`... [${(values.length - 10).toString()} more]`]);
  }
  return values.join(", ");
}

/** Converts a string theme value to a Theme enum value, or null if invalid. */
export function getTheme(theme: string | null | undefined): Theme | null {
  if (theme === Theme.LIGHT) return Theme.LIGHT;
  else if (theme === Theme.DARK) return Theme.DARK;
  else return null;
}

/** Get optimal fields, alongside their `include`/`exclude` operator, to match a set of requested fields. */
export function getIncludeExclude(
  includeList: string[],
  columnOptions: Field[]
) {
  let fields;
  let operator;
  if (includeList.length <= columnOptions.length - includeList.length) {
    operator = "include";
    fields = includeList;
  } else {
    operator = "exclude";
    fields = columnOptions
      .filter((field) => !includeList.includes(field.code))
      .map((field) => field.code);
  }
  return { operator, fields };
}

/** Get an array of string fields corresponding to the column names in a results table. */
export function getColumns(
  fieldList: string[],
  columnOptions: Field[]
): string[] {
  if (fieldList.length === 0) {
    return columnOptions.map((field) => field.code);
  } else {
    return columnOptions
      .filter((field) => fieldList.includes(field.code))
      .map((field) => field.code);
  }
}

/** Get the columns for a table in the (current) accepted format for `getColDefs`. */
export function getTableColumns(
  fieldList: string[],
  columnOptions: Field[]
): TableRow[] {
  const columns = getColumns(fieldList, columnOptions);
  return [Object.fromEntries(columns.map((code) => [code, ""]))];
}

/** Converts InputRow[] to TableRow[]. All non-string/number values are converted to strings. */
export function formatData(data: InputRow[]): TableRow[] {
  return data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" || typeof value === "number"
          ? value
          : typeof value === "boolean" || value === null
          ? value?.toString() || ""
          : JSON.stringify(value),
      ])
    )
  );
}

/** Sorts TableRow[] in-place, on the specified field and direction. */
export function sortData(
  data: TableRow[],
  field: string,
  direction: string
): void {
  if (data.length > 0 && direction === "asc") {
    if (typeof data[0][field] === "number") {
      data.sort((a, b) => (a[field] as number) - (b[field] as number));
    } else {
      data.sort((a, b) =>
        (a[field] as string) > (b[field] as string) ? 1 : -1
      );
    }
  } else if (data.length > 0 && direction === "desc") {
    if (typeof data[0][field] === "number") {
      data.sort((a, b) => (b[field] as number) - (a[field] as number));
    } else {
      data.sort((a, b) =>
        (a[field] as string) < (b[field] as string) ? 1 : -1
      );
    }
  }
}

interface ColDefProps {
  data: InputRow[];
  isServerTable: boolean;
  includeOnly?: string[];
  flexOnly?: string[];
  headerNames?: Map<string, string>;
  headerTooltips?: Map<string, string>;
  headerTooltipPrefix?: string;
  cellRenderers?: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  order?: string;
  recordPrimaryID?: string;
  analysisPrimaryID?: string;
  tooltipFields?: string[];
}

/** Generates column definitions for a table. */
export function getColDefs(props: ColDefProps): ColDef[] {
  let colDefs: ColDef[];

  if (props.data && props.data.length > 0) {
    let keys: string[];
    if (props.includeOnly) keys = props.includeOnly;
    else keys = Object.keys(props.data[0]);

    colDefs = keys.map((key) => {
      const width = 100 + 20 * Math.round(Math.log(key.length));
      const colDef: ColDef = {
        field: key,
        headerName: props.headerNames?.get(key) || key,
        minWidth: width,
        width: props.isServerTable ? width : undefined,
        headerTooltip: props.headerTooltips?.get(
          (props.headerTooltipPrefix || "") + key
        ),
        unSortIcon: true,
      };

      // Disable AGGrid sorting for server tables
      if (props.isServerTable) colDef.comparator = () => 0;

      // Apply custom cell renderers
      if (props.cellRenderers?.get(key))
        colDef.cellRenderer = props.cellRenderers.get(key);

      if (
        key === DefaultPrimaryID.RECORD ||
        key === DefaultPrimaryID.ANALYSIS ||
        key === props.recordPrimaryID ||
        key === props.analysisPrimaryID
      ) {
        // ID fields pinned to the left
        colDef.pinned = "left";
      } else if (key === "changes" || key === "error_messages") {
        // History 'changes' field is a special case
        // where we want variable height and wrapped text
        colDef.autoHeight = true;
        colDef.wrapText = true;
      }

      // Apply default sorts
      if (props.order) {
        const sortKey = props.order.startsWith("-")
          ? props.order.slice(1)
          : props.order;
        if (key === sortKey)
          colDef.sort = props.order.startsWith("-") ? "desc" : "asc";
      }

      // Apply tooltip value getter for fields that should display tooltips
      if (props.tooltipFields?.includes(key))
        colDef.tooltipValueGetter = (p: ITooltipParams) => p.value.toString();

      // Apply flex to all fields unless the table is server paginated
      // or there is a list of flex-only fields
      if (!props.flexOnly || props.flexOnly.includes(key)) colDef.flex = 1;

      return colDef;
    });
  } else colDefs = [];

  return colDefs;
}
