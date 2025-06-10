import { useMemo } from "react";
import { useHistoryQuery } from "../api";
import { ProjectProps } from "../interfaces";
import {
  ActionCellRenderer,
  ChangeCellRenderer,
  TimestampCellRenderer,
} from "./CellRenderers";
import QueryHandler from "./QueryHandler";
import Table from "./Table";

interface HistoryPanelProps extends ProjectProps {
  name?: string;
  searchPath: string;
  ID: string;
}

function HistoryPanel(props: HistoryPanelProps) {
  const { isFetching, error, data } = useHistoryQuery(props);

  // Get the history
  const history = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data?.history;
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error} data={data}>
      <>
        <h5>History</h5>
        <Table
          {...props}
          data={history}
          defaultFileNamePrefix={`${props.ID}_history`}
          flexOnly={["changes"]}
          tooltipFields={["timestamp"]}
          headerNames={
            new Map([
              ["username", "User"],
              ["timestamp", "Date"],
              ["action", "Action"],
              ["changes", "Changes"],
            ])
          }
          footer={`Table showing the complete change history for the ${
            props.name || "object"
          }.`}
          cellRenderers={
            new Map([
              ["timestamp", TimestampCellRenderer],
              ["action", ActionCellRenderer],
              ["changes", ChangeCellRenderer],
            ])
          }
        />
      </>
    </QueryHandler>
  );
}

export default HistoryPanel;
