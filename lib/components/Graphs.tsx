import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { Template, AxisType } from "plotly.js-basic-dist";
import { ProjectField, RecordType, GraphConfig } from "../types";
import { StatsProps } from "../interfaces";
import graphStyles from "../utils/graphStyles";

// Create Plotly component using basic plotly distribution
const Plot = createPlotlyComponent(Plotly);

interface BaseGraphProps {
  data: Plotly.Data[];
  title?: string;
  xTitle?: string;
  yTitle?: string;
  yAxisType?: string;
  legendTitle?: string;
  layout?: Record<string, unknown>;
  darkMode: boolean;
  uirevision: string;
}

interface GraphProps extends StatsProps {
  graphConfig: GraphConfig;
}

const useSummaryQuery = (props: GraphProps) => {
  return useQuery({
    queryKey: ["summary", props.project, props.graphConfig.field],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/?summarise=${props.graphConfig.field}`
        )
        .then((response) => response.json())
        .then((data) => {
          const field_data = data.data.map((record: RecordType) => {
            // Convert null field value to empty string
            let field_value = record[props.graphConfig.field];
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
    staleTime: 1 * 60 * 1000,
  });
};

const useGroupedSummaryQuery = (props: GraphProps) => {
  return useQuery({
    queryKey: [
      "summary",
      props.project,
      props.graphConfig.field,
      props.graphConfig.groupBy,
    ],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/?summarise=${props.graphConfig.field}&summarise=${props.graphConfig.groupBy}`
        )
        .then((response) => response.json())
        .then((data) => {
          const groupedData = new Map<
            string,
            { field_data: string[]; count_data: number[] }
          >();

          data.data.forEach((record: RecordType) => {
            // Convert null field value to empty string
            let field_value = record[props.graphConfig.field];
            if (field_value === null) {
              field_value = "";
            } else {
              field_value = field_value.toString();
            }

            // Convert null group-by value to empty string
            let group_by_value = record[props.graphConfig.groupBy];
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
    staleTime: 1 * 60 * 1000,
  });
};

function getNullCount(
  projectFields: Map<string, ProjectField>,
  field: string,
  data: { field_data: string[]; count_data: number[] }
) {
  let title = "";

  if (projectFields.get(field)?.type === "date") {
    const nullCount = data.count_data[data.field_data.indexOf("")] || 0;

    if (nullCount) {
      title += `Excluding ${nullCount} records with no ${field}.`;
    }
  }

  return title;
}

function getGroupedNullCount(
  projectFields: Map<string, ProjectField>,
  field: string,
  data: Map<string, { field_data: string[]; count_data: number[] }>
) {
  let title = "";

  if (projectFields.get(field)?.type === "date") {
    let nullCount = 0;

    data.forEach(({ field_data, count_data }) => {
      nullCount += count_data[field_data.indexOf("")] || 0;
    });

    if (nullCount) {
      title += `Excluding ${nullCount} records with no ${field}.`;
    }
  }

  return title;
}

function BaseGraph(props: BaseGraphProps) {
  return (
    <Plot
      data={props.data}
      layout={{
        ...props.layout,
        autosize: true,
        title: props.title,
        titlefont: { size: 14, color: "grey" },

        margin: {
          l: 60,
          r: 60,
          b: 60,
          t: 60,
          pad: 4,
        },
        template: props.darkMode ? (graphStyles as Template) : undefined,
        xaxis: { title: props.xTitle },
        yaxis: {
          title: props.yTitle,
          type: (props.yAxisType ? props.yAxisType : "linear") as AxisType,
        },
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
        uirevision: props.uirevision,
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
      config={{
        modeBarButtonsToRemove: [
          "toImage",
          "lasso2d",
          "select2d",
          "sendDataToCloud",
        ],
      }}
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
        },
      ]}
      title={getNullCount(props.projectFields, props.graphConfig.field, data)}
      xTitle={props.graphConfig.field}
      yTitle="count"
      yAxisType={props.graphConfig.yAxisType}
      uirevision={props.graphConfig.field}
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

  let layout: Record<string, string> = {};
  let yTitle = "count";

  if (props.graphConfig.groupMode === "stack") {
    layout = { barmode: "stack" };
  } else if (props.graphConfig.groupMode === "group") {
    layout = { barmode: "group" };
  } else if (props.graphConfig.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

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
      title={getNullCount(props.projectFields, props.graphConfig.field, data)}
      xTitle={props.graphConfig.field}
      yTitle={yTitle}
      yAxisType={props.graphConfig.yAxisType}
      layout={layout}
      uirevision={props.graphConfig.field}
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
      title={getNullCount(props.projectFields, props.graphConfig.field, data)}
      legendTitle={props.graphConfig.field}
      uirevision={props.graphConfig.field}
    />
  );
}

function GroupedScatterGraph(props: GraphProps) {
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
      title={getGroupedNullCount(
        props.projectFields,
        props.graphConfig.field,
        data
      )}
      xTitle={props.graphConfig.field}
      yTitle="count"
      yAxisType={props.graphConfig.yAxisType}
      legendTitle={props.graphConfig.groupBy}
      uirevision={`${props.graphConfig.field}-${props.graphConfig.groupBy}`}
    />
  );
}

function GroupedBarGraph(props: GraphProps) {
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

  if (props.graphConfig.groupMode === "stack") {
    layout = { barmode: "stack" };
  } else if (props.graphConfig.groupMode === "group") {
    layout = { barmode: "group" };
  } else if (props.graphConfig.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

  return (
    <BaseGraph
      {...props}
      data={graphData}
      title={getGroupedNullCount(
        props.projectFields,
        props.graphConfig.field,
        data
      )}
      xTitle={props.graphConfig.field}
      yTitle={yTitle}
      yAxisType={props.graphConfig.yAxisType}
      legendTitle={props.graphConfig.groupBy}
      layout={layout}
      uirevision={`${props.graphConfig.field}-${props.graphConfig.groupBy}`}
    />
  );
}

export {
  BaseGraph,
  ScatterGraph,
  BarGraph,
  PieGraph,
  GroupedScatterGraph,
  GroupedBarGraph,
};
