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
  projectDescription: string;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
}

interface IDProps extends DataProps {
  ID: string;
}

interface ResultsProps extends DataProps {
  title: string;
  searchPath: string;
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
  IDProps,
  ResultsProps,
  ExportHandlerProps,
};
