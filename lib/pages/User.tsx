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
import {
  RecordDetailResponse,
  RecordListResponse,
  ProjectPermissionListResponse,
  ErrorResponse,
  RecordType,
} from "../types";
import { recentActivityMessage } from "../utils/messages";

interface DetailResponseProps extends PageProps {
  response: RecordDetailResponse | ErrorResponse;
}

interface ListResponseProps extends PageProps {
  response: RecordListResponse | ErrorResponse;
}

interface ProjectPermissionListResponseProps extends PageProps {
  response: ProjectPermissionListResponse | ErrorResponse;
}

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

function UserProfileContent(props: DetailResponseProps) {
  const userProfileData = useMemo(() => {
    if (props.response.status !== "success") return { username: "", site: "" };
    return props.response.data as Record<string, string>;
  }, [props.response]);

  return (
    <Container>
      <UserDataField name="Username" value={userProfileData.username} />
      <UserDataField name="Site" value={userProfileData.site} />
      <UserDataField name="Email" value={userProfileData.email} />
    </Container>
  );
}

function UserProfile(props: PageProps) {
  const {
    isFetching: userProfilePending,
    error: userProfileError,
    data: userProfileResponse,
  } = useProfileQuery(props);

  return (
    <Card className="h-100">
      <Card.Header>Details</Card.Header>
      <Card.Body className="overflow-y-scroll">
        <QueryHandler
          isFetching={userProfilePending}
          error={userProfileError as Error}
          data={userProfileResponse}
        >
          <UserProfileContent {...props} response={userProfileResponse} />
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function UserProjectPermissionsContent(
  props: ProjectPermissionListResponseProps
) {
  const userProjectPermissionsData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data;
  }, [props.response]);

  return (
    <Stack gap={2}>
      {userProjectPermissionsData.map((project, index) => (
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
      ))}
    </Stack>
  );
}

function UserProjectPermissions(props: PageProps) {
  const {
    isFetching: userProjectPermissionsPending,
    error: userProjectPermissionsError,
    data: userProjectPermissionsResponse,
  } = useProjectPermissionsQuery(props);

  return (
    <Card className="h-100">
      <Card.Header>Project Permissions</Card.Header>
      <Card.Body className="overflow-y-scroll p-2 h-100">
        <QueryHandler
          isFetching={userProjectPermissionsPending}
          error={userProjectPermissionsError as Error}
          data={userProjectPermissionsResponse}
        >
          <UserProjectPermissionsContent
            {...props}
            response={userProjectPermissionsResponse}
          />
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

function UserActivityContent(props: ListResponseProps) {
  const userActivityData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data as RecordType[];
  }, [props.response]);

  return (
    <Stack className="h-100">
      <Card.Text>{recentActivityMessage}</Card.Text>
      <Table
        {...props}
        data={userActivityData}
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
      />
    </Stack>
  );
}

function UserActivity(props: PageProps) {
  const {
    isFetching: userActivityPending,
    error: userActivityError,
    data: userActivityResponse,
  } = useActivityQuery(props);

  return (
    <Card className="h-100">
      <Card.Header>Recent Activity</Card.Header>
      <Card.Body className="h-100">
        <QueryHandler
          isFetching={userActivityPending}
          error={userActivityError as Error}
          data={userActivityResponse}
        >
          <UserActivityContent {...props} response={userActivityResponse} />
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
              <UserProfile {...props} />
            </div>
            <div className="h-75">
              <UserProjectPermissions {...props} />
            </div>
          </Stack>
        </Col>
        <Col xs={8} sm={9} xl={10} className="h-100">
          <UserActivity {...props} />
        </Col>
      </Row>
    </Container>
  );
}

export default User;
