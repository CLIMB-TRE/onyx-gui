import Stack from "react-bootstrap/Stack";
import Alert from "react-bootstrap/Alert";
import { Spinner } from "react-bootstrap";

function LoadingAlert() {
  return (
    <Alert variant="light">
      <Stack direction="horizontal" gap={2}>
        <Spinner />
        <span>Loading...</span>
      </Stack>
    </Alert>
  );
}

export default LoadingAlert;
