import { ProjectField, ExportStatus } from "./types";

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => Promise<void>;
  fileWriter?: (path: string, content: string) => Promise<void>;
  extVersion?: string;
}

interface DataProps extends OnyxProps {
  project: string;
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
}

interface StatsProps extends OnyxProps {
  project: string;
  projectFields: Map<string, ProjectField>;
  fieldDescriptions: Map<string, string>;
  darkMode: boolean;
}

interface ExportHandlerProps {
  fileName: string;
  statusToken: { status: ExportStatus };
  setExportStatus: (exportStatus: ExportStatus) => void;
  setExportProgress: (exportProgress: number) => void;
  setExportError: (error: Error) => void;
}

export type { OnyxProps, DataProps, StatsProps, ExportHandlerProps };
