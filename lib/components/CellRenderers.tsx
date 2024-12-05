import { CustomCellRendererProps } from "@ag-grid-community/react";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { OnyxProps } from "../interfaces";
import { RecordType } from "../types";

interface ErrorModalProps extends OnyxProps {
  handleErrorModalShow: (error: Error) => void;
}

interface IDModalProps {
  handleRecordModalShow: (recordID: string) => void;
  handleAnalysisModalShow: (analysisID: string) => void;
}

function DetailCellRendererFactory(props: ErrorModalProps) {
  return (cellRendererProps: CustomCellRendererProps) => {
    if (
      typeof cellRendererProps.value === "string" &&
      cellRendererProps.value.startsWith("s3://") &&
      cellRendererProps.value.endsWith(".html")
    ) {
      return (
        <Button
          className="p-0"
          size="sm"
          variant="link"
          onClick={() =>
            props
              .s3PathHandler(cellRendererProps.value)
              .catch((error: Error) => props.handleErrorModalShow(error))
          }
        >
          {cellRendererProps.value}
        </Button>
      );
    } else {
      return cellRendererProps.value;
    }
  };
}

function ClimbIDCellRendererFactory(props: IDModalProps) {
  return (cellRendererProps: CustomCellRendererProps) => {
    return (
      <Button
        className="p-0"
        size="sm"
        variant="link"
        onClick={() => props.handleRecordModalShow(cellRendererProps.value)}
      >
        {cellRendererProps.value}
      </Button>
    );
  };
}

function AnalysisIDCellRendererFactory(props: IDModalProps) {
  return (cellRendererProps: CustomCellRendererProps) => {
    return (
      <Button
        className="p-0"
        size="sm"
        variant="link"
        onClick={() => props.handleAnalysisModalShow(cellRendererProps.value)}
      >
        {cellRendererProps.value}
      </Button>
    );
  };
}

function S3ReportCellRendererFactory(props: ErrorModalProps) {
  return (cellRendererProps: CustomCellRendererProps) => {
    return (
      <Button
        className="p-0"
        size="sm"
        variant="link"
        onClick={() =>
          props
            .s3PathHandler(cellRendererProps.value)
            .catch((error: Error) => props.handleErrorModalShow(error))
        }
      >
        {cellRendererProps.value}
      </Button>
    );
  };
}

function TimestampCellRenderer(props: CustomCellRendererProps) {
  const date = new Date(props.value.toString());
  return <span>{date.toDateString()}</span>;
}

function ActionCellRenderer(props: CustomCellRendererProps) {
  const action = props.value.toString().toLowerCase();

  // Change text colour based on action type
  if (action === "add") {
    return <Badge bg="dark">{action}</Badge>;
  } else if (action === "change") {
    return (
      <Badge bg="info" className="text-dark">
        {action}
      </Badge>
    );
  } else if (action === "delete") {
    return <Badge bg="danger">{action}</Badge>;
  } else {
    return <Badge bg="secondary">{action}</Badge>;
  }
}

function ChangeCellRenderer(props: CustomCellRendererProps) {
  const changes = JSON.parse(props.value);

  return (
    <ul>
      {changes.map((change: RecordType, index: number) => {
        if (change.type === "relation") {
          let verb: string;
          if (change.action === "add") {
            verb = "Added";
          } else if (change.action === "change") {
            verb = "Changed";
          } else if (change.action === "delete") {
            verb = "Deleted";
          } else {
            verb = "Modified";
          }
          return (
            <li key={index}>
              <strong>{change.field?.toString()}</strong>: {verb}{" "}
              <span className="onyx-text-pink">{change.count?.toString()}</span>{" "}
              record{change.count === 1 ? "" : "s"}.
            </li>
          );
        } else {
          return (
            <li key={index}>
              <strong>{change.field?.toString()}</strong>:{" "}
              <span className="onyx-text-pink">
                {JSON.stringify(change.from)}
              </span>{" "}
              &rarr;{" "}
              <span className="onyx-text-pink">
                {JSON.stringify(change.to)}
              </span>
            </li>
          );
        }
      })}
    </ul>
  );
}

export {
  DetailCellRendererFactory,
  ClimbIDCellRendererFactory,
  AnalysisIDCellRendererFactory,
  S3ReportCellRendererFactory,
  TimestampCellRenderer,
  ActionCellRenderer,
  ChangeCellRenderer,
};
