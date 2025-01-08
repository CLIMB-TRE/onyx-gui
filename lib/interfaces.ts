import { ProjectField, ExportStatus } from "./types";

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler: (path: string) => Promise<void>;
  fileWriter: (path: string, content: string) => Promise<void>;
  extVersion?: string;
}

interface PageProps extends OnyxProps {
  project: string;
}

interface DataProps extends PageProps {
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  handleRecordModalShow: (recordID: string) => void;
  handleAnalysisModalShow: (analysisID: string) => void;
}

interface StatsProps extends PageProps {
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

export type { OnyxProps, PageProps, DataProps, StatsProps, ExportHandlerProps };
