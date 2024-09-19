import { ResultType } from "../types";

function formatData(data: ResultType[]) {
  return data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? value
          : value === null
          ? ""
          : JSON.stringify(value),
      ])
    )
  );
}

export default formatData;
