import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";
import { ErrorResponse, SuccessResponse } from "../types";
import { useDelayedValue, useCyclicValue } from "../utils/hooks";

function LoadingText() {
  const ellipsisCount = useCyclicValue(0, 3);

  return (
    <span>
      Loading
      <pre style={{ display: "inline" }}>
        {".".repeat(ellipsisCount) + " ".repeat(3 - ellipsisCount)}
      </pre>
    </span>
  );
}

export function BaseSpinner({
  delay,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const showAlert = useDelayedValue(delay);

  return showAlert ? (
    <div className="h-100 d-flex justify-content-center align-items-center">
      <Stack direction="horizontal" gap={2}>
        <Spinner />
        {children}
      </Stack>
    </div>
  ) : (
    <></>
  );
}

function LoadingSpinner() {
  return (
    <BaseSpinner>
      <LoadingText />
    </BaseSpinner>
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

export function TextQueryHandler({
  isFetching,
  error,
  children,
}: {
  isFetching: boolean;
  error: Error | null;
  children: React.ReactNode;
}) {
  return isFetching ? (
    <LoadingText />
  ) : error ? (
    <span>Not Found</span>
  ) : (
    (children as JSX.Element)
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
