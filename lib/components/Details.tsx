import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import { useChoicesQueries } from "../api";
import { useChoicesDescriptions } from "../api/hooks";
import { DataProps } from "../interfaces";
import { RecordType, DetailResponse, ErrorResponse } from "../types";
import { useDebouncedValue } from "../utils/hooks";
import { CopyToClipboardButton } from "./Buttons";
import { Input } from "./Inputs";

interface DetailsProps extends DataProps {
  data: DetailResponse<RecordType> | ErrorResponse | undefined;
  handleErrorModalShow: (error: Error) => void;
}

interface FieldProps extends DataProps {
  field: string;
}

interface ValueProps extends DataProps {
  handleErrorModalShow: (error: Error) => void;
  field: string;
  value: string;
  choiceDescriptions: Map<string, Map<string, string>>;
}

function Field(props: FieldProps) {
  return (
    <small>
      <Stack gap={1}>
        <b>{props.field}</b>
        <div className="text-muted">
          {props.projectFields.get(props.field)?.description}
        </div>
      </Stack>
    </small>
  );
}

function Value(props: ValueProps) {
  return (
    <small>
      <Stack gap={3} direction="horizontal">
        <Stack gap={1}>
          {typeof props.value === "string" &&
          props.value.startsWith("s3://") &&
          props.value.endsWith(".html") ? (
            <Button
              className="p-0 me-auto"
              size="sm"
              variant="link"
              onClick={() =>
                props
                  .s3PathHandler(props.value)
                  .catch((error: Error) => props.handleErrorModalShow(error))
              }
            >
              {props.value}
            </Button>
          ) : (
            <span className="me-auto">{props.value}</span>
          )}
          {props.choiceDescriptions
            .get(props.field)
            ?.get(props.value.toLowerCase()) && (
            <div className="text-muted">
              {props.choiceDescriptions
                .get(props.field)
                ?.get(props.value.toLowerCase())}
            </div>
          )}
        </Stack>
        <CopyToClipboardButton>{props.value}</CopyToClipboardButton>
      </Stack>
    </small>
  );
}

function Details(props: DetailsProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.toLowerCase(), 200);

  // Get choice fields
  // I'm drowning in hooks
  const choiceFields = useMemo(() => {
    const fields: string[] = [];
    props.projectFields.forEach((value, key) => {
      if (value.type === "choice") fields.push(key);
    });
    return fields;
  }, [props.projectFields]);

  const choiceDescriptionProps = useMemo(() => {
    return {
      ...props,
      fields: choiceFields,
    };
  }, [props, choiceFields]);

  const choicesResponse = useChoicesQueries(choiceDescriptionProps);

  const choiceDescriptions = useChoicesDescriptions(
    choiceFields,
    choicesResponse.map((r) => r.data)
  );

  // Get the object details
  const object = useMemo(() => {
    if (props.data?.status !== "success") return [];
    return Object.entries(props.data.data)
      .filter(
        ([key]) =>
          props.projectFields.get(key)?.type !== "relation" &&
          props.projectFields.get(key)?.type !== "structure" &&
          key !== "is_published"
      )
      .map(([key, value]) => ({
        Field: key,
        Value: Array.isArray(value)
          ? value.join(", ")
          : value?.toString() || "",
      })) as { Field: string; Value: string }[];
  }, [props]);

  return (
    <Container fluid className="h-100 p-0 pb-3">
      <Stack direction="horizontal" gap={2} className="pb-2">
        <h5 className="me-auto">Details</h5>
        <div style={{ width: "300px" }}>
          <Input
            {...props}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Stack>
      <Card body className="h-100 overflow-y-auto">
        <Stack gap={2}>
          {object
            .filter(
              (row) =>
                row.Field.toLowerCase().includes(debouncedSearch) ||
                row.Value.toLowerCase().includes(debouncedSearch) ||
                props.projectFields
                  .get(row.Field)
                  ?.description.toLowerCase()
                  .includes(debouncedSearch) ||
                (
                  choiceDescriptions
                    .get(row.Field)
                    ?.get(row.Value.toLowerCase()) || ""
                )
                  .toLowerCase()
                  .includes(debouncedSearch)
            )
            .map((row, index) => (
              <Card body key={index}>
                <Container fluid>
                  <Row>
                    <Col>
                      <Field {...props} field={row.Field} />
                    </Col>
                    <Col>
                      <Value
                        {...props}
                        field={row.Field}
                        value={row.Value}
                        choiceDescriptions={choiceDescriptions}
                      />
                    </Col>
                  </Row>
                </Container>
              </Card>
            ))}
        </Stack>
      </Card>
    </Container>
  );
}

export default Details;
export { Field };
