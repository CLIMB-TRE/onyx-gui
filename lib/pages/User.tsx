import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import QueryHandler from "../components/QueryHandler";
import {
  useActivityQuery,
  useProfileQuery,
  useProjectPermissionsQuery,
} from "../api";
import Table from "../components/Table";
import {
  TimestampCellRenderer,
  HTTPStatusCellRenderer,
  HTTPMethodCellRenderer,
  JSONCellRenderer,
} from "../components/CellRenderers";
import { PageProps } from "../interfaces";
import { RecordType, ProjectPermissionType } from "../types";
import { recentActivityMessage } from "../utils/messages";

function UserDataField({
  name,
  value,
}: {
  name: string;
  value: string | JSX.Element;
}) {
  return (
    <Row>
      <Col md={6}>
        <h6>{name}:</h6>
      </Col>
      <Col md={6}>
        <span className="onyx-text-pink">{value}</span>
      </Col>
    </Row>
  );
}

function Details(props: PageProps) {
  const { isFetching, error, data } = useProfileQuery(props);

  const details = useMemo(() => {
    if (data?.status !== "success") return { username: "", site: "" };
    return data.data as Record<string, string>;
  }, [data]);

  return (
    <Card className="h-100">
      <Card.Header>Details</Card.Header>
      <Card.Body className="overflow-y-scroll">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Container>
            <UserDataField name="Username" value={details.username} />
            <UserDataField name="Site" value={details.site} />
            <UserDataField name="Email" value={details.email} />
          </Container>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function ProjectPermissions(props: PageProps) {
  const { isFetching, error, data } = useProjectPermissionsQuery(props);

  const projectPermissions = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <Card className="h-100">
      <Card.Header>Project Permissions</Card.Header>
      <Card.Body className="overflow-y-scroll p-2 h-100">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Stack gap={2}>
            {projectPermissions.map(
              (project: ProjectPermissionType, index: number) => (
                <Card body key={index}>
                  <UserDataField name="Project" value={project.project} />
                  <UserDataField name="Scope" value={project.scope} />
                  <UserDataField
                    name="Actions"
                    value={
                      <ul>
                        {project.actions?.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    }
                  />
                </Card>
              )
            )}
          </Stack>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function Activity(props: PageProps) {
  const { isFetching, error, data } = useActivityQuery(props);

  const activity = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data as RecordType[];
  }, [data]);

  return (
    <Card className="h-100">
      <Card.Header>Recent Activity</Card.Header>
      <Card.Body className="h-100">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Stack className="h-100">
            <Card.Text>{recentActivityMessage}</Card.Text>
            <Table
              {...props}
              data={activity}
              defaultFileNamePrefix="activity"
              tooltipFields={["date"]}
              headerNames={
                new Map([
                  ["date", "Date"],
                  ["endpoint", "Endpoint"],
                  ["method", "Method"],
                  ["status", "Status Code"],
                  ["exec_time", "Execution Time (ms)"],
                  ["error_messages", "Errors"],
                ])
              }
              cellRenderers={
                new Map([
                  ["date", TimestampCellRenderer],
                  ["method", HTTPMethodCellRenderer],
                  ["status", HTTPStatusCellRenderer],
                  ["error_messages", JSONCellRenderer],
                ])
              }
              includeOnly={[
                "date",
                "endpoint",
                "method",
                "status",
                "exec_time",
                "error_messages",
              ]}
              defaultSort={new Map([["date", "desc"]])}
            />
          </Stack>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function User(props: PageProps) {
  return (
    <Container fluid className="h-100">
      <Row className="g-2 h-100">
        <Col xs={4} sm={3} xl={2} className="h-100">
          <Stack gap={2} className="h-100">
            <div className="h-25">
              <Details {...props} />
            </div>
            <div className="h-75">
              <ProjectPermissions {...props} />
            </div>
          </Stack>
        </Col>
        <Col xs={8} sm={9} xl={10} className="h-100">
          <Activity {...props} />
        </Col>
      </Row>
    </Container>
  );
}

export default User;
