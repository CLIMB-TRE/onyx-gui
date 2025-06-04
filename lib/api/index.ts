import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import { OnyxProps, ProjectProps } from "../interfaces";
import {
  DetailResponse,
  ErrorResponse,
  GraphConfig,
  RecordType,
  ListResponse,
  ProjectPermissionGroup,
  Profile,
  HistoricalEntries,
} from "../types";
import { formatFilters } from "../utils/functions";

interface ChoiceProps extends ProjectProps {
  field: string;
}

interface ChoicesProps extends ProjectProps {
  fields: string[];
}

interface IDProps extends ProjectProps {
  searchPath?: string;
  ID: string;
}

interface QueryProps extends ProjectProps {
  searchPath: string;
  searchParameters: string;
}

interface PaginatedQueryProps extends QueryProps {
  pageSize?: number;
}

interface GraphQueryProps extends ProjectProps {
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
const useProfileQuery = (
  props: OnyxProps
): UseQueryResult<DetailResponse<Profile> | ErrorResponse, Error> => {
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
const useProjectPermissionsQuery = (
  props: OnyxProps
): UseQueryResult<
  ListResponse<ProjectPermissionGroup> | ErrorResponse,
  Error
> => {
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
const useFieldsQuery = (props: ProjectProps) => {
  return useQuery({
    queryKey: ["project-fields-detail", props.project.code],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/fields/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: {} },
  });
};

/** Fetch analysis fields */
const useAnalysisFieldsQuery = (props: ProjectProps) => {
  return useQuery({
    queryKey: ["analysis-fields-detail", props.project.code],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analysis/fields/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: {} },
  });
};

/** Fetch choices for a field */
const useChoicesQuery = (props: ChoiceProps) => {
  return useQuery({
    queryKey: ["choices-detail", props.project.code, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project.code}/choices/${props.field}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.field),
    placeholderData: { data: {} },
  });
};

/** Fetch choices for multiple fields */
const useChoicesQueries = (props: ChoicesProps) => {
  return useQueries({
    queries: props.fields.map((field) => ({
      queryKey: ["choices-detail", props.project.code, field],
      queryFn: async () => {
        return props
          .httpPathHandler(`projects/${props.project.code}/choices/${field}/`)
          .then((response) => response.json());
      },
      enabled: !!(props.project && field),
      placeholderData: { data: {} },
    })),
  });
};

/** Fetch user activity */
const useActivityQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
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
const useSiteUsersQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
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
const useHistoryQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<HistoricalEntries> | ErrorResponse, Error> => {
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
const useRecordQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["record-detail", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch record analyses from record ID */
const useRecordAnalysesQuery = (
  props: IDProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["record-analysis-list", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analyses/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch analysis from analysis ID */
const useAnalysisQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-detail", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analysis/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch analysis records from analysis ID */
const useAnalysisRecordsQuery = (
  props: IDProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-record-list", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project.code}/analysis/records/${props.ID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch upstream analyses from analysis ID */
const useAnalysisUpstreamQuery = (
  props: IDProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-upstream-list", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project.code}/analysis/?downstream_analyses__analysis_id=${props.ID}`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch downstream analyses from analysis ID */
const useAnalysisDownstreamQuery = (
  props: IDProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-downstream-list", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project.code}/analysis/?upstream_analyses__analysis_id=${props.ID}`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch results from path and search parameters */
const useResultsQuery = (
  props: PaginatedQueryProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["results-list", props.searchPath, props.searchParameters],
    queryFn: async () => {
      const searchParameters = new URLSearchParams(props.searchParameters);
      if (props.pageSize)
        searchParameters.set("page_size", props.pageSize.toString());

      return props
        .httpPathHandler(`${props.searchPath}/?${searchParameters.toString()}`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.searchPath),
    placeholderData: { data: [] },
  });
};

/** Fetch count from path and search parameters */
const useCountQuery = (props: QueryProps) => {
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
  const search = new URLSearchParams(formatFilters(props.graphConfig.filters));
  const filters = search.toString();
  if (props.graphConfig.field)
    search.append("summarise", props.graphConfig.field);

  return useQuery({
    queryKey: [
      "summary-list",
      props.project.code,
      props.graphConfig.field,
      filters,
    ],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/?${search.toString()}`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: [] },
  });
};

/** Fetch grouped summary from project, field, and groupBy */
const useGroupedSummaryQuery = (props: GraphQueryProps) => {
  const search = new URLSearchParams(formatFilters(props.graphConfig.filters));
  const filters = search.toString();
  if (props.graphConfig.field)
    search.append("summarise", props.graphConfig.field);
  if (props.graphConfig.groupBy)
    search.append("summarise", props.graphConfig.groupBy);

  return useQuery({
    queryKey: [
      "summary-list",
      props.project.code,
      props.graphConfig.field,
      props.graphConfig.groupBy,
      filters,
    ],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/?${search.toString()}`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    placeholderData: { data: [] },
  });
};

export {
  useActivityQuery,
  useAnalysisDownstreamQuery,
  useAnalysisFieldsQuery,
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysisUpstreamQuery,
  useChoicesQueries,
  useChoicesQuery,
  useCountQuery,
  useGroupedSummaryQuery,
  useHistoryQuery,
  useLookupsQuery,
  useProfileQuery,
  useFieldsQuery,
  useProjectPermissionsQuery,
  useRecordAnalysesQuery,
  useRecordQuery,
  useResultsQuery,
  useSiteUsersQuery,
  useSummaryQuery,
  useTypesQuery,
};
