import { useQuery } from "@tanstack/react-query";
import { PageProps } from "../interfaces";

/** Fetch user profile */
const useProfileQuery = ({ props }: { props: PageProps }) => {
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
const useProjectPermissionsQuery = ({ props }: { props: PageProps }) => {
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

/** Fetch user activity */
const useActivityQuery = ({ props }: { props: PageProps }) => {
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
const useSiteUsersQuery = ({ props }: { props: PageProps }) => {
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
const useRecordQuery = ({
  props,
  recordID,
}: {
  props: PageProps;
  recordID: string;
}) => {
  return useQuery({
    queryKey: ["record-detail", props.project, recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && recordID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });
};

/** Fetch record history from record ID */
const useRecordHistoryQuery = ({
  props,
  recordID,
}: {
  props: PageProps;
  recordID: string;
}) => {
  return useQuery({
    queryKey: ["record-history-detail", props.project, recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/history/${recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && recordID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });
};

/** Fetch record analyses from record ID */
const useRecordAnalysesQuery = ({
  props,
  recordID,
}: {
  props: PageProps;
  recordID: string;
}) => {
  return useQuery({
    queryKey: ["record-analysis-list", props.project, recordID],
    queryFn: async () => {
      // TODO: Proper endpoint doesn't actually exist
      return props
        .httpPathHandler(`projects/${props.project}/analysis/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch records from search parameters */
const useRecordsQuery = ({
  props,
  searchParameters,
}: {
  props: PageProps;
  searchParameters: string;
}) => {
  return useQuery({
    queryKey: ["record-list", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?${searchParameters}`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch analysis from analysis ID */
const useAnalysisQuery = ({
  props,
  analysisID,
}: {
  props: PageProps;
  analysisID: string;
}) => {
  return useQuery({
    queryKey: ["analysis-detail", props.project, analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/analysis/${analysisID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && analysisID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });
};

/** Fetch analysis records from analysis ID */
const useAnalysisRecordsQuery = ({
  props,
  analysisID,
}: {
  props: PageProps;
  analysisID: string;
}) => {
  return useQuery({
    queryKey: ["analysis-record-list", props.project, analysisID],
    queryFn: async () => {
      // TODO: Proper endpoint doesn't actually exist
      return props
        .httpPathHandler(`projects/${props.project}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && analysisID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

/** Fetch analyses from search parameters */
const useAnalysesQuery = ({
  props,
  searchParameters,
}: {
  props: PageProps;
  searchParameters: string;
}) => {
  return useQuery({
    queryKey: ["analysis-list", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?${searchParameters}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

export {
  useProfileQuery,
  useProjectPermissionsQuery,
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
