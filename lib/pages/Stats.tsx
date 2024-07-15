import { useState, useMemo, useLayoutEffect } from "react";
import { Dropdown } from "../components/Dropdowns";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { useQuery } from "@tanstack/react-query";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { Template } from "plotly.js-basic-dist";
import graphStyles from "../utils/graphStyles";
import { OnyxProps, ProjectField } from "../types";

// Create Plotly component using basic plotly distribution
const Plot = createPlotlyComponent(Plotly);

type GraphConfig = {
  type: string;
  field: string;
  groupBy: string;
  groupMode: string;
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
  groupMode?: string;
}

interface BaseGraphProps extends GraphProps {
  data: Record<string, string[] | number[] | string | Record<string, string>>[];
  title?: string;
  xTitle?: string;
  yTitle?: string;
  legendTitle?: string;
  layout?: Record<string, unknown>;
}

interface GraphPanelProps extends GroupedGraphProps {
  type: string;
  groupMode: string;
  handleGraphConfigTypeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupByChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupModeChange: React.ChangeEventHandler<HTMLSelectElement>;
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
        ...props.layout,
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
        template: props.darkMode ? (graphStyles as Template) : undefined,
        xaxis: { title: props.xTitle },
        yaxis: { title: props.yTitle, fixedrange: true },
        legend: { title: { text: props.legendTitle } },
        showlegend: props.legendTitle ? true : false,
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
      xTitle={props.field}
      yTitle="count"
    />
  );
}

function GroupedScatterGraph(props: GroupedGraphProps) {
  const {
    data = new Map<string, { field_data: string[]; count_data: number[] }>(),
  } = useGroupedSummaryQuery(props);

  const graphData = useMemo(
    () =>
      Array.from(data.entries()).map(([group, { field_data, count_data }]) => ({
        x: field_data,
        y: count_data,
        name: group,
        type: "scatter",
        mode: "lines+markers",
      })),
    [data]
  );

  return (
    <BaseGraph
      {...props}
      data={graphData}
      title={`Records by ${props.field}, grouped by ${props.groupBy}`}
      xTitle={props.field}
      yTitle="count"
      legendTitle={props.groupBy}
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
      xTitle={props.field}
      yTitle="count"
    />
  );
}

