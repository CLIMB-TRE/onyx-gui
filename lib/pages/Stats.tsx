import { useState, useLayoutEffect } from "react";
import { Dropdown } from "../components/Dropdowns";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import graphStyles from "../utils/graphStyles";
import { OnyxProps, ProjectField } from "../types";

type GraphConfig = {
  type: string;
  field: string;
  groupBy: string;
};

interface StatsProps extends OnyxProps {
  project: string;
  projectFields: Map<string, ProjectField>;
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
  isGrouped?: boolean;
}

interface GraphPanelProps extends GroupedGraphProps {
  type: string;
  handleGraphConfigTypeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupByChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigAdd: () => void;
  handleGraphConfigRemove: () => void;
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
        height: 330,
        // @ts-expect-error Typing this would be madness
        template: props.darkMode ? graphStyles : undefined,
        yaxis: { fixedrange: true },
        showlegend: props.isGrouped ? true : false,
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
      isGrouped
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

function BarGraph(props: GraphProps) {
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
          type: "bar",
          marker: { color: "#00CC96" },
        },
      ]}
    />
  );
}

function GroupedBarGraph(props: GroupedGraphProps) {
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
          type: "bar",
        })
      )}
      title={`Records by ${props.field}, grouped by ${props.groupBy}`}
      isGrouped
    />
  );
}

function GraphPanel(props: GraphPanelProps) {
  let g: JSX.Element;
  let fields: string[];
  let groupBy: string[];

  // TODO: Very messy conditionals here
  if (props.type === "pie") {
    fields = Array.from(props.projectFields.keys()).filter(
      (k) => props.projectFields.get(k)?.type === "choice" && !k.includes("__")
    );
    groupBy = [];

    if (props.field) {
      g = <PieGraph {...props} field={props.field} />;
    } else {
      g = <BaseGraph {...props} data={[]} title="Empty Graph" />;
    }
  } else if (props.type === "line") {
    fields = Array.from(props.projectFields.keys()).filter(
      (k) => props.projectFields.get(k)?.type === "date" && !k.includes("__")
    );
    groupBy = Array.from(props.projectFields.keys()).filter(
      (k) => props.projectFields.get(k)?.type === "choice" && !k.includes("__")
    );

    if (props.field) {
      if (props.groupBy) {
        g = (
          <GroupedScatterGraph
            {...props}
            field={props.field}
            groupBy={props.groupBy}
          />
        );
      } else {
        g = <ScatterGraph {...props} field={props.field} />;
      }
    } else {
      g = <BaseGraph {...props} data={[]} title="Empty Graph" />;
    }
  } else if (props.type === "bar") {
    fields = Array.from(props.projectFields.keys()).filter(
      (k) =>
        (props.projectFields.get(k)?.type === "choice" ||
          props.projectFields.get(k)?.type === "date") &&
        !k.includes("__")
    );
    groupBy = Array.from(props.projectFields.keys()).filter(
      (k) => props.projectFields.get(k)?.type === "choice" && !k.includes("__")
    );

    if (props.field) {
      if (props.groupBy) {
        g = (
          <GroupedBarGraph
            {...props}
            field={props.field}
            groupBy={props.groupBy}
          />
        );
      } else {
        g = <BarGraph {...props} field={props.field} />;
      }
    } else {
      g = <BaseGraph {...props} data={[]} title="Empty Graph" />;
    }
  } else {
    g = <BaseGraph {...props} data={[]} title="Empty Graph" />;
    fields = [];
    groupBy = [];
  }

  return (
    <Row className="g-2">
      <Col xl={9}>
        <Card body>{g}</Card>
      </Col>
      <Col xl={3}>
        <Card style={{ height: "100%" }}>
          <Card.Header>
            <span>Options</span>
            <Stack direction="horizontal" gap={1} className="float-end">
              <Button variant="primary" onClick={props.handleGraphConfigAdd}>
                +
              </Button>
              <Button variant="danger" onClick={props.handleGraphConfigRemove}>
                -
              </Button>
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Graph Type</Form.Label>
                <Dropdown
                  isClearable
                  options={["line", "pie", "bar"]}
                  value={props.type}
                  onChange={props.handleGraphConfigTypeChange}
                  darkMode={props.darkMode}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Field</Form.Label>
                <Dropdown
                  isClearable
                  options={fields}
                  value={props.field}
                  onChange={props.handleGraphConfigFieldChange}
                  darkMode={props.darkMode}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Group By</Form.Label>
                <Dropdown
                  isDisabled={props.type === "pie"}
                  isClearable
                  options={groupBy}
                  value={props.groupBy}
                  onChange={props.handleGraphConfigGroupByChange}
                  darkMode={props.darkMode}
                />
              </Form.Group>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function Stats(props: StatsProps) {
  const [graphConfigList, setGraphConfigList] = useState([
    { type: "line", field: "published_date", groupBy: "site" },
    { type: "pie", field: "site", groupBy: "" },
  ] as GraphConfig[]);

  // Reset graphs when project changes
  useLayoutEffect(() => {
    setGraphConfigList([
      { type: "line", field: "published_date", groupBy: "site" },
      { type: "pie", field: "site", groupBy: "" },
    ]);
  }, [props.project]);

  const handleGraphConfigTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].type = e.target.value;
    list[index].field = "";
    list[index].groupBy = "";
    setGraphConfigList(list);
  };

  const handleGraphConfigFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].field = e.target.value;
    setGraphConfigList(list);
  };

  const handleGraphConfigGroupByChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].groupBy = e.target.value;
    setGraphConfigList(list);
  };

  const handleGraphConfigAdd = (index: number) => {
    setGraphConfigList([
      ...graphConfigList.slice(0, index),
      { type: "", field: "", groupBy: "" },
      ...graphConfigList.slice(index),
    ]);
  };

  const handleGraphConfigRemove = (index: number) => {
    const list = [...graphConfigList];
    list.splice(index, 1);
    setGraphConfigList(list);
  };

  const handleGraphConfigClear = () => {
    setGraphConfigList([]);
  };

  return (
    <Container fluid className="g-2">
      <Card>
        <Card.Header>
          <span>Graphs</span>
          <Stack direction="horizontal" gap={1} className="float-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleGraphConfigAdd(graphConfigList.length)}
            >
              Add Graph
            </Button>
            <Button size="sm" variant="danger" onClick={handleGraphConfigClear}>
              Clear Graphs
            </Button>
          </Stack>
        </Card.Header>
        <Container fluid className="graph-panel p-2">
          <Stack gap={2}>
            {graphConfigList.map((graphConfig, index) => (
              <GraphPanel
                key={index}
                {...props}
                type={graphConfig.type}
                field={graphConfig.field}
                groupBy={graphConfig.groupBy}
                handleGraphConfigTypeChange={(e) =>
                  handleGraphConfigTypeChange(e, index)
                }
                handleGraphConfigFieldChange={(e) =>
                  handleGraphConfigFieldChange(e, index)
                }
                handleGraphConfigGroupByChange={(e) =>
                  handleGraphConfigGroupByChange(e, index)
                }
                handleGraphConfigAdd={() => handleGraphConfigAdd(index + 1)}
                handleGraphConfigRemove={() => handleGraphConfigRemove(index)}
              />
            ))}
          </Stack>
        </Container>
      </Card>
    </Container>
  );
}

export default Stats;
