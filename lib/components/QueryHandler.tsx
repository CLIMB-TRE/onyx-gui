import React, { useState, useEffect } from "react";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { SuccessResponse, ErrorResponse } from "../types";

function LoadingSpinner() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAlert(true), 500);
    return () => clearTimeout(timer);
  });

  return showAlert ? (
    <div className="d-flex justify-content-center">
      <Stack direction="horizontal" gap={2}>
        <Spinner />
        <span>Loading...</span>
      </Stack>
    </div>
  ) : (
    <></>
  );
}

interface ErrorMessagesProps {
  error: ErrorResponse;
}

function ErrorMessages(props: ErrorMessagesProps) {
  return (
    <>
      {Object.entries(props.error.messages).map(([key, value]) =>
        Array.isArray(value) ? (
          value.map((v: string) => (
            <Alert key={key} variant="danger">
              {key}: {v}
            </Alert>
          ))
        ) : (
          <Alert key={key} variant="danger">
            {key}: {value}
          </Alert>
        )
      )}
    </>
  );
}

function QueryHandler({
  isFetching,
  error,
  data,
  children,
}: {
  isFetching: boolean;
  error: Error | null;
  data: SuccessResponse | ErrorResponse;
  children: React.ReactNode;
}) {
  return isFetching ? (
    <LoadingSpinner />
  ) : error ? (
    <Alert variant="danger">Error: {error.message}</Alert>
  ) : data.status === "error" || data.status === "fail" ? (
    <ErrorMessages error={data} />
  ) : (
    (children as JSX.Element)
  );
}

export default QueryHandler;
