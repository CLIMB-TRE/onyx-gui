import { useState, useEffect } from "react";
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

function DelayedLoadingAlert() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAlert(true), 200);
    return () => clearTimeout(timer);
  });

  return (
    showAlert && (
      <Alert variant="light">
        <Stack direction="horizontal" gap={2}>
          <Spinner />
          <span>Loading...</span>
        </Stack>
      </Alert>
    )
  );
}

export { LoadingAlert, DelayedLoadingAlert };
