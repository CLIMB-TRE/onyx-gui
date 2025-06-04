import { ExportHandlerProps, OnyxProps } from "../interfaces";
import {
  RecordType,
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
  response: DetailResponse<RecordType> | ErrorResponse | undefined;
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

export function formatTimeAgo(timestamp: Date): string {
  const diffInMs = new Date().getTime() - timestamp.getTime();

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

export {
  formatFilters,
  formatResponseStatus,
  generateKey,
  getDefaultFileNamePrefix,
  handleJSONExport,
};
