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

export const useFields = (
  data: DetailResponse<Fields> | ErrorResponse | undefined
) => {
  return useMemo(() => {
    let fields: Fields;

    if (data?.status !== "success") {
      fields = {
        name: "",
        description: "",
        object_type: "",
        primary_id: "",
        version: "",
        fields: {},
        fields_map: new Map<string, Field>(),
        default_fields: [],
      };
    } else {
      fields = data.data;
      fields.fields_map = new Map(Object.entries(flattenFields(fields.fields)));
      fields.default_fields = fields.default_fields || [];
    }

    return fields;
  }, [data]);
};

export const useFieldDescriptions = (fields: Map<string, Field>) => {
  return useMemo(() => {
    // Get a map of field names to their descriptions
    return new Map(
      Array.from(fields, ([field, options]) => [field, options.description])
    );
  }, [fields]);
};

export const useChoiceDescriptions = (
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

export const useChoicesDescriptions = (
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
