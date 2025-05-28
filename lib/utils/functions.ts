import { ExportHandlerProps, OnyxProps } from "../interfaces";
import {
  DetailResponse,
  ErrorResponse,
  ExportStatus,
  FilterConfig,
} from "../types";

/** Returns a random hexadecimal string. */
function generateKey() {
  return Math.random().toString(16).slice(2);
}

/** Generate a default file name prefix based on the project code and search parameters. */
function getDefaultFileNamePrefix(project: string, searchParameters: string) {
  // Create the default file name prefix based on the project and search parameters
  // Uses filter/search values only, replaces commas and spaces with underscores,
  // removes special characters, and truncates to 50 characters
  return [["", project]]
    .concat(Array.from(new URLSearchParams(searchParameters).entries()))
    .filter(([parameter]) => !["include", "exclude"].includes(parameter))
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
  response: DetailResponse | ErrorResponse | undefined;
}

/** Handler for converting JSON data to a string for file export. */
function handleJSONExport(props: DetailResponseProps) {
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
function formatFilters(filters: FilterConfig[]) {
  return filters
    .filter((filter) => filter.field)
    .map((filter) => {
      if (filter.lookup)
        return [filter.field + "__" + filter.lookup, filter.value];
      else return [filter.field, filter.value];
    });
}

/** Takes a Response object and returns its status code, formatted as a string. */
function formatResponseStatus(response: Response) {
  return `${response.status} (${response.statusText})`;
}

export {
  formatFilters,
  formatResponseStatus,
  generateKey,
  getDefaultFileNamePrefix,
  handleJSONExport,
};
