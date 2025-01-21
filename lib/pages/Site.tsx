import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { PageProps } from "../interfaces";
import { RecordType } from "../types";
import { useSiteUsersQuery } from "../api";

function SiteUsers(props: PageProps) {
  const { isFetching, error, data } = useSiteUsersQuery(props);

  // Get site users
  const siteUsers = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data as RecordType[];
  }, [data]);

  return (
    <Card className="h-100">
      <Card.Header>Site Users</Card.Header>
      <Card.Body className="p-2 h-100">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Table
            {...props}
            data={siteUsers}
            defaultFileNamePrefix="site-users"
            headerNames={
              new Map([
                ["username", "User"],
                ["site", "Site"],
                ["email", "Email"],
              ])
            }
            footer="Table showing users from the same site, who have access to the same projects."
          />
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
