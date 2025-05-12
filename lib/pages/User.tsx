import { useMemo } from "react";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import {
  useActivityQuery,
  useProfileQuery,
  useProjectPermissionsQuery,
} from "../api";
import {
  HTTPMethodCellRenderer,
  HTTPStatusCellRenderer,
  JSONCellRenderer,
  TimestampCellRenderer,
} from "../components/CellRenderers";
import DataField from "../components/DataField";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { PageProps } from "../interfaces";
import { ProjectPermissionType, RecordType } from "../types";
import { recentActivityMessage } from "../utils/messages";

function Details(props: PageProps) {
  const { isFetching, error, data } = useProfileQuery(props);

  const details = useMemo(() => {
    if (data?.status !== "success") return { username: "", site: "" };
    return data.data as Record<string, string>;
  }, [data]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Details</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Container>
            <DataField name="Username" value={details.username} />
            <DataField name="Site" value={details.site} />
            <DataField name="Email" value={details.email} />
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
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Project Permissions</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Stack gap={2}>
            {projectPermissions.map(
              (project: ProjectPermissionType, index: number) => (
                <Card body key={index}>
                  <DataField name="Project" value={project.project} />
                  <DataField name="Scope" value={project.scope} />
                  <DataField
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
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Recent Activity</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler
          isFetching={isFetching}
          error={error as Error}
          data={data}
        >
          <Stack className="h-100">
            <Card.Text className="m-2">{recentActivityMessage}</Card.Text>
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
    <Container fluid className="g-0 h-100">
      <Row className="g-2 h-100">
        <Col xs={5} sm={3} xl={2} className="h-100">
          <Stack gap={2} className="h-100">
            <div className="h-25">
              <Details {...props} />
            </div>
            <div className="h-75">
              <ProjectPermissions {...props} />
            </div>
          </Stack>
        </Col>
        <Col xs={7} sm={9} xl={10} className="h-100">
          <Activity {...props} />
        </Col>
      </Row>
    </Container>
  );
}

export default User;
