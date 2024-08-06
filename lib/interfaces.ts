import { ProjectField } from "./types";

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  fileWriter?: (path: string, content: string) => void;
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
  darkMode: boolean;
}

export type { OnyxProps, DataProps, StatsProps };
