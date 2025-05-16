import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdClear,
  MdCreate,
  MdDelete,
  MdGridView,
  MdOutlineSplitscreen,
  MdRefresh,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { Dropdown } from "../components/Dropdowns";
import FilterPanel from "../components/FilterPanel";
import {
  BarGraph,
  BasePlot,
  GroupedBarGraph,
  GroupedScatterGraph,
  PieGraph,
  ScatterGraph,
} from "../components/Graphs";
import PageTitle from "../components/PageTitle";
import { DataProps } from "../interfaces";
import {
  FilterConfig,
  GraphConfig,
  GraphType,
  GraphPanelTabKeys,
} from "../types";
import { generateKey } from "../utils/functions";
import RemoveAllModal from "../components/RemoveAllModal";

interface GraphPanelProps extends DataProps {
  graphConfig: GraphConfig;
  graphFieldOptions: string[];
  handleGraphConfigTypeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupByChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigGroupModeChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleGraphConfigFiltersChange: (filters: FilterConfig[]) => void;
  handleGraphConfigYAxisTypeChange: React.ChangeEventHandler<HTMLInputElement>;
  handleGraphConfigSwapLeft: () => void;
  handleGraphConfigSwapRight: () => void;
  handleGraphConfigRemove: () => void;
  viewMode: string;
  showOptions: boolean;
  firstGraph: boolean;
  lastGraph: boolean;
  refresh: number | null;
}

interface GraphPanelGraphProps extends GraphPanelProps {
  setLastUpdated: (lastUpdated: string | null) => void;
}

function GraphPanelTitle(props: GraphPanelProps) {
  const textTitle = useMemo(() => {
    let title = "Empty Graph";

    if (props.graphConfig.field) {
      title = `Records by ${props.graphConfig.field}`;

      if (props.graphConfig.groupBy)
        title += `, grouped by ${props.graphConfig.groupBy}`;

      if (props.graphConfig.filters.length > 0) {
        props.graphConfig.filters
          .filter((filter) => filter.field)
          .forEach((filter) => {
            title += `, filtered by ${filter.field}: '${filter.value}'`;
          });
      }
    }

    return title;
  }, [
    props.graphConfig.field,
    props.graphConfig.groupBy,
    props.graphConfig.filters,
  ]);

  return (
    <span className="me-auto text-truncate" title={textTitle}>
      {props.graphConfig.field ? (
        <span>
          Records by {props.graphConfig.field}
          {props.graphConfig.groupBy &&
            `, grouped by ${props.graphConfig.groupBy}`}
          {props.graphConfig.filters.length > 0 &&
            props.graphConfig.filters
              .filter((filter) => filter.field)
              .map((filter) => (
                <span>
                  , filtered by {filter.field}:{" "}
                  <span className="onyx-text-pink font-monospace">
                    {filter.value}
                  </span>
                </span>
              ))}
        </span>
      ) : (
        textTitle
      )}
    </span>
  );
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

  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(
      ([, projectField]) =>
        (props.typeLookups.get(projectField.type) || []).includes("exact") &&
        projectField.actions.includes("filter")
    )
    .map(([field]) => field);

  return (
    <Tabs
      defaultActiveKey={GraphPanelTabKeys.GRAPH}
      id="uncontrolled-tab-example"
      className="mb-3"
      justify
      transition={false}
    >
      <Tab eventKey={GraphPanelTabKeys.GRAPH} title="Graph">
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
        </Form>
      </Tab>
      <Tab eventKey={GraphPanelTabKeys.FILTERS} title="Filters">
        {props.graphConfig.type && (
          <FilterPanel
            {...props}
            filterList={props.graphConfig.filters}
            setFilterList={props.handleGraphConfigFiltersChange}
            filterFieldOptions={filterFieldOptions}
            disableLookups
          />
        )}
      </Tab>
      <Tab eventKey={GraphPanelTabKeys.DISPLAY} title="Display">
        {(props.graphConfig.type === "line" ||
          props.graphConfig.type === "bar") && (
          <Form.Group className="mb-3">
            <Form.Label>Y Axis</Form.Label>
            <Form.Check
              type="checkbox"
              label="Logarithmic"
              onChange={props.handleGraphConfigYAxisTypeChange}
            />
          </Form.Group>
        )}
      </Tab>
    </Tabs>
  );
}

