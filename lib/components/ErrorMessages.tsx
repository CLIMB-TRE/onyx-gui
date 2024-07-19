import Alert from "react-bootstrap/Alert";
import { ErrorType } from "../types";

function ErrorMessages(props: { messages: ErrorType }) {
  return Object.entries(props.messages).map(([key, value]) =>
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
  );
}

export default ErrorMessages;
