import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { useQuery } from "@tanstack/react-query";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import {
  TimestampCellRenderer,
  HTTPStatusCellRenderer,
  HTTPMethodCellRenderer,
  JSONCellRenderer,
} from "../components/CellRenderers";
import { UserProps } from "../interfaces";
import {
  RecordDetailResponse,
  RecordListResponse,
  ProjectPermissionListResponse,
  ErrorResponse,
  RecordType,
} from "../types";
import { recentActivityMessage } from "../utils/messages";

interface DetailResponseProps extends UserProps {
  response: RecordDetailResponse | ErrorResponse;
}

interface ListResponseProps extends UserProps {
  response: RecordListResponse | ErrorResponse;
}

interface ProjectPermissionListResponseProps extends UserProps {
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
    <Card className="h-100">
      <Card.Header>Details</Card.Header>
      <Card.Body className="overflow-y-scroll">
        <Container>
          <UserDataField name="Username" value={userProfileData.username} />
          <UserDataField name="Site" value={userProfileData.site} />
        </Container>
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
    <Card className="h-100">
      <Card.Header>Project Permissions</Card.Header>
      <Container fluid className="overflow-y-scroll p-2 h-100">
        <Stack gap={2}>
          {userProjectPermissionsData.map((project) => (
            <Card body>
              <UserDataField name="Project" value={project.project} />
              <UserDataField name="Scope" value={project.scope} />
              <UserDataField
                name="Actions"
                value={
                  <ul>
                    {project.actions?.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                }
              />
            </Card>
          ))}
        </Stack>
      </Container>
    </Card>
  );
}

function UserActivityContent(props: ListResponseProps) {
  const userActivityData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data as RecordType[];
  }, [props.response]);

  return (
    <Card className="h-100">
      <Card.Header>Recent Activity</Card.Header>
      <Card.Body className="h-100">
        <Container fluid className="p-2 pb-0 h-100">
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
        </Container>
      </Card.Body>
    </Card>
  );
}

function UserProfile(props: UserProps) {
  // Fetch user profile
  const {
    isFetching: userProfilePending,
    error: userProfileError,
    data: userProfileResponse,
  } = useQuery({
    queryKey: ["profile-detail"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/profile/")
        .then((response) => response.json());
    },
    enabled: !!props.project,
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });

  return (
    <QueryHandler
      isFetching={userProfilePending}
      error={userProfileError as Error}
      data={userProfileResponse}
    >
      <UserProfileContent {...props} response={userProfileResponse} />
    </QueryHandler>
  );
}

function UserProjectPermissions(props: UserProps) {
  // Fetch project list
  const {
    isFetching: userProjectPermissionsPending,
    error: userProjectPermissionsError,
    data: userProjectPermissionsResponse,
  } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/")
        .then((response) => response.json());
    },
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });

  return (
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
  );
}

function UserActivity(props: UserProps) {
  // Fetch user activity
  const {
    isFetching: userActivityPending,
    error: userActivityError,
    data: userActivityResponse,
  } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/activity/")
        .then((response) => response.json());
    },
    enabled: !!props.project,
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });

  return (
    <QueryHandler
      isFetching={userActivityPending}
      error={userActivityError as Error}
      data={userActivityResponse}
    >
      <UserActivityContent {...props} response={userActivityResponse} />
    </QueryHandler>
  );
}

function User(props: UserProps) {
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
