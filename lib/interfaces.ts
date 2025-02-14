import { ProjectField, ExportStatus } from "./types";

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler: (path: string) => Promise<void>;
  fileWriter: (path: string, content: string) => Promise<void>;
  extVersion?: string;
}

interface ProjectProps extends OnyxProps {
  project: string;
}

interface PageProps extends ProjectProps {
  darkMode: boolean;
}

interface DataProps extends PageProps {
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
}

interface ResultsProps extends DataProps {
  title: string;
  searchPath: string;
}

interface StatsProps extends PageProps {
  projectFields: Map<string, ProjectField>;
  fieldDescriptions: Map<string, string>;
}

interface ExportHandlerProps {
  fileName: string;
  statusToken: { status: ExportStatus };
  setExportStatus: (exportStatus: ExportStatus) => void;
  setExportProgress: (exportProgress: number) => void;
  setExportError: (error: Error) => void;
}

export type {
  OnyxProps,
  ProjectProps,
  PageProps,
  DataProps,
  ResultsProps,
  StatsProps,
  ExportHandlerProps,
};
