import { memo } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

const ResultsTable = memo(function ResultsTable({
  data,
  titles,
  s3PathHandler,
}: {
  data: Record<string, string | number | boolean | null>[];
  titles?: Map<string, string>;
  s3PathHandler?: (path: string) => void;
}) {
  const headers = () => {
    if (data.length > 0) {
      return Object.keys(data[0]);
    } else {
      return [];
    }
  };

  const rows = data.map((item) =>
    Object.values(item).map((value) => value?.toString().trim() || "")
  );

  return (
    <Table striped bordered hover responsive size="sm">
      <thead>
        <tr>
          {headers().map((header) => (
            <th key={header} title={titles?.get(header)}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, index) =>
              s3PathHandler &&
              cell.startsWith("s3://") &&
              cell.endsWith(".html") ? (
                <td key={index}>
                  <Button variant="link" onClick={() => s3PathHandler(cell)}>
                    {cell}
                  </Button>
                </td>
              ) : (
                <td key={index}>{cell}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
});

export default ResultsTable;
