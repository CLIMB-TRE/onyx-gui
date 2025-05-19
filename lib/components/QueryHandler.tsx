import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";
import { ErrorResponse, SuccessResponse } from "../types";
import { useDelayedValue } from "../utils/hooks";

function LoadingSpinner() {
  const showAlert = useDelayedValue();

  return showAlert ? (
    <div className="h-100 d-flex justify-content-center align-items-center">
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
              <span className="fw-bold">{key}:</span> {v}
            </Alert>
          ))
        ) : (
          <Alert key={key} variant="danger">
            {value}
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
