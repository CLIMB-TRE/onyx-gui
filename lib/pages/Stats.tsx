import { useState, useLayoutEffect } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Dropdown as BDropdown } from "react-bootstrap";
import DropdownButton from "react-bootstrap/DropdownButton";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import { Dropdown } from "../components/Dropdowns";
import {
  BaseGraph,
  ScatterGraph,
  BarGraph,
  PieGraph,
  GroupedScatterGraph,
  GroupedBarGraph,
} from "../components/Graphs";
import { StatsProps } from "../interfaces";
import generateKey from "../utils/generateKey";

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

type GraphConfig = {
  key: string;
  type: string;
  field: string;
  groupBy: string;
  groupMode: string;
};

function GraphPanelGraph(props: GraphPanelProps) {
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
      g = <BaseGraph {...props} data={[]} title="Empty Graph" uirevision={0} />;
  }
  return g;
}

function GraphPanelOptions(props: GraphPanelProps) {
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

  let fieldOptions: string[] = [];
  let groupByOptions: string[] = [];
  if (props.type) {
    fieldOptions = props.graphFieldOptions.filter((field) =>
      graphConfig[props.type as keyof typeof graphConfig].fields.includes(
        props.projectFields.get(field)?.type || ""
      )
    );
    groupByOptions = props.graphFieldOptions.filter((field) =>
      graphConfig[props.type as keyof typeof graphConfig].groupBy.includes(
        props.projectFields.get(field)?.type || ""
      )
    );
  }

  return (
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
            options={fieldOptions}
            value={props.field}
            placeholder="Select field..."
            onChange={props.handleGraphConfigFieldChange}
          />
        </Form.Group>
      )}
      {(props.type === "line" || props.type === "bar") && (
        <Form.Group className="mb-3">
          <Form.Label>Group By</Form.Label>
          <Dropdown
            isClearable
            options={groupByOptions}
            value={props.groupBy}
            placeholder="Select field..."
            onChange={props.handleGraphConfigGroupByChange}
          />
        </Form.Group>
      )}
      {props.type === "bar" && (
        <Form.Group className="mb-3">
          <Form.Label>Mode</Form.Label>
          <Dropdown
            options={["stack", "group", "norm"]}
            value={props.groupMode}
            onChange={props.handleGraphConfigGroupModeChange}
          />
        </Form.Group>
      )}
    </Form>
  );
}

function GraphPanel(props: GraphPanelProps) {
  return (
    <Container fluid className="g-0">
      <Row className="g-2">
        <Col xl={12} xxl={9}>
          <Card body style={{ height: "365px" }}>
            <GraphPanelGraph {...props} />
          </Card>
        </Col>
        <Col xl={12} xxl={3}>
          <Card style={{ height: "365px" }}>
            <Card.Header>
              <span>Options</span>
              <Stack direction="horizontal" gap={1} className="float-end">
                <Button
                  size="sm"
                  variant="dark"
                  onClick={props.handleGraphConfigAdd}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="dark"
                  onClick={props.handleGraphConfigRemove}
                >
                  -
                </Button>
              </Stack>
            </Card.Header>
            <Card.Body style={{ overflowY: "scroll" }}>
              <GraphPanelOptions {...props} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function Stats(props: StatsProps) {
  const defaultGraphConfig = () =>
    [
      {
        key: generateKey(),
        type: "bar",
        field: "published_date",
        groupBy: "",
        groupMode: "stack",
      },
      {
        key: generateKey(),
        type: "bar",
        field: "published_date",
        groupBy: "site",
        groupMode: "stack",
      },
      {
        key: generateKey(),
        type: "pie",
        field: "site",
        groupBy: "",
        groupMode: "",
      },
      {
        key: generateKey(),
        type: "line",
        field: "published_date",
        groupBy: "site",
        groupMode: "",
      },
    ] as GraphConfig[];

  const [viewMode, setViewMode] = useState("wide");
  const [graphConfigList, setGraphConfigList] = useState(defaultGraphConfig());
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

  // Reset graphs when project changes
  useLayoutEffect(() => {
    setGraphConfigList(defaultGraphConfig());
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {
        key: generateKey(),
        type: "",
        field: "",
        groupBy: "",
        groupMode: "",
      },
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
            <DropdownButton
              title={`View Mode: ${
                viewMode.charAt(0).toUpperCase() + viewMode.slice(1)
              }`}
              size="sm"
              variant="dark"
            >
              <BDropdown.Item key="wide" onClick={() => setViewMode("wide")}>
                Wide
              </BDropdown.Item>
              <BDropdown.Item
                key="compact"
                onClick={() => setViewMode("compact")}
              >
                Compact
              </BDropdown.Item>
            </DropdownButton>
          </Stack>
        </Card.Header>
        <Container fluid className="onyx-graphs-panel-body p-2">
          <Row className="g-2">
            {graphConfigList.map((graphConfig, index) => (
              <Col key={graphConfig.key} lg={viewMode === "wide" ? 12 : 6}>
                <GraphPanel
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
              </Col>
            ))}
          </Row>
        </Container>
      </Card>
    </Container>
  );
}

export default Stats;
