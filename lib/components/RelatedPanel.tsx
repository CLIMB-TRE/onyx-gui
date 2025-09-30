import { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  AnalysisIDCellRendererFactory,
  RecordIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "../components/CellRenderers";
import ErrorModal from "../components/ErrorModal";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { IDProps } from "../interfaces";
import { ErrorResponse, RecordType, ListResponse } from "../types";
import { s3BucketsMessage } from "../utils/messages";
import { useIDFields } from "../api/hooks";

interface RelatedPanelProps extends IDProps {
  queryHook: (
    props: IDProps
  ) => UseQueryResult<ListResponse<RecordType> | ErrorResponse, Error>;
  title: string;
  description: string;
  defaultFileNamePrefix: string;
}

function RelatedPanel(props: RelatedPanelProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);
  const { isFetching, error, data } = props.queryHook(props);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const errorModalProps = useMemo(
    () => ({
      ...props,
      handleErrorModalShow,
    }),
    [props, handleErrorModalShow]
  );

  // Get the objects
  const objects = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  const [recordIDField, analysisIDField] = useIDFields(props.fields);

  return (
    <QueryHandler isFetching={isFetching} error={error} data={data}>
      <>
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <h5>{props.title}</h5>
        <Table
          {...props}
          data={objects}
          defaultFileNamePrefix={props.defaultFileNamePrefix}
          footer={props.description}
          cellRenderers={
            new Map([
              [recordIDField, RecordIDCellRendererFactory(props)],
              [analysisIDField, AnalysisIDCellRendererFactory(props)],
              ["report", S3ReportCellRendererFactory(errorModalProps)],
            ])
          }
        />
      </>
    </QueryHandler>
  );
}

export default RelatedPanel;
