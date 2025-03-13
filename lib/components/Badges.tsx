import Badge from "react-bootstrap/Badge";

function UnpublishedBadge() {
  return (
    <big>
      <Badge bg="info" text="dark">
        Unpublished
      </Badge>
    </big>
  );
}

export { UnpublishedBadge };
