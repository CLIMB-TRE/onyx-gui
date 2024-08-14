import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Pagination from "react-bootstrap/Pagination";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { ServerTable } from "./Table";
import { LoadingAlert } from "./LoadingAlert";
import ErrorMessages from "./ErrorMessages";
import { ResultType, ErrorType } from "../types";
import { DataProps } from "../interfaces";

interface ResultsPanelProps extends DataProps {
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  setSearchParameters: (params: string) => void;
  pageNumber: number;
  setPageNumber: (page: number) => void;
  handleRecordDetailShow: (climbID: string) => void;
}

type ResultData = {
  next?: string;
  previous?: string;
  data?: ResultType[];
  messages?: ErrorType;
};

function ResultsPanel(props: ResultsPanelProps) {
  const fileName = `${props.project}${
    props.pageNumber > 1 ? "_" + props.pageNumber.toString() : ""
  }`;

  const csvConfig = mkConfig({
    filename: fileName,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csvData = asString(
      generateCsv(csvConfig)(props.resultData.data || [])
    );

    if (props.fileWriter) {
      props.fileWriter(fileName + ".csv", csvData);
    }
  };

  const [defaultSort, setDefaultSort] = useState({
    sortKey: "",
    direction: "",
  });

  return (
    <Card>
      <Card.Header>
        <span>Results</span>
        <Button
          className="float-end"
          size="sm"
          disabled={!props.fileWriter}
          variant="success"
          onClick={handleExportToCSV}
        >
          Export Page to CSV
        </Button>
      </Card.Header>
      <Container fluid className="onyx-results-panel-body p-2">
        {props.resultPending ? (
          <LoadingAlert />
        ) : props.resultError ? (
          <Alert variant="danger">Error: {props.resultError.message}</Alert>
        ) : props.resultData.messages ? (
          <ErrorMessages messages={props.resultData.messages} />
        ) : (
          <ServerTable
            data={props.resultData.data || []}
            titles={props.fieldDescriptions}
            handleRecordDetailShow={props.handleRecordDetailShow}
            s3PathHandler={props.s3PathHandler}
            // isSortable={!props.resultData?.next && !props.resultData?.previous}
            isFilterable={
              !props.resultData?.next && !props.resultData?.previous
            }
            handleColumnSort={(event: {
              columns: { colId: string; sort: string }[];
            }) => {
              const field = event.columns[event.columns.length - 1].colId;
              const direction = event.columns[event.columns.length - 1].sort;

              if (direction === "asc") {
                props.setSearchParameters(`order=${field}`);
              } else if (direction === "desc") {
                props.setSearchParameters(`order=-${field}`);
              } else {
                props.setSearchParameters("");
              }
              setDefaultSort({
                sortKey: field,
                direction: direction,
              });
            }}
            defaultSort={defaultSort}
          />
        )}
      </Container>
      <Card.Footer>
        <Pagination size="sm">
          <Pagination.Prev
            disabled={!props.resultData.previous}
            onClick={() => {
              props.setSearchParameters(
                props.resultData.previous?.split("?", 2)[1] || ""
              );
              props.setPageNumber(props.pageNumber - 1);
            }}
          />
          <Pagination.Item>
            {props.resultPending
              ? "Loading..."
              : `Showing ${props.resultData.data?.length || 0} results (Page ${
                  props.pageNumber
                })`}
          </Pagination.Item>
          <Pagination.Next
            disabled={!props.resultData.next}
            onClick={() => {
              props.setSearchParameters(
                props.resultData?.next?.split("?", 2)[1] || ""
              );
              props.setPageNumber(props.pageNumber + 1);
            }}
          />
        </Pagination>
      </Card.Footer>
    </Card>
  );
}

export default ResultsPanel;
