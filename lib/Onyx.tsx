import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Tab from "react-bootstrap/Tab";
import { MdJoinInner } from "react-icons/md";
import {
  useAnalysisFieldsQuery,
  useLookupsQuery,
  useFieldsQuery,
  useProjectPermissionsQuery,
  useTypesQuery,
} from "./api";
import Fade from "react-bootstrap/Fade";
import { useFieldsInfo } from "./api/hooks";
import Header from "./components/Header";
import PageTitle from "./components/PageTitle";
import { OnyxProps, ProjectProps } from "./interfaces";
import Analysis from "./pages/Analysis";
import Graphs from "./pages/Graphs";
import ProjectRecord from "./pages/ProjectRecord";
import Results from "./pages/Results";
import Site from "./pages/Site";
import User from "./pages/User";
import {
  AnalysisTabKeys,
  AnalysisDetailTabKeys,
  DataPanelTabKeys,
  Lookup,
  OnyxTabKeys,
  Project,
  ProjectPermissionGroup,
  RecordTabKeys,
  RecordDetailTabKeys,
  TabState,
  Themes,
  TypeObject,
} from "./types";
import { useDelayedValue } from "./utils/hooks";

import "@fontsource/ibm-plex-sans";
import "./Onyx.css";
import "./bootstrap.css";

interface ProjectPageProps extends ProjectProps {
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
  handleProjectRecordHide: () => void;
  handleAnalysisHide: () => void;
}

function ProjectPage(props: ProjectPageProps) {
  // Get project information
  const { data: fieldsResponse } = useFieldsQuery(props);
  const { description, fields } = useFieldsInfo(fieldsResponse);

  // Get project analyses information
  const { data: analysisFieldsResponse } = useAnalysisFieldsQuery(props);
  const { fields: analysisFields } = useFieldsInfo(analysisFieldsResponse);

  return (
    <Tab.Container
      activeKey={props.tabState.tabKey}
      mountOnEnter
      transition={false}
    >
      <Tab.Content className="h-100">
        <Tab.Pane eventKey={OnyxTabKeys.USER} className="h-100">
          <User {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.SITE} className="h-100">
          <Site {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.RECORDS} className="h-100">
          <Tab.Container
            activeKey={props.tabState.recordTabKey}
            transition={false}
          >
            <Tab.Content className="h-100">
              <Tab.Pane eventKey={RecordTabKeys.LIST} className="h-100">
                <Results
                  {...props}
                  fields={fields}
                  projectDescription={description}
                  title="Records"
                  searchPath={`projects/${props.project.code}`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={RecordTabKeys.DETAIL}
                className="h-100"
                unmountOnExit
              >
                <ProjectRecord
                  {...props}
                  fields={fields}
                  projectDescription={description}
                  ID={props.tabState.recordID}
                  onHide={props.handleProjectRecordHide}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.ANALYSES} className="h-100">
          <Tab.Container
            activeKey={props.tabState.analysisTabKey}
            transition={false}
          >
            <Tab.Content className="h-100">
              <Tab.Pane eventKey={AnalysisTabKeys.LIST} className="h-100">
                <Results
                  {...props}
                  fields={analysisFields}
                  projectDescription={description}
                  title="Analyses"
                  searchPath={`projects/${props.project.code}/analysis`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisTabKeys.DETAIL}
                className="h-100"
                unmountOnExit
              >
                <Analysis
                  {...props}
                  fields={analysisFields}
                  projectDescription={description}
                  ID={props.tabState.analysisID}
                  onHide={props.handleAnalysisHide}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.GRAPHS} className="h-100">
          <Graphs {...props} fields={fields} projectDescription={description} />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
}

function LandingPage() {
  const showPage = useDelayedValue(1000);

  return showPage ? (
    <div className="h-100 d-flex justify-content-center align-items-center">
      <Fade in={showPage} appear>
        <h1 className="text-center">
          <MdJoinInner color="var(--bs-pink)" size={100} />{" "}
          <PageTitle title="Onyx" description="API for Pathogen Metadata" />
        </h1>
      </Fade>
    </div>
  ) : (
    <></>
  );
}

