import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import { ResultsProps } from "../interfaces";
import { FilterConfig, Field } from "../types";
import { formatFilters } from "../utils/functions";
import { useDebouncedValue } from "../utils/hooks";
import ColumnsModal from "../components/ColumnsModal";
import { CopyToClipboardButton } from "../components/Buttons";

function Results(props: ResultsProps) {
  // TODO: Currently duplicate queries made on initialisation
  // One with default fields and one without
  // Perhaps queries should be refactored to accept inputs directly rather than search parameter strings?
  const [searchParameters, setSearchParameters] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterConfig[]);
  const [summariseList, setSummariseList] = useState(new Array<string>());
  const [columnList, setColumnList] = useState<Field[]>(
    Array.from(props.fields.entries())
      .filter(([, field]) => props.defaultFields.includes(field.code))
      .map(([, field]) => field)
  );
  const [columnsModalShow, setColumnsModalShow] = useState(false);

  const defaultWidth = 300; // Default sidebar width
  const minWidth = 220; // Minimum width for the sidebar
  const maxWidth = 600; // Maximum width for the sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  const filterOptions = useMemo(
    () =>
      Array.from(props.fields.entries())
        .filter(([, field]) => field.actions.includes("filter"))
        .map(([field]) => field),
    [props.fields]
  );

  const columnOptions = useMemo(
    () =>
      Array.from(props.fields.entries())
        .filter(([, field]) => field.actions.includes("list"))
        .map(([, field]) => field),
    [props.fields]
  );

  // Pagination page size
  const pageSize = 100;

  const paginatedQueryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
      pageSize,
    }),
    [props, searchParameters]
  );

  const { isFetching, error, data, refetch } =
    useResultsQuery(paginatedQueryProps);

  const searchParams = useMemo(() => {
    let columns;
    let columnOperator;
    if (columnList.length <= columnOptions.length - columnList.length) {
      columns = columnList;
      columnOperator = "include";
    } else {
      columns = columnOptions.filter((field) => !columnList.includes(field));
      columnOperator = "exclude";
    }

    return new URLSearchParams(
      formatFilters(filterList)
        .concat(
          summariseList
            .filter((field) => field)
            .map((field) => ["summarise", field])
        )
        .concat(columns.map((field) => [columnOperator, field.code]))
        .concat(
          [searchInput]
            .map((search) => search.trim())
            .filter((search) => search)
            .map((search) => ["search", search])
        )
    ).toString();
  }, [filterList, summariseList, columnList, searchInput, columnOptions]);

  const debouncedSearchParams = useDebouncedValue(searchParams, 500);

  useEffect(
    () => setSearchParameters(debouncedSearchParams),
    [debouncedSearchParams, setSearchParameters]
  );

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!isFetching) refetch();
  };

  const handleCopyCLICommand = () => {
    // Format filters
    const filters = formatFilters(filterList)
      .map(
        ([filter, value]) =>
          `--field ${filter.replace("__exact", "")}=${
            value.includes(" ") ? `"${value}"` : value
          }`
      )
      .join(" ");

    // Format summarise
    let summarise = "";
    const summariseFields = summariseList.filter((field) => field);
    if (summariseFields.length > 0)
      summarise = `--summarise ${summariseFields.join(",")}`;

    // Assemble the command
    const command = [props.commandBase, filters, summarise].join(" ").trim();

    navigator.clipboard.writeText(command);
  };

  // Mouse handlers for resizing the sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleDoubleClick = () => {
    setSidebarWidth(defaultWidth); // Reset to default width
  };

  // Add/remove event listeners when user starts/stops resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    // Cleanup function runs when component unmounts or dependencies change
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove]);

  return (
    <Container fluid className="g-0 h-100">
      <ColumnsModal
        {...props}
        show={columnsModalShow}
        onHide={() => setColumnsModalShow(false)}
        columns={columnOptions}
        activeColumns={columnList}
        setActiveColumns={setColumnList}
      />
      <Stack direction="horizontal" className="h-100">
        {!sidebarCollapsed && (
          <>
            <div
              className="h-100"
              style={{
                position: "relative",
                width: sidebarWidth,
                minWidth: sidebarWidth,
                paddingRight: "10px",
              }}
            >
              <Container fluid className="h-100 g-0">
                <Stack gap={2} className="h-100">
                  <SearchBar
                    {...props}
                    placeholder={`Search ${props.title.toLowerCase()}...`}
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                    handleSearch={handleSearch}
                  />
                  <Stack gap={2} className="h-100 overflow-y-hidden">
                    <FilterPanel
                      {...props}
                      filterList={filterList}
                      setFilterList={setFilterList}
                      filterFieldOptions={filterOptions}
                    />
                    <SummarisePanel
                      {...props}
                      summariseList={summariseList}
                      setSummariseList={setSummariseList}
                      filterFieldOptions={filterOptions}
                    />
                    <CopyToClipboardButton
                      size="sm"
                      variant="dark"
                      title="Copy CLI Command"
                      onClick={handleCopyCLICommand}
                      showTitle
                    />
                  </Stack>
                </Stack>
              </Container>
              <div
                className="resizer"
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
              />
            </div>
            <div
              style={{
                paddingLeft: "10px",
              }}
            />
          </>
        )}
        <div className="h-100" style={{ flex: 1 }}>
          <Container fluid className="h-100 g-0">
            <ResultsPanel
              {...props}
              searchParameters={searchParameters}
              pageSize={pageSize}
              isFetching={isFetching}
              error={error}
              data={data}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              setColumnsModalShow={setColumnsModalShow}
            />
          </Container>
        </div>
      </Stack>
    </Container>
  );
}

export default Results;
