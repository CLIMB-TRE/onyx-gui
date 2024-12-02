import { useState, useLayoutEffect, useMemo } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Dropdown as BDropdown } from "react-bootstrap";
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
import { GraphConfig } from "../types";
import generateKey from "../utils/generateKey";
import {
  MdCreate,
  MdClear,
  MdGridView,
  MdOutlineSplitscreen,
  MdArrowBack,
  MdArrowForward,
  MdArrowUpward,
  MdArrowDownward,
  MdSettings,
  MdOutlineSettings,
} from "react-icons/md";

interface GraphPanelProps extends StatsProps {
  graphConfig: GraphConfig;
  graphFieldOptions: string[];
  handleGraphConfigTypeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupByChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupModeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigYAxisTypeChange: React.ChangeEventHandler<HTMLInputElement>;
  handleGraphConfigSwapLeft: () => void;
  handleGraphConfigSwapRight: () => void;
  handleGraphConfigRemove: () => void;
  viewMode: string;
  firstGraph: boolean;
  lastGraph: boolean;
}

function GraphPanelGraph(props: GraphPanelProps) {
  let g: JSX.Element;

  switch (true) {
    case props.graphConfig.type === "line" &&
      !!props.graphConfig.field &&
      !!props.graphConfig.groupBy:
      g = <GroupedScatterGraph {...props} />;
      break;
    case props.graphConfig.type === "line" && !!props.graphConfig.field:
      g = <ScatterGraph {...props} />;
      break;
    case props.graphConfig.type === "bar" &&
      !!props.graphConfig.field &&
      !!props.graphConfig.groupBy:
      g = <GroupedBarGraph {...props} />;
      break;
    case props.graphConfig.type === "bar" && !!props.graphConfig.field:
      g = <BarGraph {...props} />;
      break;
    case props.graphConfig.type === "pie" && !!props.graphConfig.field:
      g = <PieGraph {...props} />;
      break;
    default:
      g = <BaseGraph {...props} data={[]} uirevision={""} />;
  }
  return g;
}

function GraphPanelOptions(props: GraphPanelProps) {
  const graphFieldTypes = {
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
  if (props.graphConfig.type) {
    fieldOptions = props.graphFieldOptions.filter((field) =>
      graphFieldTypes[
        props.graphConfig.type as keyof typeof graphFieldTypes
      ].fields.includes(props.projectFields.get(field)?.type || "")
    );
    groupByOptions = props.graphFieldOptions.filter((field) =>
      graphFieldTypes[
        props.graphConfig.type as keyof typeof graphFieldTypes
      ].groupBy.includes(props.projectFields.get(field)?.type || "")
    );
  }

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Graph Type</Form.Label>
        <Dropdown
          isClearable
          options={["line", "bar", "pie"]}
          value={props.graphConfig.type}
          placeholder="Select graph type..."
          onChange={props.handleGraphConfigTypeChange}
        />
      </Form.Group>
      {props.graphConfig.type && (
        <Form.Group className="mb-3">
          <Form.Label>Field</Form.Label>
          <Dropdown
            isClearable
            options={fieldOptions}
            titles={props.fieldDescriptions}
            value={props.graphConfig.field}
            placeholder="Select field..."
            onChange={props.handleGraphConfigFieldChange}
          />
        </Form.Group>
      )}
      {(props.graphConfig.type === "line" ||
        props.graphConfig.type === "bar") && (
        <Form.Group className="mb-3">
          <Form.Label>Group By</Form.Label>
          <Dropdown
            isClearable
            options={groupByOptions}
            titles={props.fieldDescriptions}
            value={props.graphConfig.groupBy}
            placeholder="Select field..."
            onChange={props.handleGraphConfigGroupByChange}
          />
        </Form.Group>
      )}
      {props.graphConfig.type === "bar" && (
        <Form.Group className="mb-3">
          <Form.Label>Group Mode</Form.Label>
          <Dropdown
            options={["stack", "group", "norm"]}
            value={props.graphConfig.groupMode}
            onChange={props.handleGraphConfigGroupModeChange}
          />
        </Form.Group>
      )}
      {(props.graphConfig.type === "line" ||
        props.graphConfig.type === "bar") && (
        <Form.Group className="mb-3">
          <Form.Label>Axis Type</Form.Label>
          <Form.Check
            type="checkbox"
            label="Logarithmic Y Axis"
            onChange={props.handleGraphConfigYAxisTypeChange}
          />
        </Form.Group>
      )}
    </Form>
  );
}