function App(props: OnyxProps) {
  // Theme state
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("onyx-theme") === Themes.DARK
  );

  // Set the theme based on darkMode
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute(
      "data-bs-theme",
      darkMode ? Themes.DARK : Themes.LIGHT
    );
  }, [darkMode]);

  const handleThemeChange = () => {
    const darkModeChange = !darkMode;
    setDarkMode(darkModeChange);
    localStorage.setItem(
      "onyx-theme",
      darkModeChange ? Themes.DARK : Themes.LIGHT
    );
  };

  const defaultTabState = {
    tabKey: OnyxTabKeys.RECORDS,
    recordTabKey: RecordTabKeys.LIST,
    recordDetailTabKey: RecordDetailTabKeys.DATA,
    recordDataPanelTabKey: DataPanelTabKeys.DETAILS,
    recordID: "",
    analysisTabKey: AnalysisTabKeys.LIST,
    analysisDetailTabKey: AnalysisDetailTabKeys.DATA,
    analysisDataPanelTabKey: DataPanelTabKeys.DETAILS,
    analysisID: "",
  };

  // Project state
  const [project, setProject] = useState<Project>();
  const [tabState, setTabState] = useState<TabState>(defaultTabState);

  // Clear parameters when project changes
  const handleProjectChange = (project: Project) => {
    setTabState(defaultTabState);
    setProject(project);
  };

  // Query for types, lookups and project permissions
  const { data: typesResponse } = useTypesQuery(props);
  const { data: lookupsResponse } = useLookupsQuery(props);
  const { data: projectPermissionsResponse } =
    useProjectPermissionsQuery(props);

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
      lookupsResponse.data.map((lookup: Lookup) => [
        lookup.lookup,
        lookup.description,
      ])
    );
  }, [lookupsResponse]);

  // Get the project list
  const projects = useMemo(() => {
    if (projectPermissionsResponse?.status !== "success") return [];

    // Map the project permissions to a list of projects
    // Each item in the list is an object with a code and name
    const ps = projectPermissionsResponse.data
      .map((projectPermission: ProjectPermissionGroup) => ({
        code: projectPermission.project,
        name: projectPermission.name,
      }))
      .sort((a: Project, b: Project) =>
        a.code < b.code ? -1 : 1
      ) as Project[];

    // Deduplicate the project list by code
    return [...new Map(ps.map((p) => [p.code, p])).values()];
  }, [projectPermissionsResponse]);

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects.length > 0) {
      setProject(projects[0]);
    }
  }, [project, projects]);

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleProjectRecordShow = useCallback((climbID: string) => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.RECORDS,
      recordTabKey: RecordTabKeys.DETAIL,
      recordDetailTabKey: RecordDetailTabKeys.DATA,
      recordDataPanelTabKey: DataPanelTabKeys.DETAILS,
      recordID: climbID,
    }));
  }, []);

  const handleProjectRecordHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.RECORDS,
      recordTabKey: RecordTabKeys.LIST,
    }));
  }, []);

  const handleAnalysisShow = useCallback((analysisID: string) => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.ANALYSES,
      analysisTabKey: AnalysisTabKeys.DETAIL,
      analysisDetailTabKey: AnalysisDetailTabKeys.DATA,
      analysisDataPanelTabKey: DataPanelTabKeys.DETAILS,
      analysisID: analysisID,
    }));
  }, []);

  const handleAnalysisHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.ANALYSES,
      analysisTabKey: AnalysisTabKeys.LIST,
    }));
  }, []);

  return (
    <div className="Onyx h-100">
      <Header
        {...props}
        darkMode={darkMode}
        tabState={tabState}
        setTabState={setTabState}
        project={project}
        projects={projects}
        handleThemeChange={handleThemeChange}
        handleProjectChange={handleProjectChange}
        handleProjectRecordHide={handleProjectRecordHide}
        handleAnalysisHide={handleAnalysisHide}
      />
      <div className="h-100" style={{ paddingTop: "60px" }}>
        <Container fluid className="h-100 p-2">
          {!project ? (
            <LandingPage />
          ) : (
            <Tab.Container
              activeKey={project.code}
              mountOnEnter
              unmountOnExit
              transition={false}
            >
              <Tab.Content className="h-100">
                {projects.map((p) => (
                  <Tab.Pane key={p.code} eventKey={p.code} className="h-100">
                    <ProjectPage
                      {...props}
                      darkMode={darkMode}
                      tabState={tabState}
                      setTabState={setTabState}
                      project={p}
                      typeLookups={typeLookups}
                      lookupDescriptions={lookupDescriptions}
                      handleProjectRecordShow={handleProjectRecordShow}
                      handleAnalysisShow={handleAnalysisShow}
                      handleProjectRecordHide={handleProjectRecordHide}
                      handleAnalysisHide={handleAnalysisHide}
                    />
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Tab.Container>
          )}
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