function GraphPanelGraph(props: GraphPanelGraphProps) {
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
      g = <BasePlot {...props} plotData={[]} uirevision={""} />;
  }
  return g;
}

function GraphPanel(props: GraphPanelProps) {
  const [lastUpdated, setLastUpdated] = useState<null | string>(null);

  return (
    <Card>
      <Card.Header>
        <Stack direction="horizontal" gap={1}>
          <GraphPanelTitle {...props} />
          {lastUpdated && (
            <span
              className="text-secondary text-truncate px-2"
              title={`Last updated: ${lastUpdated}`}
            >
              Last updated: {lastUpdated}
            </span>
          )}
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
          {props.showOptions && (
            <Col xl={12} xxl={props.viewMode === "list" ? 3 : 4}>
              <Card body style={{ height: "440px" }} className="h-100">
                <GraphPanelOptions {...props} />
              </Card>
            </Col>
          )}
          <Col
            xl={12}
            xxl={props.showOptions ? (props.viewMode === "list" ? 9 : 8) : 12}
          >
            <div style={{ height: "440px" }}>
              <GraphPanelGraph {...props} setLastUpdated={setLastUpdated} />
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function Graphs(props: DataProps) {
  const defaultGraphConfig = () =>
    [
      {
        key: generateKey(),
        type: "bar",
        field: "published_date",
        groupBy: "",
        groupMode: "stack",
        filters: [],
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "bar",
        field: "published_date",
        groupBy: "site",
        groupMode: "stack",
        filters: [],
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "pie",
        field: "site",
        groupBy: "",
        groupMode: "",
        filters: [],
        yAxisType: "",
      },
      {
        key: generateKey(),
        type: "line",
        field: "published_date",
        groupBy: "site",
        groupMode: "",
        filters: [],
        yAxisType: "",
      },
    ] as GraphConfig[];

  const [graphConfigList, setGraphConfigList] = useState(defaultGraphConfig());
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showOptions, setShowOptions] = useState(true);
  const [refresh, setRefresh] = useState<number | null>(null);
  const [removeAllModalShow, setRemoveAllModalShow] = useState(false);

  const handleRefresh = () => {
    setRefresh(refresh ? 0 : 1);
  };

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

    list[index].type = e.target.value as GraphType;
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

  const handleGraphConfigFiltersChange = (
    filters: FilterConfig[],
    index: number
  ) => {
    const list = [...graphConfigList];
    list[index].filters = filters;
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
        filters: [],
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

  const handleGraphConfigRemoveAll = () => setGraphConfigList([]);

  return (
    <Container fluid className="g-0 h-100">
      <RemoveAllModal
        show={removeAllModalShow}
        onHide={() => setRemoveAllModalShow(false)}
        item="Graphs"
        handleRemove={handleGraphConfigRemoveAll}
      />
      <Card className="h-100 overflow-y-auto">
        <Card.Header>
          <Stack direction="horizontal" gap={1}>
            <span className="me-auto">
              <PageTitle {...props} title="Graphs" />
            </span>
            <Button
              size="sm"
              variant="dark"
              title="Add Graph"
              onClick={() => handleGraphConfigAdd(0)}
            >
              <MdCreate />
            </Button>
            <Button
              size="sm"
              variant="dark"
              title="Refresh Graphs"
              onClick={handleRefresh}
            >
              <MdRefresh />
            </Button>
            <Button
              size="sm"
              variant="dark"
              title="Remove All Graphs"
              onClick={() => setRemoveAllModalShow(true)}
            >
              <MdDelete />
            </Button>
            <Button
              size="sm"
              variant="dark"
              title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
              onClick={() =>
                viewMode === "grid" ? setViewMode("list") : setViewMode("grid")
              }
            >
              {viewMode === "grid" ? <MdGridView /> : <MdOutlineSplitscreen />}
            </Button>
            <Button
              size="sm"
              variant="dark"
              title={`${showOptions ? "Hide" : "Show"} Graph Options`}
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? <MdVisibility /> : <MdVisibilityOff />}
            </Button>
          </Stack>
        </Card.Header>
        <Card.Body className="h-100 p-2 overflow-y-auto">
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
                  handleGraphConfigFiltersChange={(e) =>
                    handleGraphConfigFiltersChange(e, index)
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
                  showOptions={showOptions}
                  firstGraph={index === 0}
                  lastGraph={index === graphConfigList.length - 1}
                  refresh={refresh}
                />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Graphs;
