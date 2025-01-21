import { useMemo } from "react";
import { useHistoryQuery } from "../api";
import Table from "./Table";
import {
  TimestampCellRenderer,
  ActionCellRenderer,
  ChangeCellRenderer,
} from "./CellRenderers";
import QueryHandler from "./QueryHandler";
import { RecordType } from "../types";
import { PageProps } from "../interfaces";

interface HistoryProps extends PageProps {
  name?: string;
  searchPath: string;
  ID: string;
  show: boolean;
  onHide: () => void;
}

function History(props: HistoryProps) {
  const { isFetching, error, data } = useHistoryQuery(props);

  // Get the history
  const history = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data?.history as RecordType[];
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
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

export default History;
