import { ExportStatus, ProjectField } from "./types";

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
  tabKey: string;
  setTabKey: (key: string) => void;
  dataPanelTabKey: string;
  setDataPanelTabKey: (key: string) => void;
  onHide: () => void;
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
  DataProps,
  ExportHandlerProps,
  IDProps,
  OnyxProps,
  PageProps,
  ProjectProps,
  ResultsProps,
};
