import { useMemo } from "react";
import Badge from "react-bootstrap/Badge";
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
import { ProjectProps } from "../interfaces";
import { recentActivityMessage } from "../utils/messages";
import { Profile } from "../types";

function Details(props: ProjectProps) {
  const { isFetching, error, data } = useProfileQuery(props);

  // Get the user profile
  const profile = useMemo(() => {
    if (data?.status !== "success")
      return {
        username: "",
        site: "",
        email: "",
      } as Profile;

    return data.data;
  }, [data]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Details</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler isFetching={isFetching} error={error} data={data}>
          <Container>
            <DataField name="User" value={profile.username} />
            <DataField name="Site" value={profile.site} />
            <DataField name="Email" value={profile.email} />
          </Container>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function ProjectPermissions(props: ProjectProps) {
  const { isFetching, error, data } = useProjectPermissionsQuery(props);

  const projectPermissions = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Project Permissions</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler isFetching={isFetching} error={error} data={data}>
          <Stack gap={2}>
            {projectPermissions.map((project, index: number) => (
              <Card body key={index}>
                <DataField name="Project" value={project.name} />
                <DataField name="Scope" value={project.scope} />
                <DataField
                  name="Actions"
                  value={
                    <div className="d-flex flex-wrap gap-1">
                      {project.actions?.map((action, i) => (
                        <Badge key={i} bg="info" text="dark">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  }
                />
              </Card>
            ))}
          </Stack>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function Activity(props: ProjectProps) {
  const { isFetching, error, data } = useActivityQuery(props);

  const activity = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>Recent Activity</Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <QueryHandler isFetching={isFetching} error={error} data={data}>
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
              order="-date"
            />
          </Stack>
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function User(props: ProjectProps) {
  return (
    <Container fluid className="g-0 h-100">
      <Row className="g-2 h-100">
        <Col md={4} lg={3} xl={2} className="h-100">
          <Stack gap={2} className="h-100">
            <div className="h-25">
              <Details {...props} />
            </div>
            <div className="h-75">
              <ProjectPermissions {...props} />
            </div>
          </Stack>
        </Col>
        <Col md={8} lg={9} xl={10} className="h-100">
          <Activity {...props} />
        </Col>
      </Row>
    </Container>
  );
}

export default User;
