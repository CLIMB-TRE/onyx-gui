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
import { OnyxProps, ProjectField, ResultType } from "../types";

// Create Plotly component using basic plotly distribution
const Plot = createPlotlyComponent(Plotly);

const useSummaryQuery = (props: GraphProps) => {
  return useQuery({
    queryKey: ["results", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?summarise=${props.field}`)
        .then((response) => response.json())
        .then((data) => {
          const field_data = data.data.map((record: ResultType) => {
            // Convert null field value to empty string
            let field_value = record[props.field];
            if (field_value === null) {
              field_value = "";
            } else {
              field_value = field_value.toString();
            }
            return field_value;
          });
          const count_data = data.data.map(
            (record: { count: number }) => record.count
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
            { field_data: string[]; count_data: number[] }
          >();

          data.data.forEach((record: ResultType) => {
            // Convert null field value to empty string
            let field_value = record[props.field];
            if (field_value === null) {
              field_value = "";
            } else {
              field_value = field_value.toString();
            }

            // Convert null group-by value to empty string
            let group_by_value = record[props.groupBy];
            if (group_by_value === null) {
              group_by_value = "";
            } else {
              group_by_value = group_by_value.toString();
            }

            // Add field value and count to grouped data
            const groupedValue = groupedData.get(group_by_value);
            if (!groupedValue) {
              groupedData.set(group_by_value, {
                field_data: [field_value],
                count_data: [record.count as number],
              });
              return;
            } else {
              groupedValue.field_data.push(field_value);
              groupedValue.count_data.push(record.count as number);
            }
          });

          return groupedData;
        });
    },
    enabled: !!props.project,
  });
};

interface BaseGraphProps {
  data: Plotly.Data[];
  title: string;
  xTitle?: string;
  yTitle?: string;
  legendTitle?: string;
  layout?: Record<string, unknown>;
  darkMode: boolean;
}

function BaseGraph(props: BaseGraphProps) {
  return (
    <Plot
      data={props.data}
      layout={{
        ...props.layout,
        autosize: true,
        title: props.title,
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
        yaxis: { title: props.yTitle },
        legend: { title: { text: props.legendTitle } },
        showlegend: props.legendTitle ? true : false,
        colorway: [
          "#00cc96",
          "#636efa",
          "#EF553B",
          "#ab63fa",
          "#FFA15A",
          "#19d3f3",
          "#FF6692",
          "#B6E880",
          "#FF97FF",
          "#FECB52",
        ],
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function getType(projectFields: Map<string, ProjectField>, field: string) {
  return projectFields.get(field)?.type || "";
}

function getTitle(
  projectFields: Map<string, ProjectField>,
  field: string,
  data: { field_data: string[]; count_data: number[] }
) {
  let title = `Records by ${field}`;

  if (getType(projectFields, field) === "date") {
    const nullCount = data.count_data[data.field_data.indexOf("")] || 0;

    if (nullCount) {
      title += `<br>(Excluding ${nullCount} records with no ${field})`;
    }
  }

  return title;
}

function getGroupedTitle(
  projectFields: Map<string, ProjectField>,
  field: string,
  groupBy: string,
  data: Map<string, { field_data: string[]; count_data: number[] }>
) {
  let title = `Records by ${field}, grouped by ${groupBy}`;

  if (getType(projectFields, field) === "date") {
    let nullCount = 0;

    data.forEach(({ field_data, count_data }) => {
      nullCount += count_data[field_data.indexOf("")] || 0;
    });

    if (nullCount) {
      title += `<br>(Excluding ${nullCount} records with no ${field})`;
    }
  }

  return title;
}

interface GraphProps extends StatsProps {
  field: string;
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
        },
      ]}
      title={getTitle(props.projectFields, props.field, data)}
      xTitle={props.field}
      yTitle="count"
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
        },
      ]}
      title={getTitle(props.projectFields, props.field, data)}
      xTitle={props.field}
      yTitle="count"
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
      title={getTitle(props.projectFields, props.field, data)}
      legendTitle={props.field}
    />
  );
}

interface GroupedGraphProps extends GraphProps {
  groupBy: string;
  groupMode?: string;
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
      })) as Plotly.Data[],
    [data]
  );

  return (
    <BaseGraph
      {...props}
      data={graphData}
      title={getGroupedTitle(
        props.projectFields,
        props.field,
        props.groupBy,
        data
      )}
      xTitle={props.field}
      yTitle="count"
      legendTitle={props.groupBy}
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
      })) as Plotly.Data[],
    [data]
  );

  let layout: Record<string, string> = {};
  let yTitle = "count";

  if (props.groupMode === "stack") {
    layout = { barmode: "stack" };
  } else if (props.groupMode === "group") {
    layout = { barmode: "group" };
  } else if (props.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

  return (
    <BaseGraph
      {...props}
      data={graphData}
      title={getGroupedTitle(
        props.projectFields,
        props.field,
        props.groupBy,
        data
      )}
      xTitle={props.field}
      yTitle={yTitle}
      legendTitle={props.groupBy}
      layout={layout}
    />
  );
}

interface GraphPanelProps extends StatsProps {
  type: string;
  field: string;
  groupBy: string;
  groupMode: string;
  graphFieldOptions: string[];
  handleGraphConfigTypeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupByChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupModeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigAdd: () => void;
  handleGraphConfigRemove: () => void;
}

function GraphPanel(props: GraphPanelProps) {
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
      groupBy: [] as string[],
    },
  };

  let fields: string[] = [];
  let groupBy: string[] = [];
  if (props.type) {
    fields = props.graphFieldOptions.filter((field) =>
      graphConfig[props.type as keyof typeof graphConfig].fields.includes(
        getType(props.projectFields, field)
      )
    );
    groupBy = props.graphFieldOptions.filter((field) =>
      graphConfig[props.type as keyof typeof graphConfig].groupBy.includes(
        getType(props.projectFields, field)
      )
    );
  }

  let g: JSX.Element;

  switch (true) {
    case props.type === "line" && !!props.field && !!props.groupBy:
      g = (
        <GroupedScatterGraph
          {...props}
          field={props.field}
          groupBy={props.groupBy}
        />
      );
      break;
    case props.type === "line" && !!props.field:
      g = <ScatterGraph {...props} field={props.field} />;
      break;
    case props.type === "bar" && !!props.field && !!props.groupBy:
      g = (
        <GroupedBarGraph
          {...props}
          field={props.field}
          groupBy={props.groupBy}
          groupMode={props.groupMode}
        />
      );
      break;
    case props.type === "bar" && !!props.field:
      g = <BarGraph {...props} field={props.field} />;
      break;
    case props.type === "pie" && !!props.field:
      g = <PieGraph {...props} field={props.field} />;
      break;
    default:
      g = <BaseGraph {...props} data={[]} title="Empty Graph" />;
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
                        options={["stack", "group", "norm"]}
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

function Stats(props: StatsProps) {
  const [graphConfigList, setGraphConfigList] = useState([
    { type: "line", field: "published_date", groupBy: "" },
    { type: "line", field: "published_date", groupBy: "site" },
  ] as GraphConfig[]);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

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
        list[index].groupMode = "stack";
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
                graphFieldOptions={listFieldOptions}
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
