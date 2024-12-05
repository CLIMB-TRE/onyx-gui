import { RecordDetailResponse, ErrorResponse, ExportStatus } from "../types";
import { OnyxProps, ExportHandlerProps } from "../interfaces";

function generateKey() {
  return Math.random().toString(16).slice(2);
}

function getDefaultFileNamePrefix(project: string, searchParameters: string) {
  // Create the default file name prefix based on the project and search parameters
  // Uses filter/search values only, replaces commas and spaces with underscores,
  // removes special characters, and truncates to 50 characters
  return [["", project]]
    .concat(Array.from(new URLSearchParams(searchParameters).entries()))
    .map(([, value]) =>
      value.split(/[ ,]+/).map((v) => v.replace(/[^a-zA-Z0-9_/-]/, ""))
    )
    .flat()
    .join("_")
    .slice(0, 50);
}

interface RecordDetailResponseProps extends OnyxProps {
  response: RecordDetailResponse | ErrorResponse;
}

function handleJSONExport(props: RecordDetailResponseProps) {
  return (exportProps: ExportHandlerProps) => {
    if (props.response.status !== "success") return;
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

export { generateKey, getDefaultFileNamePrefix, handleJSONExport };
