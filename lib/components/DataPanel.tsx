import { UseQueryResult } from "@tanstack/react-query";
import { JsonData } from "json-edit-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import { IDProps } from "../interfaces";
import {
  DataPanelTabKeys,
  DetailResponse,
  ErrorResponse,
  RecordType,
} from "../types";
import { handleJSONExport } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";
import DataField from "./DataField";
import Details from "./Details";
import ErrorModal from "./ErrorModal";
import ExportModal from "./ExportModal";
import JsonSearch from "./JsonSearch";
import QueryHandler from "./QueryHandler";
import Table from "./Table";
import { useFieldDescriptions } from "../api/hooks";

interface DataPanelProps extends IDProps {
  queryHook: (
    props: IDProps
  ) => UseQueryResult<DetailResponse<RecordType> | ErrorResponse, Error>;
  setUnpublished: () => void;
  dataFields: Map<string, string>;
}

function DataPanel(props: DataPanelProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);
  const { isFetching, error, data } = props.queryHook(props);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const formatTitle = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get the relations details
  const relations = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data)
      .filter(([key]) => props.fields.get(key)?.type === "relation")
      .sort(([key1], [key2]) => (key1 < key2 ? -1 : 1)) as [
      string,
      RecordType[]
    ][];
  }, [data, props.fields]);

  // Get the structure details
  const structures = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data).filter(
      ([key]) => props.fields.get(key)?.type === "structure"
    );
  }, [data, props.fields]);

  useEffect(() => {
    if (data?.status === "success" && data.data.is_published === false)
      props.setUnpublished();
  }, [data, props]);

  const jsonExportProps = useMemo(
    () => ({
      ...props,
      response: data,
    }),
    [props, data]
  );

  const fieldDescriptions = useFieldDescriptions(props.fields);

  return (
    <QueryHandler isFetching={isFetching} error={error} data={data}>
      <Tab.Container
        id="data-panel-tabs"
        activeKey={props.dataPanelTabKey}
        onSelect={(key) =>
          props.setDataPanelTabKey(key || DataPanelTabKeys.DETAILS)
        }
        transition={false}
      >
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <ExportModal
          show={exportModalShow}
          onHide={() => setExportModalShow(false)}
          defaultFileNamePrefix={props.ID}
          defaultFileExtension=".json"
          handleExport={handleJSONExport(jsonExportProps)}
        />
        <Row className="h-100">
          <Col xs={3} xl={2} className="h-100">
            <Stack gap={1}>
              <hr />
              {data?.status === "success" && (
                <Container>
                  {Array.from(props.dataFields).map(([field, name]) => (
                    <DataField
                      key={field}
                      name={name}
                      value={data.data[field]?.toString() || ""}
                    />
                  ))}
                </Container>
              )}
              <hr />
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey={DataPanelTabKeys.DETAILS}>
                    Details
                  </Nav.Link>
                </Nav.Item>
                {relations.map(([key]) => (
                  <Nav.Item key={key}>
                    <Nav.Link eventKey={`data-panel-${key}`}>
                      {formatTitle(key)}
                    </Nav.Link>
                  </Nav.Item>
                ))}
                {structures.map(([key]) => (
                  <Nav.Item key={key}>
                    <Nav.Link eventKey={`data-panel-${key}`}>
                      {formatTitle(key)}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              <hr />
              <Button
                size="sm"
                variant="dark"
                onClick={() => setExportModalShow(true)}
              >
                Export to JSON
              </Button>
            </Stack>
          </Col>
          <Col xs={9} xl={10} className="h-100">
            <Tab.Content className="h-100">
              <Tab.Pane eventKey={DataPanelTabKeys.DETAILS} className="h-100">
                <Details
                  {...props}
                  data={data}
                  handleErrorModalShow={handleErrorModalShow}
                />
              </Tab.Pane>
              {relations.map(([key, relation]) => (
                <Tab.Pane
                  key={key}
                  eventKey={`data-panel-${key}`}
                  className="h-100"
                >
                  <h5>{formatTitle(key)}</h5>
                  <Table
                    {...props}
                    data={relation}
                    defaultFileNamePrefix={`${props.ID}_${key}`}
                    headerTooltips={fieldDescriptions}
                    headerTooltipPrefix={key + "__"}
                    footer={
                      props.fields.get(key)?.description || "No Description."
                    }
                  />
                </Tab.Pane>
              ))}
              {structures.map(([key, structure]) => (
                <Tab.Pane
                  key={key}
                  eventKey={`data-panel-${key}`}
                  className="h-100"
                >
                  <h5>{formatTitle(key)}</h5>
                  <Card
                    body
                    className="overflow-y-auto h-100"
                    style={{ maxHeight: "100vh" }}
                  >
                    <JsonSearch
                      {...props}
                      data={structure as JsonData}
                      description={
                        props.fields.get(key)?.description || "No Description."
                      }
                    />
                  </Card>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </QueryHandler>
  );
}

export default DataPanel;