function GraphPanel(props: GraphPanelProps) {
  const [showGraphOptions, setShowGraphOptions] = useState(true);

  const graphTitle = useMemo(() => {
    let title = "Empty Graph";

    if (props.graphConfig.field) {
      title = `Records by ${props.graphConfig.field}`;

      if (props.graphConfig.groupBy) {
        title += `, grouped by ${props.graphConfig.groupBy}`;
      }
    }

    return title;
  }, [props.graphConfig.field, props.graphConfig.groupBy]);

  return (
    <Card>
      <Card.Header>
        <span>{graphTitle}</span>
        <Stack direction="horizontal" gap={1} className="float-end">
          <Button
            size="sm"
            variant="dark"
            title={`${showGraphOptions ? "Hide" : "Show"} Graph Options`}
            onClick={() => setShowGraphOptions(!showGraphOptions)}
          >
            {showGraphOptions ? <MdSettings /> : <MdOutlineSettings />}
          </Button>
          <Button
            size="sm"
            variant="dark"
            disabled={props.firstGraph}
            title={
              props.viewMode === "list" ? "Move Graph Up" : "Move Graph Left"
            }
            onClick={props.handleGraphConfigSwapLeft}
          >
            {props.viewMode === "list" ? <MdArrowUpward /> : <MdArrowBack />}
          </Button>
          <Button
            size="sm"
            variant="dark"
            disabled={props.lastGraph}
            title={
              props.viewMode === "list" ? "Move Graph Down" : "Move Graph Right"
            }
            onClick={props.handleGraphConfigSwapRight}
          >
            {props.viewMode === "list" ? (
              <MdArrowDownward />
            ) : (
              <MdArrowForward />
            )}
          </Button>
          <Button
            size="sm"
            variant="dark"
            title="Remove Graph"
            onClick={props.handleGraphConfigRemove}
          >
            <MdClear />
          </Button>
        </Stack>
      </Card.Header>
      <Card.Body className="p-2">
        <Row className="g-2">
          {showGraphOptions && (
            <Col xl={12} xxl={props.viewMode === "list" ? 3 : 4}>
              <Card body style={{ height: "440px" }}>
                <GraphPanelOptions {...props} />
              </Card>
            </Col>
          )}
          <Col
            xl={12}
            xxl={showGraphOptions ? (props.viewMode === "list" ? 9 : 8) : 12}
          >
            <div style={{ height: "440px" }}>
              <GraphPanelGraph {...props} />
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
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
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "bar",
        field: "published_date",
        groupBy: "site",
        groupMode: "stack",
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "pie",
        field: "site",
        groupBy: "",
        groupMode: "",
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "line",
        field: "published_date",
        groupBy: "site",
        groupMode: "",
        yAxisType: "",
      },
    ] as GraphConfig[];

  const [viewMode, setViewMode] = useState("list");
  const [graphConfigList, setGraphConfigList] = useState(defaultGraphConfig());
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

  // Reset graphs when project changes
  useLayoutEffect(() => {
    setGraphConfigList(defaultGraphConfig());
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

  const handleGraphConfigYAxisTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].yAxisType = e.target.checked ? "log" : "";
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
        yAxisType: "",
      },
      ...graphConfigList.slice(index),
    ]);
  };

  const handleGraphConfigSwapLeft = (index: number) => {
    if (index > 0) {
      const list = [...graphConfigList];
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
      setGraphConfigList(list);
    }
  };

  const handleGraphConfigSwapRight = (index: number) => {
    if (index < graphConfigList.length - 1) {
      const list = [...graphConfigList];
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
      setGraphConfigList(list);
    }
  };

  const handleGraphConfigRemove = (index: number) => {
    const list = [...graphConfigList];
    list.splice(index, 1);
    setGraphConfigList(list);
  };

  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <span>Graphs</span>
          <Stack direction="horizontal" gap={1} className="float-end">
            <Button
              size="sm"
              variant="dark"
              title="Add Graph"
              onClick={() => handleGraphConfigAdd(0)}
            >
              <MdCreate />
            </Button>
            <BDropdown title="Change View Mode">
              <BDropdown.Toggle size="sm" variant="dark">
                {viewMode === "grid" ? (
                  <MdGridView />
                ) : (
                  <MdOutlineSplitscreen />
                )}
              </BDropdown.Toggle>
              <BDropdown.Menu>
                <BDropdown.Item key="list" onClick={() => setViewMode("list")}>
                  List View
                </BDropdown.Item>
                <BDropdown.Item key="grid" onClick={() => setViewMode("grid")}>
                  Grid View
                </BDropdown.Item>
              </BDropdown.Menu>
            </BDropdown>
          </Stack>
        </Card.Header>
        <Container fluid className="overflow-y-scroll p-2 h-100">
          <Row className="g-2">
            {graphConfigList.map((graphConfig, index) => (
              <Col key={graphConfig.key} lg={viewMode === "list" ? 12 : 6}>
                <GraphPanel
                  {...props}
                  graphConfig={graphConfig}
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
                  handleGraphConfigYAxisTypeChange={(e) =>
                    handleGraphConfigYAxisTypeChange(e, index)
                  }
                  handleGraphConfigSwapLeft={() =>
                    handleGraphConfigSwapLeft(index)
                  }
                  handleGraphConfigSwapRight={() =>
                    handleGraphConfigSwapRight(index)
                  }
                  handleGraphConfigRemove={() => handleGraphConfigRemove(index)}
                  viewMode={viewMode}
                  firstGraph={index === 0}
                  lastGraph={index === graphConfigList.length - 1}
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
