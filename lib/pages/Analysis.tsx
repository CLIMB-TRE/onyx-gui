import { useState, useMemo } from "react";
import { useAnalysesQuery } from "../api";
import { DataProps } from "../interfaces";
import Results from "./Results";

function Analysis(props: DataProps) {
  const [searchParameters, setSearchParameters] = useState("");

  const queryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
    }),
    [props, searchParameters]
  );

  const {
    isFetching: analysesPending,
    error: analysesError,
    data: analysesResponse,
    refetch: refetchAnalyses,
  } = useAnalysesQuery(queryProps);

  return (
    <Results
      {...props}
      title="Analyses"
      searchPath={`projects/${props.project}/analysis`}
      searchParameters={searchParameters}
      setSearchParameters={setSearchParameters}
      resultsPending={analysesPending}
      resultsError={analysesError as Error}
      resultsResponse={analysesResponse}
      refetchResults={refetchAnalyses}
    />
  );
}

export default Analysis;
