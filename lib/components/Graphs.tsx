import { useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { Template, AxisType } from "plotly.js-basic-dist";
import {
  ProjectField,
  SummaryType,
  GraphConfig,
  SuccessResponse,
  ErrorResponse,
} from "../types";
import { DataProps } from "../interfaces";
import graphStyles from "../utils/graphStyles";
import QueryHandler from "./QueryHandler";
import { useQueryRefresh } from "../utils/hooks";
import { useSummaryQuery, useGroupedSummaryQuery } from "../api";

// Create Plotly component using basic plotly distribution
const Plot = createPlotlyComponent(Plotly);

interface BasePlotProps {
  plotData: Plotly.Data[];
  title?: string;
  xTitle?: string;
  yTitle?: string;
  yAxisType?: string;
  legendTitle?: string;
  layout?: Record<string, unknown>;
  darkMode: boolean;
  uirevision: string;
}

interface BaseGraphProps extends BasePlotProps {
  isFetching: boolean;
  error: Error;
  data: SuccessResponse | ErrorResponse;
}

interface GraphProps extends DataProps {
  graphConfig: GraphConfig;
  refresh: number;
  setLastUpdated: (lastUpdated: string | null) => void;
}

/** Get string value of a summary field. Converts null values to the empty string */
function getStringValue(summary: SummaryType, field: string): string {
  const value = summary[field];
  return value === null ? "" : value.toString();
}

const useSummaryData = (props: GraphProps) => {
  const { isFetching, error, data, refetch, dataUpdatedAt, errorUpdatedAt } =
    useSummaryQuery(props);

  const plotData = useMemo(() => {
    if (data?.status !== "success" || !data.data.length)
      return {
        field_data: [],
        count_data: [],
      };

    let count_field = "";
    for (const key in data.data[0]) {
      if (key === "count" || key.endsWith("__count")) {
        count_field = key;
        break;
      }
    }

    if (!count_field)
      return {
        field_data: [],
        count_data: [],
      };

    // Convert null field value to empty string
    const field_data = data.data.map((summary: SummaryType) =>
      getStringValue(summary, props.graphConfig.field)
    );
    // Get count values
    const count_data = data.data.map(
      (summary: SummaryType) => summary[count_field] as number
    );
    return { field_data, count_data };
  }, [data, props.graphConfig.field]);

  useQueryRefresh(
    props.refresh,
    dataUpdatedAt,
    errorUpdatedAt,
    refetch,
    props.setLastUpdated
  );

  return { isFetching, error, data, plotData };
};

const useGroupedDataQuery = (props: GraphProps) => {
  const { isFetching, error, data, refetch, dataUpdatedAt, errorUpdatedAt } =
    useGroupedSummaryQuery(props);

  const plotData = useMemo(() => {
    const groupedData = new Map<
      string,
      { field_data: string[]; count_data: number[] }
    >();

    if (data?.status !== "success" || !data.data.length) return groupedData;

    let count_field = "";
    for (const key in data.data[0]) {
      if (key === "count" || key.endsWith("__count")) {
        count_field = key;
        break;
      }
    }

    if (!count_field) return groupedData;

    data.data.forEach((summary: SummaryType) => {
      // Convert null field and group values to empty strings
      const field_value = getStringValue(summary, props.graphConfig.field);
      const group_by_value = getStringValue(summary, props.graphConfig.groupBy);

      // Add field value and count to grouped data
      const groupedValue = groupedData.get(group_by_value);
      if (!groupedValue) {
        groupedData.set(group_by_value, {
          field_data: [field_value],
          count_data: [summary[count_field] as number],
        });
        return;
      } else {
        groupedValue.field_data.push(field_value);
        groupedValue.count_data.push(summary[count_field] as number);
      }
    });

    return groupedData;
  }, [data, props.graphConfig.field, props.graphConfig.groupBy]);

  useQueryRefresh(
    props.refresh,
    dataUpdatedAt,
    errorUpdatedAt,
    refetch,
    props.setLastUpdated
  );

  return { isFetching, error, data, plotData };
};

function getNullCount(
  projectFields: Map<string, ProjectField>,
  field: string,
  data: { field_data: string[]; count_data: number[] }
) {
  let title = "";

  if (projectFields.get(field)?.type === "date") {
    const nullCount = data.count_data[data.field_data.indexOf("")] || 0;

    const recordText = nullCount === 1 ? "record" : "records";

    if (nullCount)
      title += `Excluding ${nullCount} ${recordText} with no ${field}.`;
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

    const recordText = nullCount === 1 ? "record" : "records";

    if (nullCount)
      title += `Excluding ${nullCount} ${recordText} with no ${field}.`;
  }

  return title;
}

function BasePlot(props: BasePlotProps) {
  return (
    <Plot
      data={props.plotData}
      layout={{
        ...props.layout,
        autosize: true,
        title: props.title,
        titlefont: { size: 14, color: "#6c757d" },
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

function BaseGraph(props: BaseGraphProps) {
  return (
    <QueryHandler
      isFetching={props.isFetching}
      error={props.error}
      data={props.data}
    >
      <BasePlot {...props} />
    </QueryHandler>
  );
}

function ScatterGraph(props: GraphProps) {
  const { isFetching, error, data, plotData } = useSummaryData(props);

  return (
    <BaseGraph
      {...props}
      isFetching={isFetching}
      error={error as Error}
      data={data}
      plotData={[
        {
          x: plotData.field_data,
          y: plotData.count_data,
          type: "scatter",
          mode: "lines+markers",
        },
      ]}
      title={getNullCount(
        props.projectFields,
        props.graphConfig.field,
        plotData
      )}
      xTitle={props.graphConfig.field}
      yTitle="count"
      yAxisType={props.graphConfig.yAxisType}
      uirevision={props.graphConfig.field}
    />
  );
}

function BarGraph(props: GraphProps) {
  const { isFetching, error, data, plotData } = useSummaryData(props);

  let layout: Record<string, string> = {};
  let yTitle = "count";

  if (props.graphConfig.groupMode === "stack") layout = { barmode: "stack" };
  else if (props.graphConfig.groupMode === "group")
    layout = { barmode: "group" };
  else if (props.graphConfig.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

  return (
    <BaseGraph
      {...props}
      isFetching={isFetching}
      error={error as Error}
      data={data}
      plotData={[
        {
          x: plotData.field_data,
          y: plotData.count_data,
          type: "bar",
        },
      ]}
      title={getNullCount(
        props.projectFields,
        props.graphConfig.field,
        plotData
      )}
      xTitle={props.graphConfig.field}
      yTitle={yTitle}
      yAxisType={props.graphConfig.yAxisType}
      layout={layout}
      uirevision={props.graphConfig.field}
    />
  );
}

function PieGraph(props: GraphProps) {
  const { isFetching, error, data, plotData } = useSummaryData(props);

  return (
    <BaseGraph
      {...props}
      isFetching={isFetching}
      error={error as Error}
      data={data}
      plotData={[
        {
          labels: plotData.field_data,
          values: plotData.count_data,
          type: "pie",
          marker: { color: "#198754" },
        },
      ]}
      title={getNullCount(
        props.projectFields,
        props.graphConfig.field,
        plotData
      )}
      legendTitle={props.graphConfig.field}
      uirevision={props.graphConfig.field}
    />
  );
}

function GroupedScatterGraph(props: GraphProps) {
  const { isFetching, error, data, plotData } = useGroupedDataQuery(props);

  const scatterData = useMemo(
    () =>
      Array.from(plotData.entries()).map(
        ([group, { field_data, count_data }]) => ({
          x: field_data,
          y: count_data,
          name: group,
          type: "scatter",
          mode: "lines+markers",
        })
      ) as Plotly.Data[],
    [plotData]
  );

  return (
    <BaseGraph
      {...props}
      isFetching={isFetching}
      error={error as Error}
      data={data}
      plotData={scatterData}
      title={getGroupedNullCount(
        props.projectFields,
        props.graphConfig.field,
        plotData
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
  const { isFetching, error, data, plotData } = useGroupedDataQuery(props);

  const barData = useMemo(
    () =>
      Array.from(plotData.entries()).map(
        ([group, { field_data, count_data }]) => ({
          x: field_data,
          y: count_data,
          name: group,
          type: "bar",
        })
      ) as Plotly.Data[],
    [plotData]
  );

  let layout: Record<string, string> = {};
  let yTitle = "count";

  if (props.graphConfig.groupMode === "stack") layout = { barmode: "stack" };
  else if (props.graphConfig.groupMode === "group")
    layout = { barmode: "group" };
  else if (props.graphConfig.groupMode === "norm") {
    layout = { barmode: "stack", barnorm: "percent" };
    yTitle = "percentage";
  }

  return (
    <BaseGraph
      {...props}
      isFetching={isFetching}
      error={error as Error}
      data={data}
      plotData={barData}
      title={getGroupedNullCount(
        props.projectFields,
        props.graphConfig.field,
        plotData
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
  BasePlot,
  ScatterGraph,
  BarGraph,
  PieGraph,
  GroupedScatterGraph,
  GroupedBarGraph,
};
