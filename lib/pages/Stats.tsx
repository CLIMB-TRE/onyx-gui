import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import graphStyles from "../utils/graphStyles";
import { OnyxProps } from "../types";

interface StatsProps extends OnyxProps {
  project: string;
  darkMode: boolean;
}

interface GraphProps extends StatsProps {
  field: string;
}

interface GroupedGraphProps extends GraphProps {
  groupBy: string;
}

interface BaseGraphProps extends GraphProps {
  data: Record<string, string[] | number[] | string | Record<string, string>>[];
  title?: string;
}

const useSummaryQuery = (props: GraphProps) => {
  return useQuery({
    queryKey: ["results", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?summarise=${props.field}`)
        .then((response) => response.json())
        .then((data) => {
          const field_data = data.data.map(
            (record: Record<string, unknown>) => record[props.field]
          );
          const count_data = data.data.map(
            (record: Record<string, unknown>) => record.count
          );
          return { field_data, count_data };
        });
    },
    enabled: !!props.project,
  });
};

const useGroupedSummaryQuery = (props: GroupedGraphProps) => {
  return useQuery({
    queryKey: ["results", props.project, props.field, props.groupBy],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/?summarise=${props.field}&summarise=${props.groupBy}`
        )
        .then((response) => response.json())
        .then((data) => {
          const groupedData = new Map<
            string,
            { field_data: Array<string>; count_data: Array<number> }
          >();

          data.data.forEach((record: Record<string, string | number>) => {
            const group_by_value = record[props.groupBy].toString();

            if (!groupedData.has(group_by_value)) {
              groupedData.set(group_by_value, {
                field_data: [],
                count_data: [],
              });
            }

            groupedData
              .get(group_by_value)
              ?.field_data.push(record[props.field].toString());

            groupedData
              .get(group_by_value)
              ?.count_data.push(Number(record.count));
          });

          return groupedData;
        });
    },
    enabled: !!props.project,
  });
};

function BaseGraph(props: BaseGraphProps) {
  return (
    <Plot
      data={props.data}
      layout={{
        autosize: true,
        title: props.title || `Records by ${props.field}`,
        margin: {
          l: 50,
          r: 50,
          b: 50,
          t: 50,
          pad: 4,
        },
        height: 300,
        // @ts-expect-error Typing this would be madness
        template: props.darkMode ? graphStyles : undefined,
        yaxis: { fixedrange: true },
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function ScatterGraph(props: GraphProps) {
  const {
    data = {
      field_data: [],
      count_data: [],
    },
  } = useSummaryQuery(props);

  return (
    <BaseGraph
      {...props}
      data={[
        {
          x: data.field_data,
          y: data.count_data,
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "#00CC96" },
        },
      ]}
    />
  );
}

function GroupedScatterGraph(props: GroupedGraphProps) {
  const {
    data = new Map<string, { field_data: string[]; count_data: number[] }>(),
  } = useGroupedSummaryQuery(props);

  return (
    <BaseGraph
      {...props}
      data={Array.from(data.entries()).map(
        ([group, { field_data, count_data }]) => ({
          x: field_data,
          y: count_data,
          name: group,
          type: "scatter",
          mode: "lines+markers",
        })
      )}
      title={`Records by ${props.field}, grouped by ${props.groupBy}`}
    />
  );
}

function PieGraph(props: GraphProps) {
  const {
    data = {
      field_data: [],
      count_data: [],
    },
  } = useSummaryQuery(props);

  return (
    <BaseGraph
      {...props}
      data={[
        {
          labels: data.field_data,
          values: data.count_data,
          type: "pie",
          marker: { color: "#198754" },
        },
      ]}
    />
  );
}

function Stats(props: StatsProps) {
  return (
    <Container fluid className="g-2">
      <Card>
        <Card.Header>Graphs</Card.Header>
        <Card.Body className="graph-panel">
          <Row className="g-2">
            <Col xl={9}>
              <Stack gap={2}>
                <Card body>
                  <ScatterGraph {...props} field="collection_date" />
                </Card>
                <Card body>
                  <ScatterGraph {...props} field="received_date" />
                </Card>
                <Card body>
                  <GroupedScatterGraph
                    {...props}
                    field="received_date"
                    groupBy="site"
                  />
                </Card>
              </Stack>
            </Col>
            <Col xl={3}>
              <Stack gap={2}>
                <Card body>
                  <PieGraph {...props} field="site" />
                </Card>
                <Card body>
                  <PieGraph {...props} field="platform" />
                </Card>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Stats;
