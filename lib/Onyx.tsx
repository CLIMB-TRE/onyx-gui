import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Tab from "react-bootstrap/Tab";
import {
  useAnalysisFieldsQuery,
  useLookupsQuery,
  useProjectFieldsQuery,
  useProjectPermissionsQuery,
  useTypesQuery,
} from "./api";
import { useFieldsInfo } from "./api/hooks";
import Header from "./components/Header";
import { OnyxProps } from "./interfaces";
import Analysis from "./pages/Analysis";
import Graphs from "./pages/Graphs";
import ProjectRecord from "./pages/ProjectRecord";
import Results from "./pages/Results";
import Site from "./pages/Site";
import User from "./pages/User";
import {
  AnalysisTabKeys,
  DataPanelTabKeys,
  LookupObject,
  ProjectPermissionType,
  RecordTabKeys,
  TypeObject,
} from "./types";

import "@fontsource/ibm-plex-sans";
import "./Onyx.css";
import "./bootstrap.css";

function App(props: OnyxProps) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("onyx-theme") === "dark"
  );
  const [project, setProject] = useState("");
  const [tabKey, setTabKey] = useState("records");
  const [recordID, setRecordID] = useState("");
  const [recordTabKey, setRecordTabKey] = useState<string>(RecordTabKeys.Data);
  const [recordDataPanelTabKey, setRecordDataPanelTabKey] = useState<string>(
    DataPanelTabKeys.Details
  );
  const [analysisID, setAnalysisID] = useState("");
  const [analysisTabKey, setAnalysisTabKey] = useState<string>(
    AnalysisTabKeys.Data
  );
  const [analysisDataPanelTabKey, setAnalysisDataPanelTabKey] =
    useState<string>(DataPanelTabKeys.Details);

  // Set the theme based on darkMode state
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleThemeChange = () => {
    const darkModeChange = !darkMode;
    setDarkMode(darkModeChange);
    localStorage.setItem("onyx-theme", darkModeChange ? "dark" : "light");
  };

  // Clear parameters when project changes
  const handleProjectChange = (project: string) => {
    setTabKey("records");
    setRecordID("");
    setAnalysisID("");
    setProject(project);
  };

  const pageProps = useMemo(
    () => ({
      ...props,
      project,
      darkMode,
    }),
    [props, project, darkMode]
  );

  // Query for types, lookups and project permissions
  const { data: typesResponse } = useTypesQuery(props);
  const { data: lookupsResponse } = useLookupsQuery(props);
  const { data: projectPermissionsResponse } =
    useProjectPermissionsQuery(props);
  const {
    isFetching: projectFieldsPending,
    error: projectFieldsError,
    data: projectFieldsResponse,
  } = useProjectFieldsQuery(pageProps);

  const { data: analysisFieldsResponse } = useAnalysisFieldsQuery(pageProps);

  // Get a map of types to their lookups
  const typeLookups = useMemo(() => {
    if (typesResponse?.status !== "success") return new Map<string, string[]>();
    return new Map<string, string[]>(
      typesResponse.data.map((type: TypeObject) => [type.type, type.lookups])
    );
  }, [typesResponse]);

  // Get a map of lookups to their descriptions
  const lookupDescriptions = useMemo(() => {
    if (lookupsResponse?.status !== "success") return new Map<string, string>();
    return new Map<string, string>(
      lookupsResponse.data.map((lookup: LookupObject) => [
        lookup.lookup,
        lookup.description,
      ])
    );
  }, [lookupsResponse]);

  // Get the list of projects
  const projects = useMemo(() => {
    if (projectPermissionsResponse?.status !== "success") return [];
    return projectPermissionsResponse.data
      .map(
        (projectPermission: ProjectPermissionType) => projectPermission.project
      )
      .sort();
  }, [projectPermissionsResponse]);

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects.length > 0) {
      setProject(projects[0]);
    }
  }, [project, projects]);

  // Get project information
  const {
    name: projectName,
    description: projectDescription,
    fields: projectFields,
    descriptions: fieldDescriptions,
  } = useFieldsInfo(projectFieldsResponse);

  // Get project analyses information
  const { fields: analysisFields, descriptions: analysisDescriptions } =
    useFieldsInfo(analysisFieldsResponse);

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleProjectRecordShow = useCallback((climbID: string) => {
    setTabKey("record");
    setRecordTabKey(RecordTabKeys.Data);
    setRecordDataPanelTabKey(DataPanelTabKeys.Details);
    setRecordID(climbID);
  }, []);

  const handleProjectRecordHide = useCallback(() => {
    setTabKey("records");
    setRecordID("");
  }, []);

  const handleAnalysisShow = useCallback((analysisID: string) => {
    setTabKey("analysis");
    setAnalysisTabKey(AnalysisTabKeys.Data);
    setAnalysisDataPanelTabKey(DataPanelTabKeys.Details);
    setAnalysisID(analysisID);
  }, []);

  const handleAnalysisHide = useCallback(() => {
    setTabKey("analyses");
    setAnalysisID("");
  }, []);

  return (
    <div className="Onyx h-100">
      <Header
        {...props}
        project={project}
        projectName={
          projectFieldsPending
            ? "Loading..."
            : projectFieldsError
            ? "Failed to load"
            : projectName
        }
        projectList={projects}
        handleProjectChange={handleProjectChange}
        tabKey={tabKey}
        setTabKey={setTabKey}
        darkMode={darkMode}
        handleThemeChange={handleThemeChange}
        recordID={recordID}
        handleProjectRecordHide={handleProjectRecordHide}
        analysisID={analysisID}
        handleAnalysisHide={handleAnalysisHide}
      />
      <div className="h-100" style={{ paddingTop: "60px" }}>
        <Container fluid className="h-100 p-2">
          <Tab.Container activeKey={tabKey} mountOnEnter>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey="user" className="h-100">
                <User {...props} project={project} darkMode={darkMode} />
              </Tab.Pane>
              <Tab.Pane eventKey="site" className="h-100">
                <Site {...props} project={project} darkMode={darkMode} />
              </Tab.Pane>
              <Tab.Pane eventKey="records" className="h-100">
                <Results
                  {...pageProps}
                  projectFields={projectFields}
                  projectDescription={projectDescription}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  title="Records"
                  searchPath={`projects/${project}`}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="record" className="h-100">
                <ProjectRecord
                  {...pageProps}
                  projectFields={projectFields}
                  projectDescription={projectDescription}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  ID={recordID}
                  tabKey={recordTabKey}
                  setTabKey={setRecordTabKey}
                  dataPanelTabKey={recordDataPanelTabKey}
                  setDataPanelTabKey={setRecordDataPanelTabKey}
                  onHide={handleProjectRecordHide}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analyses" className="h-100">
                <Results
                  {...pageProps}
                  projectFields={analysisFields}
                  projectDescription={projectDescription}
                  typeLookups={typeLookups}
                  fieldDescriptions={analysisDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  title="Analyses"
                  searchPath={`projects/${project}/analysis`}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis" className="h-100">
                <Analysis
                  {...pageProps}
                  projectFields={analysisFields}
                  projectDescription={projectDescription}
                  typeLookups={typeLookups}
                  fieldDescriptions={analysisDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  ID={analysisID}
                  tabKey={analysisTabKey}
                  setTabKey={setAnalysisTabKey}
                  dataPanelTabKey={analysisDataPanelTabKey}
                  setDataPanelTabKey={setAnalysisDataPanelTabKey}
                  onHide={handleAnalysisHide}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="graphs" className="h-100">
                <Graphs
                  {...pageProps}
                  projectFields={projectFields}
                  projectDescription={projectDescription}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Container>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function Onyx(props: OnyxProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <App {...props} />
    </QueryClientProvider>
  );
}

export default Onyx;
