import { useState, useMemo } from "react";
import { useRecordsQuery } from "../api";
import { DataProps } from "../interfaces";
import Results from "./Results";

function Data(props: DataProps) {
  const [searchParameters, setSearchParameters] = useState("");

  const queryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
    }),
    [props, searchParameters]
  );

  const {
    isFetching: recordsPending,
    error: recordsError,
    data: recordsResponse,
    refetch: refetchRecords,
  } = useRecordsQuery(queryProps);

  return (
    <Results
      {...props}
      title="Data"
      searchPath={`projects/${props.project}`}
      searchParameters={searchParameters}
      setSearchParameters={setSearchParameters}
      resultsPending={recordsPending}
      resultsError={recordsError as Error}
      resultsResponse={recordsResponse}
      refetchResults={refetchRecords}
    />
  );
}

export default Data;
