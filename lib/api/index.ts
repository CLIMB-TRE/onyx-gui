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
  Fields,
  Choices,
  Lookup,
  TypeObject,
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

interface GraphQueryProps extends ProjectProps {
  graphConfig: GraphConfig;
}

/** Fetch types */
export const useTypesQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<TypeObject> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["type-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/types/")
        .then((response) => response.json());
    },
    enabled: props.enabled,
    placeholderData: { data: [] },
  });
};

/** Fetch lookups */
export const useLookupsQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<Lookup> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["lookup-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/lookups/")
        .then((response) => response.json());
    },
    enabled: props.enabled,
    placeholderData: { data: [] },
  });
};

/** Fetch user profile */
export const useProfileQuery = (
  props: OnyxProps
): UseQueryResult<DetailResponse<Profile> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["profile-detail"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/profile/")
        .then((response) => response.json());
    },
    enabled: props.enabled,
    placeholderData: { data: {} },
  });
};

/** Fetch user project permissions */
export const useProjectPermissionsQuery = (
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
    enabled: props.enabled,
    placeholderData: { data: [] },
  });
};

/** Fetch project fields */
export const useFieldsQuery = (
  props: ProjectProps
): UseQueryResult<DetailResponse<Fields> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["project-fields-detail", props.project.code],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/fields/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project),
    placeholderData: { data: {} },
  });
};

/** Fetch analysis fields */
export const useAnalysisFieldsQuery = (
  props: ProjectProps
): UseQueryResult<DetailResponse<Fields> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-fields-detail", props.project.code],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analysis/fields/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project),
    placeholderData: { data: {} },
  });
};

/** Fetch choices for a field */
export const useChoicesQuery = (
  props: ChoiceProps
): UseQueryResult<DetailResponse<Choices> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["choices-detail", props.project.code, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project.code}/choices/${props.field}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.field),
    placeholderData: { data: {} },
  });
};

/** Fetch choices for multiple fields */
export const useChoicesQueries = (props: ChoicesProps) => {
  return useQueries({
    queries: props.fields.map((field) => ({
      queryKey: ["choices-detail", props.project.code, field],
      queryFn: async () => {
        return props
          .httpPathHandler(`projects/${props.project.code}/choices/${field}/`)
          .then((response) => response.json());
      },
      enabled: !!(props.enabled && props.project && field),
      placeholderData: { data: {} },
    })),
  });
};

/** Fetch user activity */
export const useActivityQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["activity-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/activity/")
        .then((response) => response.json());
    },
    enabled: props.enabled,
    placeholderData: { data: [] },
  });
};

/** Fetch site users */
export const useSiteUsersQuery = (
  props: OnyxProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["site-user-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/site/")
        .then((response) => response.json());
    },
    enabled: props.enabled,
    placeholderData: { data: [] },
  });
};

/** Fetch history from ID */
export const useHistoryQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<HistoricalEntries> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["history-detail", props.searchPath, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`${props.searchPath}/history/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.searchPath && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch record from record ID */
export const useRecordQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["record-detail", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch record analyses from record ID */
export const useRecordAnalysesQuery = (
  props: IDProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["record-analysis-list", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analyses/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch analysis from analysis ID */
export const useAnalysisQuery = (
  props: IDProps
): UseQueryResult<DetailResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["analysis-detail", props.project.code, props.ID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project.code}/analysis/${props.ID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: {} },
  });
};

/** Fetch analysis records from analysis ID */
export const useAnalysisRecordsQuery = (
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
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch upstream analyses from analysis ID */
export const useAnalysisUpstreamQuery = (
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
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch downstream analyses from analysis ID */
export const useAnalysisDownstreamQuery = (
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
    enabled: !!(props.enabled && props.project && props.ID),
    placeholderData: { data: [] },
  });
};

/** Fetch results from path and search parameters */
export const useResultsQuery = (
  props: QueryProps
): UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error> => {
  return useQuery({
    queryKey: ["results-list", props.searchPath, props.searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `${props.searchPath}/?${props.searchParameters.toString()}`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.searchPath),
    placeholderData: { data: [] },
  });
};

/** Fetch count from path and search parameters */
export const useCountQuery = (props: QueryProps) => {
  return useQuery({
    queryKey: ["count-detail", props.searchPath, props.searchParameters],
    queryFn: async () => {
      // Remove include/exclude/page_size from search parameters
      const searchParameters = new URLSearchParams(props.searchParameters);
      searchParameters.delete("include");
      searchParameters.delete("exclude");
      searchParameters.delete("page_size");

      return props
        .httpPathHandler(`${props.searchPath}/count/?${searchParameters}`)
        .then((response) => response.json());
    },
    enabled: !!(props.enabled && props.project && props.searchPath),
    placeholderData: { data: {} },
    refetchOnMount: true,
  });
};

/** Fetch summary from project and field */
export const useSummaryQuery = (props: GraphQueryProps) => {
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
    enabled: !!(props.enabled && props.project),
    placeholderData: { data: [] },
  });
};

/** Fetch grouped summary from project, field, and groupBy */
export const useGroupedSummaryQuery = (props: GraphQueryProps) => {
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
    enabled: !!(props.enabled && props.project),
    placeholderData: { data: [] },
  });
};