function GroupedBarGraph(props: GroupedGraphProps) {
  const {
    data = new Map<string, { field_data: string[]; count_data: number[] }>(),
  } = useGroupedSummaryQuery(props);

  const graphData = useMemo(
    () =>
      Array.from(data.entries()).map(([group, { field_data, count_data }]) => ({
        x: field_data,
        y: count_data,
        name: group,
        type: "bar",
      })),
    [data]
  );

  let layout: Record<string, string> = {};
  let yTitle = "count";

  if (props.groupMode === "group") {
    layout = { barmode: "group" };
  } else if (props.groupMode === "stack") {
    layout = { barmode: "stack" };
  } else if (props.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

  return (
    <BaseGraph
      {...props}
      data={graphData}
      title={`Records by ${props.field}, grouped by ${props.groupBy}`}
      xTitle={props.field}
      yTitle={yTitle}
      legendTitle={props.groupBy}
      layout={layout}
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
      legendTitle={props.field}
    />
  );
}

function GraphPanel(props: GraphPanelProps) {
  let g: JSX.Element;
  let fields: string[];
  let groupBy: string[];

  const graphConfig = {
    line: {
      fields: ["date"],
      groupBy: ["choice", "bool"],
    },
    bar: {
      fields: ["choice", "date", "bool"],
      groupBy: ["choice", "bool"],
    },
    pie: {
      fields: ["choice", "bool"],
      groupBy: [],
    },
  };

  const emptyGraph = () => (
    <BaseGraph {...props} data={[]} title="Empty Graph" />
  );

  const getType = (field: string) => {
    return props.projectFields.get(field)?.type || "";
  };

  const projectFieldsArray = Array.from(props.projectFields.keys());

  if (props.type === "line") {
    fields = projectFieldsArray.filter(
      (field) =>
        graphConfig.line.fields.includes(getType(field)) &&
        !field.includes("__")
    );
    groupBy = projectFieldsArray.filter(
      (field) =>
        graphConfig.line.groupBy.includes(getType(field)) &&
        !field.includes("__")
    );

    if (props.field && props.groupBy) {
      g = (
        <GroupedScatterGraph
          {...props}
          field={props.field}
          groupBy={props.groupBy}
        />
      );
    } else if (props.field) {
      g = <ScatterGraph {...props} field={props.field} />;
    } else {
      g = emptyGraph();
    }
  } else if (props.type === "bar") {
    fields = projectFieldsArray.filter(
      (field) =>
        graphConfig.bar.fields.includes(getType(field)) && !field.includes("__")
    );
    groupBy = projectFieldsArray.filter(
      (field) =>
        graphConfig.bar.groupBy.includes(getType(field)) &&
        !field.includes("__")
    );

    if (props.field && props.groupBy) {
      g = (
        <GroupedBarGraph
          {...props}
          field={props.field}
          groupBy={props.groupBy}
          groupMode={props.groupMode}
        />
      );
    } else if (props.field) {
      g = <BarGraph {...props} field={props.field} />;
    } else {
      g = emptyGraph();
    }
  } else if (props.type === "pie") {
    fields = projectFieldsArray.filter(
      (field) =>
        graphConfig.pie.fields.includes(getType(field)) && !field.includes("__")
    );
    groupBy = [];

    if (props.field) {
      g = <PieGraph {...props} field={props.field} />;
    } else {
      g = emptyGraph();
    }
  } else {
    g = emptyGraph();
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
              <Button variant="dark" onClick={props.handleGraphConfigAdd}>
                +
              </Button>
              <Button variant="dark" onClick={props.handleGraphConfigRemove}>
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
                  options={["line", "bar", "pie"]}
                  value={props.type}
                  placeholder="Select graph type..."
                  onChange={props.handleGraphConfigTypeChange}
                />
              </Form.Group>
              {props.type && (
                <Form.Group className="mb-3">
                  <Form.Label>Field</Form.Label>
                  <Dropdown
                    isClearable
                    options={fields}
                    value={props.field}
                    placeholder="Select field..."
                    onChange={props.handleGraphConfigFieldChange}
                  />
                </Form.Group>
              )}
              {props.type === "bar" ? (
                <Row className="g-3">
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Group By</Form.Label>
                      <Dropdown
                        isClearable
                        options={groupBy}
                        value={props.groupBy}
                        placeholder="Select field..."
                        onChange={props.handleGraphConfigGroupByChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Mode</Form.Label>
                      <Dropdown
                        options={["group", "stack", "norm"]}
                        value={props.groupMode}
                        onChange={props.handleGraphConfigGroupModeChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              ) : (
                props.type === "line" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Group By</Form.Label>
                    <Dropdown
                      isClearable
                      options={groupBy}
                      value={props.groupBy}
                      placeholder="Select field..."
                      onChange={props.handleGraphConfigGroupByChange}
                    />
                  </Form.Group>
                )
              )}
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function Stats(props: StatsProps) {
  const [graphConfigList, setGraphConfigList] = useState([
    { type: "line", field: "published_date", groupBy: "" },
    { type: "line", field: "published_date", groupBy: "site" },
  ] as GraphConfig[]);

  // Reset graphs when project changes
  useLayoutEffect(() => {
    setGraphConfigList([
      { type: "line", field: "published_date", groupBy: "", groupMode: "" },
      { type: "line", field: "published_date", groupBy: "site", groupMode: "" },
    ]);
  }, [props.project]);

  const handleGraphConfigTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    if (list[index].type !== e.target.value) {
      list[index].field = "";
      list[index].groupBy = "";
      if (e.target.value === "bar") {
        list[index].groupMode = "group";
      } else {
        list[index].groupMode = "";
      }
    }
    list[index].type = e.target.value;
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

  const handleGraphConfigGroupModeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].groupMode = e.target.value;
    setGraphConfigList(list);
  };

  const handleGraphConfigAdd = (index: number) => {
    setGraphConfigList([
      ...graphConfigList.slice(0, index),
      { type: "", field: "", groupBy: "", groupMode: "" },
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
              variant="dark"
              onClick={() => handleGraphConfigAdd(graphConfigList.length)}
            >
              Add Graph
            </Button>
            <Button size="sm" variant="dark" onClick={handleGraphConfigClear}>
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
                groupMode={graphConfig.groupMode}
                handleGraphConfigTypeChange={(e) =>
                  handleGraphConfigTypeChange(e, index)
                }
                handleGraphConfigFieldChange={(e) =>
                  handleGraphConfigFieldChange(e, index)
                }
                handleGraphConfigGroupByChange={(e) =>
                  handleGraphConfigGroupByChange(e, index)
                }
                handleGraphConfigGroupModeChange={(e) =>
                  handleGraphConfigGroupModeChange(e, index)
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
