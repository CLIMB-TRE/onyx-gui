import { Card, Col, Container, Row, Stack, Button } from "react-bootstrap";
import { BsGithub, BsBook } from "react-icons/bs";
import { useCountQuery } from "../api";
import PageTitle from "../components/PageTitle";
import QueryHandler from "../components/QueryHandler";
import { DataProps } from "../interfaces";
import { useCount } from "../api/hooks";
import { ObjectType, OnyxTabKey } from "../types";
import { MdJoinInner } from "react-icons/md";

interface StatCardProps extends DataProps {
  objectType: ObjectType;
  title: string;
  searchPath: string;
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
                style={{ fontSize: "0.7em" }}
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
    <Container
      className="h-100 d-flex justify-content-center"
      style={{ paddingTop: "10vh" }}
    >
      <Row className="justify-content-center">
        <Col>
          <Stack gap={3}>
            <div className="display-2">
              <MdJoinInner color="var(--bs-pink)" /> Onyx
            </div>
            <Stack direction="horizontal" gap={2}>
              <Button
                variant="outline-secondary"
                href="https://github.com/CLIMB-TRE/onyx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsGithub /> GitHub
              </Button>
              <Button
                variant="outline-secondary"
                href="https://climb-tre.github.io/onyx/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsBook /> Documentation
              </Button>
            </Stack>
          </Stack>
        </Col>
        <Col>
          <Stack gap={2}>
            <div className="lead">
              <PageTitle
                title={props.project.name}
                description={props.fields.description}
              />
            </div>
            <StatCard
              {...props}
              objectType={ObjectType.RECORD}
              title="Total Records"
              searchPath={`projects/${props.project.code}`}
            />
            <StatCard
              {...props}
              objectType={ObjectType.ANALYSIS}
              title="Total Analyses"
              searchPath={`projects/${props.project.code}/analysis`}
            />
          </Stack>
        </Col>
      </Row>
    </Container>
  );
}
