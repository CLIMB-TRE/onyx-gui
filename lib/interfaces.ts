import { ExportStatus, Project, ProjectField } from "./types";

export interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler: (path: string) => Promise<void>;
  fileWriter: (path: string, content: string) => Promise<void>;
  extVersion: string;
}

export interface PageProps extends OnyxProps {
  darkMode: boolean;
  project: Project;
}

export interface DataProps extends PageProps {
  projectFields: Map<string, ProjectField>;
  projectDescription: string;
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
}

export interface IDProps extends DataProps {
  ID: string;
  tabKey: string;
  setTabKey: (key: string) => void;
  dataPanelTabKey: string;
  setDataPanelTabKey: (key: string) => void;
  onHide: () => void;
}

export interface ResultsProps extends DataProps {
  title: string;
  searchPath: string;
}

export interface ExportHandlerProps {
  fileName: string;
  statusToken: { status: ExportStatus };
  setExportStatus: (status: ExportStatus) => void;
  setExportProgress: (progress: number) => void;
  setExportProgressMessage: (message: string) => void;
  setExportError: (error: Error) => void;
}
