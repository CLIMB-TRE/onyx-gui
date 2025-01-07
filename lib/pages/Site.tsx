import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { useQuery } from "@tanstack/react-query";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { UserProps } from "../interfaces";
import { RecordListResponse, ErrorResponse, RecordType } from "../types";

interface ListResponseProps extends UserProps {
  response: RecordListResponse | ErrorResponse;
}

function SiteUsersContent(props: ListResponseProps) {
  const siteUsersData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data as RecordType[];
  }, [props.response]);

  return (
    <Card className="h-100">
      <Card.Header>Site Users</Card.Header>
      <Card.Body className="h-100">
        <Container fluid className="p-2 pb-0 h-100">
          <Stack className="h-100">
            <Table
              {...props}
              data={siteUsersData}
              defaultFileNamePrefix="site-users"
              headerNames={
                new Map([
                  ["username", "Username"],
                  ["site", "Site"],
                  ["email", "Email"],
                ])
              }
              footer="Table showing users from the same site, who have access to the same projects."
            />
          </Stack>
        </Container>
      </Card.Body>
    </Card>
  );
}

function SiteUsers(props: UserProps) {
  // Fetch site user list
  const {
    isFetching: siteUsersPending,
    error: siteUsersError,
    data: siteUsersResponse,
  } = useQuery({
    queryKey: ["site-users"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/site/")
        .then((response) => response.json());
    },
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });

  return (
    <QueryHandler
      isFetching={siteUsersPending}
      error={siteUsersError as Error}
      data={siteUsersResponse}
    >
      <SiteUsersContent {...props} response={siteUsersResponse} />
    </QueryHandler>
  );
}

function Site(props: UserProps) {
  return (
    <Container fluid className="h-100">
      <SiteUsers {...props} />
    </Container>
  );
}

export default Site;
