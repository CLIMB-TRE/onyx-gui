import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import QueryHandler from "../components/QueryHandler";
import { useSiteUsersQuery } from "../api";
import Table from "../components/Table";
import { PageProps } from "../interfaces";
import { RecordListResponse, ErrorResponse, RecordType } from "../types";

interface ListResponseProps extends PageProps {
  response: RecordListResponse | ErrorResponse;
}

function SiteUsersContent(props: ListResponseProps) {
  const siteUsersData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data as RecordType[];
  }, [props.response]);

  return (
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
  );
}

function SiteUsers(props: PageProps) {
  const {
    isFetching: siteUsersPending,
    error: siteUsersError,
    data: siteUsersResponse,
  } = useSiteUsersQuery({ props });

  return (
    <Card className="h-100">
      <Card.Header>Site Users</Card.Header>
      <Card.Body className="p-2 h-100">
        <QueryHandler
          isFetching={siteUsersPending}
          error={siteUsersError as Error}
          data={siteUsersResponse}
        >
          <SiteUsersContent {...props} response={siteUsersResponse} />
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function Site(props: PageProps) {
  return (
    <Container fluid className="h-100">
      <SiteUsers {...props} />
    </Container>
  );
}

export default Site;
