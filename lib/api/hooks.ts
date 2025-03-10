import { useMemo } from "react";
import {
  ProjectField,
  FieldsResponse,
  ErrorResponse,
  ChoicesResponse,
} from "../types";

function flattenFields(fields: Record<string, ProjectField>) {
  const flatFields: Record<string, ProjectField> = {};

  // Loop over object and flatten nested fields
  const flatten = (obj: Record<string, ProjectField>, prefix = "") => {
    for (const [field, fieldInfo] of Object.entries(obj)) {
      flatFields[prefix + field] = fieldInfo;
      if (fieldInfo.type === "relation" && fieldInfo.fields) {
        flatten(
          fieldInfo.fields as Record<string, ProjectField>,
          prefix + field + "__"
        );
      }
    }
  };

  flatten(fields);
  return flatFields;
}

const useFieldsInfo = (fieldsResponse: FieldsResponse | ErrorResponse) => {
  return useMemo(() => {
    if (fieldsResponse?.status !== "success") {
      return {
        name: "None",
        fields: new Map<string, ProjectField>(),
        descriptions: new Map<string, string>(),
      };
    }

    // The name of the project
    const name = fieldsResponse.data.name;

    // A map of field names to their type, description, actions, values and nested fields
    const fields = new Map(
      Object.entries(flattenFields(fieldsResponse.data.fields))
    );

    // A map of field names to their descriptions
    const descriptions = new Map(
      Array.from(fields, ([field, options]) => [field, options.description])
    );
    return { name, fields, descriptions };
  }, [fieldsResponse]);
};

const useChoiceDescriptions = (data: ChoicesResponse | ErrorResponse) => {
  // Get a map of choices to their descriptions
  return useMemo(() => {
    if (data?.status !== "success") return new Map<string, string>();
    return new Map(
      Object.entries(data.data).map(([choice, description]) => [
        choice,
        description.description,
      ])
    );
  }, [data]);
};

const useChoicesDescriptions = (
  fields: string[],
  data: (ChoicesResponse | ErrorResponse)[]
) => {
  // Get a map of fields to choices to their descriptions
  return useMemo(() => {
    // Make a map of fields to their response
    const fieldsData = new Map<string, ChoicesResponse | ErrorResponse>(
      fields.map((field, i) => [field, data[i]])
    );

    const descriptions = new Map<string, Map<string, string>>();
    for (const [field, response] of fieldsData) {
      if (response.status !== "success") continue;
      if (!descriptions.has(field)) descriptions.set(field, new Map());
      for (const [choice, description] of Object.entries(response.data)) {
        descriptions
          .get(field)
          ?.set(choice.toLowerCase(), description.description);
      }
    }
    return descriptions;
  }, [fields, data]);
};

export { useFieldsInfo, useChoiceDescriptions, useChoicesDescriptions };
