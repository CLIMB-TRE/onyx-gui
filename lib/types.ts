interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  fileWriter?: (path: string, content: string) => void;
  extVersion?: string;
}

type ProjectField = {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

type OptionType = { label: string; value: string };

type ResultType = Record<string, string | number | boolean | null>;

type ErrorType = Record<string, string | string[]>;

export type { OnyxProps, ProjectField, OptionType, ResultType, ErrorType };
