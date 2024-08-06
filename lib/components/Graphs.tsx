import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { Template } from "plotly.js-basic-dist";
import { ProjectField, ResultType } from "../types";
import { StatsProps } from "../interfaces";
import graphStyles from "../utils/graphStyles";

// Create Plotly component using basic plotly distribution
const Plot = createPlotlyComponent(Plotly);

interface BaseGraphProps {
  data: Plotly.Data[];
  title: string;
  xTitle?: string;
  yTitle?: string;
  legendTitle?: string;
  layout?: Record<string, unknown>;
  darkMode: boolean;
  uirevision: number;
}

interface GraphProps extends StatsProps {
  field: string;
}

interface GroupedGraphProps extends GraphProps {
  groupBy: string;
  groupMode?: string;
}

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
    staleTime: 1 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
  });
};

const useUIRevision = (field: string) => {
  const [uirevision, setUIRevision] = useState(0);

  useEffect(
    () => {
      setUIRevision((uirevision + 1) % 2);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field]
  );

  return uirevision;
};

const useGroupedUIRevision = (field: string, groupBy: string) => {
  const [uirevision, setUIRevision] = useState(0);

  useEffect(
    () => {
      setUIRevision((uirevision + 1) % 2);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field, groupBy]
  );

  return uirevision;
};

function getTitle(
  projectFields: Map<string, ProjectField>,
  field: string,
  data: { field_data: string[]; count_data: number[] }
) {
  let title = `Records by ${field}`;

  if (projectFields.get(field)?.type === "date") {
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

  if (projectFields.get(field)?.type === "date") {
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
        uirevision: props.uirevision,
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function ScatterGraph(props: GraphProps) {
  const uirevision = useUIRevision(props.field);

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
      uirevision={uirevision}
    />
  );
}

function BarGraph(props: GraphProps) {
  const uirevision = useUIRevision(props.field);

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
      uirevision={uirevision}
    />
  );
}

function PieGraph(props: GraphProps) {
  const uirevision = useUIRevision(props.field);

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
      uirevision={uirevision}
    />
  );
}

function GroupedScatterGraph(props: GroupedGraphProps) {
  const uirevision = useGroupedUIRevision(props.field, props.groupBy);

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
      uirevision={uirevision}
    />
  );
}

function GroupedBarGraph(props: GroupedGraphProps) {
  const uirevision = useGroupedUIRevision(props.field, props.groupBy);

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
      uirevision={uirevision}
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