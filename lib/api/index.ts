import { useQuery } from "@tanstack/react-query";
import { OnyxProps, PageProps } from "../interfaces";
import { GraphConfig } from "../types";

interface ChoiceProps extends PageProps {
  field: string;
}

interface RecordIDProps extends PageProps {
  recordID: string;
}

interface AnalysisIDProps extends PageProps {
  analysisID: string;
}

interface GenericIDProps extends PageProps {
  searchPath: string;
  ID: string;
}

interface GenericQueryProps extends PageProps {
  searchPath: string;
  searchParameters: string;
}

interface GraphQueryProps extends PageProps {
  graphConfig: GraphConfig;
}

/** Fetch types */
const useTypesQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["type-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/types/")
        .then((response) => response.json());
    },
    placeholderData: { data: [] },
  });
};

/** Fetch lookups */
const useLookupsQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["lookup-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/lookups/")
        .then((response) => response.json());
    },
    placeholderData: { data: [] },
  });
};

/** Fetch user profile */
const useProfileQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["profile-detail"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/profile/")
        .then((response) => response.json());
    },
    placeholderData: { data: {} },
  });
};

/** Fetch user project permissions */
const useProjectPermissionsQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["project-permission-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/")
        .then((response) => response.json());
    },
    placeholderData: { data: [] },
  });
};

/** Fetch project fields */
const useProjectFieldsQuery = (props: PageProps) => {
  return useQuery({
    queryKey: ["project-fields-detail", props.project],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/fields/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: {} },
  });
};

/** Fetch analysis fields */
const useAnalysisFieldsQuery = (props: PageProps) => {
  return useQuery({
    queryKey: ["analysis-fields-detail", props.project],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/analysis/fields/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: {} },
  });
};

/** Fetch choices for a field */
const useChoicesQuery = (props: ChoiceProps) => {
  return useQuery({
    queryKey: ["choices-detail", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/choices/${props.field}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.field),
    placeholderData: { data: {} },
  });
};

/** Fetch user activity */
const useActivityQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["activity-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/activity/")
        .then((response) => response.json());
    },
    placeholderData: { data: [] },
  });
};

/** Fetch site users */
const useSiteUsersQuery = (props: OnyxProps) => {
  return useQuery({
    queryKey: ["site-user-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/site/")
        .then((response) => response.json());
    },
    placeholderData: { data: [] },
  });
};

/** Fetch history from ID */
const useHistoryQuery = (props: GenericIDProps) => {
  return useQuery({
    queryKey: ["history-detail", props.searchPath, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`${props.searchPath}/history/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.searchPath && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch record from record ID */
const useRecordQuery = (props: RecordIDProps) => {
  return useQuery({
    queryKey: ["record-detail", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    placeholderData: { data: {} },
  });
};

/** Fetch record analyses from record ID */
const useRecordAnalysesQuery = (props: RecordIDProps) => {
  return useQuery({
    queryKey: ["record-analysis-list", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analyses/${props.recordID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    placeholderData: { data: [] },
  });
};

/** Fetch analysis from analysis ID */
const useAnalysisQuery = (props: AnalysisIDProps) => {
  return useQuery({
    queryKey: ["analysis-detail", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/${props.analysisID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    placeholderData: { data: {} },
  });
};

/** Fetch analysis records from analysis ID */
const useAnalysisRecordsQuery = (props: AnalysisIDProps) => {
  return useQuery({
    queryKey: ["analysis-record-list", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/records/${props.analysisID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    placeholderData: { data: [] },
  });
};

/** Fetch upstream analyses from analysis ID */
const useAnalysisUpstreamQuery = (props: AnalysisIDProps) => {
  return useQuery({
    queryKey: ["analysis-upstream-list", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?downstream_analyses__analysis_id=${props.analysisID}`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    placeholderData: { data: [] },
  });
};

/** Fetch downstream analyses from analysis ID */
const useAnalysisDownstreamQuery = (props: AnalysisIDProps) => {
  return useQuery({
    queryKey: ["analysis-downstream-list", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?upstream_analyses__analysis_id=${props.analysisID}`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    placeholderData: { data: [] },
  });
};

/** Fetch results from path and search parameters */
const useResultsQuery = (props: GenericQueryProps) => {
  return useQuery({
    queryKey: ["results-list", props.searchPath, props.searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`${props.searchPath}/?${props.searchParameters}`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.searchPath),
    placeholderData: { data: [] },
  });
};

/** Fetch count from path and search parameters */
const useCountQuery = (props: GenericQueryProps) => {
  return useQuery({
    queryKey: ["count-detail", props.searchPath, props.searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`${props.searchPath}/count/?${props.searchParameters}`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.searchPath),
    placeholderData: { data: {} },
  });
};

/** Fetch summary from project and field */
const useSummaryQuery = (props: GraphQueryProps) => {
  return useQuery({
    queryKey: ["summary-list", props.project, props.graphConfig.field],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/?summarise=${props.graphConfig.field}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch grouped summary from project, field, and groupBy */
const useGroupedSummaryQuery = (props: GraphQueryProps) => {
  return useQuery({
    queryKey: [
      "summary-list",
      props.project,
      props.graphConfig.field,
      props.graphConfig.groupBy,
    ],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/?summarise=${props.graphConfig.field}&summarise=${props.graphConfig.groupBy}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

export {
  useTypesQuery,
  useLookupsQuery,
  useProfileQuery,
  useProjectPermissionsQuery,
  useProjectFieldsQuery,
  useAnalysisFieldsQuery,
  useChoicesQuery,
  useActivityQuery,
  useSiteUsersQuery,
  useRecordQuery,
  useHistoryQuery,
  useRecordAnalysesQuery,
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysisUpstreamQuery,
  useAnalysisDownstreamQuery,
  useResultsQuery,
  useCountQuery,
  useSummaryQuery,
  useGroupedSummaryQuery,
};
