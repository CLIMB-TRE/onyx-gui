import { memo, useMemo, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { ResultType } from "../types";

const ResultsTable = memo(function ResultsTable({
  data,
  titles,
  recordDetailHandler,
  s3PathHandler,
  isSortable = true,
}: {
  data: ResultType[];
  titles?: Map<string, string>;
  recordDetailHandler?: (climbID: string) => void;
  s3PathHandler?: (path: string) => void;
  isSortable?: boolean;
}) {
  const [sort, setSort] = useState({ sortKey: "", direction: "" });

  // Array of strings containing the headers of the table
  const headers = () => {
    if (data.length > 0) {
      return Object.keys(data[0]);
    } else {
      return [];
    }
  };

  // Array of arrays containing the unsorted data
  const rows = useMemo(() => {
    return data.map((item) =>
      Object.values(item).map((value) =>
        typeof value === "number" ? value : value?.toString().trim() || ""
      )
    );
  }, [data]);

  // Copy of the rows array that will be sorted in-place
  const sortedRows = useMemo(() => {
    return [...rows];
  }, [rows]);

  function handleHeaderSort(header: string) {
    const sortOptions = ["asc", "desc", ""];
    let direction: string;

    if (sort.sortKey === header) {
      direction = sortOptions[(sortOptions.indexOf(sort.direction) + 1) % 3];
    } else {
      direction = sortOptions[0];
    }

    setSort({
      sortKey: header,
      direction: direction,
    });
  }

  function sortRows() {
    const sortIndex = headers().indexOf(sort.sortKey);

    if (sortedRows.length > 0 && sort.direction === "asc") {
      if (typeof sortedRows[0][sortIndex] === "number") {
        return sortedRows.sort(
          (a, b) => (a[sortIndex] as number) - (b[sortIndex] as number)
        );
      } else {
        return sortedRows.sort((a, b) =>
          (a[sortIndex] as string).toLowerCase() >
          (b[sortIndex] as string).toLowerCase()
            ? 1
            : -1
        );
      }
    } else if (sortedRows.length > 0 && sort.direction === "desc") {
      if (typeof sortedRows[0][sortIndex] === "number") {
        return sortedRows.sort(
          (a, b) => (b[sortIndex] as number) - (a[sortIndex] as number)
        );
      } else {
        return sortedRows.sort((a, b) =>
          (a[sortIndex] as string).toLowerCase() <
          (b[sortIndex] as string).toLowerCase()
            ? 1
            : -1
        );
      }
    } else {
      return rows;
    }
  }

  const climbIDIndex = headers().indexOf("climb_id");

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          {headers().map((header, index) => (
            <th
              key={index}
              title={titles?.get(header)}
              onClick={() => isSortable && handleHeaderSort(header)}
            >
              <span>
                {header}&nbsp;
                {isSortable ? (
                  sort.sortKey === header && sort.direction === "asc" ? (
                    "↑"
                  ) : sort.sortKey === header && sort.direction === "desc" ? (
                    "↓"
                  ) : (
                    <span className="text-secondary">↕</span>
                  )
                ) : (
                  <span>&nbsp;</span>
                )}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortRows().map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) =>
              recordDetailHandler &&
              cellIndex === climbIDIndex &&
              typeof cell === "string" ? (
                <td key={cellIndex}>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => {
                      recordDetailHandler(cell);
                    }}
                  >
                    {cell}
                  </Button>
                </td>
              ) : s3PathHandler &&
                typeof cell === "string" &&
                cell.startsWith("s3://") &&
                cell.endsWith(".html") ? (
                <td key={cellIndex}>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => s3PathHandler(cell)}
                  >
                    {cell}
                  </Button>
                </td>
              ) : (
                <td key={cellIndex}>{cell}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
});

export default ResultsTable;
