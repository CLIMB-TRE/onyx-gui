import { useState, useMemo } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import { ErrorResponse, RecordDetailResponse, RecordType } from "../types";
import { DataProps } from "../interfaces";
import { useChoicesQueries } from "../api";
import { useChoicesDescriptions } from "../api/hooks";
import { Input } from "./Inputs";

interface ObjectDetailsProps extends DataProps {
  data: RecordDetailResponse | ErrorResponse;
  handleErrorModalShow: (error: Error) => void;
}

interface ObjectFieldProps extends DataProps {
  field: string;
}

interface ObjectValueProps extends DataProps {
  handleErrorModalShow: (error: Error) => void;
  field: string;
  value: string;
  choiceDescriptions: Map<string, Map<string, string>>;
}

function ObjectField(props: ObjectFieldProps) {
  return (
    <small>
      <div>
        <b>{props.field}</b>
      </div>
      <div className="text-muted">
        {props.fieldDescriptions.get(props.field)}
      </div>
    </small>
  );
}

function ObjectValue(props: ObjectValueProps) {
  if (
    typeof props.value === "string" &&
    props.value.startsWith("s3://") &&
    props.value.endsWith(".html")
  ) {
    return (
      <Button
        className="p-0"
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
    );
  } else {
    return (
      <small>
        {props.choiceDescriptions
          .get(props.field)
          ?.get(props.value.toLowerCase()) ? (
          <>
            <div>{props.value}</div>
            <div className="text-muted">
              {props.choiceDescriptions
                .get(props.field)
                ?.get(props.value.toLowerCase())}
            </div>
          </>
        ) : (
          props.value
        )}
      </small>
    );
  }
}

function ObjectDetails(props: ObjectDetailsProps) {
  const [search, setSearch] = useState<string>("");

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
        Value: value,
      })) as RecordType[];
  }, [props]);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <Stack gap={2} className="h-100">
      <h5>Details</h5>
      <Input
        {...props}
        value={search}
        onChange={onSearchChange}
        placeholder="Enter field/value..."
      />
      {object
        .filter(
          (row) =>
            row.Field?.toString()
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            row.Value?.toString().toLowerCase().includes(search.toLowerCase())
        )
        .map((row, index) => (
          <Card body key={index}>
            <Container fluid>
              <Row>
                <Col>
                  <ObjectField {...props} field={row.Field as string} />
                </Col>
                <Col>
                  <ObjectValue
                    {...props}
                    field={row.Field as string} // TODO: Fix this
                    value={row.Value as string}
                    choiceDescriptions={choiceDescriptions}
                  />
                </Col>
              </Row>
            </Container>
          </Card>
        ))}
    </Stack>
  );
}

export default ObjectDetails;
