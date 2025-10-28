import { Dispatch, SetStateAction } from "react";
import { ExportStatus, TabState, Project, Field } from "./types";

export interface OnyxProps {
  enabled: boolean;
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler: (path: string) => Promise<void>;
  fileWriter: (path: string, content: string) => Promise<void>;
  extVersion: string;
  getItem?: (key: string) => unknown;
  setItem?: (key: string, value: unknown) => void;
  setTitle?: (title: string) => void;
}

export interface PageProps extends OnyxProps {
  darkMode: boolean;
  tabState: TabState;
  setTabState: Dispatch<SetStateAction<TabState>>;
}

export interface ProjectProps extends PageProps {
  project: Project;
}

export interface DataProps extends ProjectProps {
  fields: Map<string, Field>;
  projectDescription: string;
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
}

export interface IDProps extends DataProps {
  ID: string;
  onHide: () => void;
}

export interface ResultsProps extends DataProps {
  defaultFields: string[];
  title: string;
  commandBase: string;
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
