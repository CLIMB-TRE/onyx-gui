import Badge from "react-bootstrap/Badge";

function UnpublishedBadge() {
  return (
    <big>
      <Badge bg="" style={{ backgroundColor: "var(--bs-pink)" }}>
        UNPUBLISHED
      </Badge>
    </big>
  );
}

export { UnpublishedBadge };
