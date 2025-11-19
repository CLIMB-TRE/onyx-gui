import { Card, Col, Container, Row, Stack } from "react-bootstrap";
import { useCountQuery, useProfileQuery } from "../api";
import PageTitle from "../components/PageTitle";
import QueryHandler from "../components/QueryHandler";
import { DataProps } from "../interfaces";
import { useCount, useProfile } from "../api/hooks";
import { ObjectType, OnyxTabKey } from "../types";
import { MdJoinInner } from "react-icons/md";
import { OnyxDocsButton, OnyxGithubButton } from "../components/Buttons";

interface StatCardProps extends DataProps {
  objectType: ObjectType;
  title: string;
  searchPath: string;
}

function Details(props: DataProps) {
  // Get the user profile
  const { isFetching, error, data } = useProfileQuery(props);
  const profile = useProfile(data);

  return (
    <Stack gap={2}>
      <h1 className="display-1" style={{ fontSize: "5rem" }}>
        <MdJoinInner color="var(--bs-pink)" /> Onyx
      </h1>
      <Stack direction="horizontal" gap={2}>
        <OnyxGithubButton />
        <OnyxDocsButton />
      </Stack>
      <QueryHandler isFetching={isFetching} error={error} data={data}>
        <small className="text-muted">
          Signed in as:{" "}
          <span
            className="onyx-text-pink"
            style={{ cursor: "pointer" }}
            onClick={() => {
              props.handleTabChange({
                ...props.tabState,
                tabKey: OnyxTabKey.USER,
              });
            }}
          >
            {profile.username}
          </span>
        </small>
      </QueryHandler>
    </Stack>
  );
}

function ProjectStats(props: DataProps) {
  return (
    <Stack gap={2}>
      <h2 className="fw-light">
        <PageTitle
          title={props.project.name}
          description={props.fields.description}
          noTruncate
        />
      </h2>
      <StatCard
        {...props}
        objectType={ObjectType.RECORD}
        title="Records"
        searchPath={`projects/${props.project.code}`}
      />
      <StatCard
        {...props}
        objectType={ObjectType.ANALYSIS}
        title="Analyses"
        searchPath={`projects/${props.project.code}/analysis`}
      />
    </Stack>
  );
}

function StatCard(props: StatCardProps) {
  // Get date 7 days ago in YYYY-MM-DD format
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const sevenDaysAgo = date.toISOString().split("T")[0];

  // Total object count
  const {
    isFetching: isTotalFetching,
    error: totalError,
    data: totalResponse,
  } = useCountQuery({
    ...props,
    searchPath: props.searchPath,
    searchParameters: "",
  });
  const totalCount = useCount(totalResponse);

  // New objects from the last 7 days
  const {
    isFetching: isNewFetching,
    error: newError,
    data: newResponse,
  } = useCountQuery({
    ...props,
    searchPath: props.searchPath,
    searchParameters: `published_date__gte=${sevenDaysAgo}`,
  });
  const newCount = useCount(newResponse);

  return (
    <QueryHandler
      isFetching={isTotalFetching}
      error={totalError}
      data={totalResponse}
    >
      <Card
        className="text-center"
        style={{ cursor: "pointer" }}
        onClick={() => {
          props.handleTabChange({
            ...props.tabState,
            tabKey:
              props.objectType === ObjectType.RECORD
                ? OnyxTabKey.RECORDS
                : OnyxTabKey.ANALYSES,
          });
        }}
      >
        <Card.Body>
          <Card.Title className="text-truncate">{props.title}</Card.Title>
          <Card.Text as="h2" className="mb-0">
            {totalCount.toLocaleString()}
            <br />
            <QueryHandler
              isFetching={isNewFetching}
              error={newError}
              data={newResponse}
            >
              <span
                className="onyx-text-pink fw-light"
                style={{ fontSize: "0.6em" }}
              >
                +{newCount.toLocaleString()} in last 7 days
              </span>
            </QueryHandler>
          </Card.Text>
        </Card.Body>
      </Card>
    </QueryHandler>
  );
}

export default function Overview(props: DataProps) {
  return (
    <Container className="h-100" style={{ paddingTop: "20vh" }}>
      <Row>
        <Col className="m-5" xs="auto">
          <Details {...props} />
        </Col>
        <Col>
          <ProjectStats {...props} />
        </Col>
      </Row>
    </Container>
  );
}
