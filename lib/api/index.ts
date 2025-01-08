import { useQuery } from "@tanstack/react-query";
import { OnyxProps } from "../interfaces";

/** Fetch user profile */
const useProfileQuery = ({ props }: { props: OnyxProps }) => {
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
const useProjectPermissionsQuery = ({ props }: { props: OnyxProps }) => {
  return useQuery({
    queryKey: ["projects-list"],
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
const useActivityQuery = ({ props }: { props: OnyxProps }) => {
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
const useSiteUsersQuery = ({ props }: { props: OnyxProps }) => {
  return useQuery({
    queryKey: ["site-users-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/site/")
        .then((response) => response.json());
    },
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });
};

export {
  useProfileQuery,
  useProjectPermissionsQuery,
  useActivityQuery,
  useSiteUsersQuery,
};
