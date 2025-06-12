import { useMemo } from "react";
import {
  ErrorResponse,
  DetailResponse,
  Choices,
  Field,
  Fields,
} from "../types";

function flattenFields(fields: Record<string, Field>) {
  const flatFields: Record<string, Field> = {};

  // Loop over object and flatten nested fields
  const flatten = (obj: Record<string, Field>, prefix = "") => {
    for (const [field, fieldInfo] of Object.entries(obj)) {
      // TODO: Shouldn't add code here
      const code = prefix + field;
      fieldInfo.code = code;
      flatFields[prefix + field] = fieldInfo;
      if (fieldInfo.type === "relation" && fieldInfo.fields) {
        flatten(fieldInfo.fields, prefix + field + "__");
      }
    }
  };

  flatten(fields);
  return flatFields;
}

const useFieldsInfo = (
  data: DetailResponse<Fields> | ErrorResponse | undefined
) => {
  return useMemo(() => {
    if (data?.status !== "success") {
      return {
        name: "",
        description: "",
        fields: new Map<string, Field>(),
        defaultFields: [] as string[],
      };
    }

    // The name of the project
    const name = data.data.name;

    // The description of the project
    const description = data.data.description;

    // A map of field names to their type, description, actions, values and nested fields
    const fields = new Map(Object.entries(flattenFields(data.data.fields)));

    // The default GUI fields for the project
    const defaultFields = data.data.default_fields || [];

    return { name, description, fields, defaultFields };
  }, [data]);
};

const useFieldDescriptions = (fields: Map<string, Field>) => {
  return useMemo(() => {
    // Get a map of field names to their descriptions
    return new Map(
      Array.from(fields, ([field, options]) => [field, options.description])
    );
  }, [fields]);
};

const useChoiceDescriptions = (
  data: DetailResponse<Choices> | ErrorResponse | undefined
) => {
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
  data: (DetailResponse<Choices> | ErrorResponse)[]
) => {
  // Get a map of fields to choices to their descriptions
  return useMemo(() => {
    // Make a map of fields to their response
    const fieldsData = new Map(fields.map((field, i) => [field, data[i]]));

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

export {
  useChoiceDescriptions,
  useChoicesDescriptions,
  useFieldsInfo,
  useFieldDescriptions,
};
