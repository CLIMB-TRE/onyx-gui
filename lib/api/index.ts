import { useQuery } from "@tanstack/react-query";
import { OnyxProps, PageProps } from "../interfaces";

interface RecordIDProps extends PageProps {
  recordID: string;
}

interface AnalysisIDProps extends PageProps {
  analysisID: string;
}

interface QueryProps extends PageProps {
  searchParameters: string;
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
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
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });
};

/** Fetch record history from record ID */
const useRecordHistoryQuery = (props: RecordIDProps) => {
  return useQuery({
    queryKey: ["record-history-detail", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/history/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
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
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch records from search parameters */
const useRecordsQuery = (props: QueryProps) => {
  return useQuery({
    queryKey: ["record-list", props.project, props.searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?${props.searchParameters}`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch analyses from search parameters */
const useAnalysesQuery = (props: QueryProps) => {
  return useQuery({
    queryKey: ["analysis-list", props.project, props.searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?${props.searchParameters}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

export {
  useTypesQuery,
  useLookupsQuery,
  useProfileQuery,
  useProjectPermissionsQuery,
  useProjectFieldsQuery,
  useActivityQuery,
  useSiteUsersQuery,
  useRecordQuery,
  useRecordHistoryQuery,
  useRecordAnalysesQuery,
  useRecordsQuery,
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysesQuery,
};
