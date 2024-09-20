import { useState, useEffect } from "react";
import Stack from "react-bootstrap/Stack";
import { Spinner } from "react-bootstrap";

function LoadingAlert() {
  return (
    <div className="d-flex justify-content-center">
      <Stack direction="horizontal" gap={2}>
        <Spinner />
        <span>Loading...</span>
      </Stack>
    </div>
  );
}

function DelayedLoadingAlert() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAlert(true), 500);
    return () => clearTimeout(timer);
  });

  return showAlert && <LoadingAlert />;
}

export { LoadingAlert, DelayedLoadingAlert };
