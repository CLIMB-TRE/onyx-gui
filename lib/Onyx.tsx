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
import { useFields } from "./api/hooks";
import Header from "./components/Header";
import PageTitle from "./components/PageTitle";
import QueryHandler from "./components/QueryHandler";
import { OnyxProps, ProjectProps } from "./interfaces";
import Analysis from "./pages/Analysis";
import Graphs from "./pages/Graphs";
import ProjectRecord from "./pages/ProjectRecord";
import Results from "./pages/Results";
import Site from "./pages/Site";
import User from "./pages/User";
import {
  AnalysisTabKey,
  AnalysisDetailTabKey,
  DataPanelTabKey,
  OnyxTabKey,
  Project,
  ProjectPermissionGroup,
  RecordTabKey,
  RecordDetailTabKey,
  TabState,
  Theme,
  RecentlyViewed,
  ObjectType,
} from "./types";
import { useDelayedValue, usePersistedState } from "./utils/hooks";

import "@fontsource/ibm-plex-sans";
import "./Onyx.scss";
import "./Onyx.css";

interface ProjectPageProps extends ProjectProps {
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
  handleProjectRecordHide: () => void;
  handleAnalysisHide: () => void;
}

function ProjectPage(props: ProjectPageProps) {
  // Get record fields for the project
  const {
    isFetching: isRecordFieldsFetching,
    error: recordFieldsError,
    data: recordFieldsResponse,
  } = useFieldsQuery(props);
  const recordFields = useFields(recordFieldsResponse);

  // Get analyses fields for the project
  const {
    isFetching: isAnalysisFieldsFetching,
    error: analysisFieldsError,
    data: analysisFieldsResponse,
  } = useAnalysisFieldsQuery(props);
  const analysisFields = useFields(analysisFieldsResponse);

  return (
    <Tab.Container
      activeKey={props.tabState.tabKey}
      mountOnEnter
      transition={false}
    >
      <Tab.Content className="h-100">
        <Tab.Pane eventKey={OnyxTabKey.USER} className="h-100">
          <User {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKey.SITE} className="h-100">
          <Site {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKey.RECORDS} className="h-100">
          <QueryHandler
            isFetching={isRecordFieldsFetching}
            error={recordFieldsError}
            data={recordFieldsResponse}
          >
            <Tab.Container
              activeKey={props.tabState.recordTabKey}
              transition={false}
            >
              <Tab.Content className="h-100">
                <Tab.Pane eventKey={RecordTabKey.LIST} className="h-100">
                  <Results
                    {...props}
                    objectType={ObjectType.RECORD}
                    fields={recordFields}
                    title="Records"
                    commandBase={`onyx filter ${props.project.code}`}
                    searchPath={`projects/${props.project.code}`}
                  />
                </Tab.Pane>
                <Tab.Pane
                  eventKey={RecordTabKey.DETAIL}
                  className="h-100"
                  unmountOnExit
                >
                  <ProjectRecord
                    {...props}
                    objectType={ObjectType.RECORD}
                    fields={recordFields}
                    ID={props.tabState.recordID}
                    onHide={props.handleProjectRecordHide}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </QueryHandler>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKey.ANALYSES} className="h-100">
          <QueryHandler
            isFetching={isAnalysisFieldsFetching}
            error={analysisFieldsError}
            data={analysisFieldsResponse}
          >
            <Tab.Container
              activeKey={props.tabState.analysisTabKey}
              transition={false}
            >
              <Tab.Content className="h-100">
                <Tab.Pane eventKey={AnalysisTabKey.LIST} className="h-100">
                  <Results
                    {...props}
                    objectType={ObjectType.ANALYSIS}
                    fields={analysisFields}
                    title="Analyses"
                    commandBase={`onyx filter-analysis ${props.project.code}`}
                    searchPath={`projects/${props.project.code}/analysis`}
                  />
                </Tab.Pane>
                <Tab.Pane
                  eventKey={AnalysisTabKey.DETAIL}
                  className="h-100"
                  unmountOnExit
                >
                  <Analysis
                    {...props}
                    objectType={ObjectType.ANALYSIS}
                    fields={analysisFields}
                    ID={props.tabState.analysisID}
                    onHide={props.handleAnalysisHide}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </QueryHandler>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKey.GRAPHS} className="h-100">
          <Graphs
            {...props}
            objectType={ObjectType.RECORD}
            fields={recordFields}
          />
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
    localStorage.getItem("onyx-theme") === Theme.DARK
  );

  // Set the theme based on darkMode
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute(
      "data-bs-theme",
      darkMode ? Theme.DARK : Theme.LIGHT
    );
  }, [darkMode]);

  const handleThemeChange = () => {
    const darkModeChange = !darkMode;
    setDarkMode(darkModeChange);
    localStorage.setItem(
      "onyx-theme",
      darkModeChange ? Theme.DARK : Theme.LIGHT
    );
  };

  const defaultTabState = {
    tabKey: OnyxTabKey.RECORDS,
    recordTabKey: RecordTabKey.LIST,
    recordDetailTabKey: RecordDetailTabKey.DATA,
    recordDataPanelTabKey: DataPanelTabKey.DETAILS,
    recordID: "",
    analysisTabKey: AnalysisTabKey.LIST,
    analysisDetailTabKey: AnalysisDetailTabKey.DATA,
    analysisDataPanelTabKey: DataPanelTabKey.DETAILS,
    analysisID: "",
  };

  // Project state
  const [project, setProject] = usePersistedState<Project | undefined>(
    props,
    "project",
    undefined
  );
  const [tabState, setTabState] = usePersistedState<TabState>(
    props,
    "tabState",
    defaultTabState
  );
  const [recentlyViewed, setRecentlyViewed] = usePersistedState<
    RecentlyViewed[]
  >(props, "recentlyViewed", []);

  // Clear parameters when project changes
  const handleProjectChange = (p: Project) => {
    if (p !== project) {
      setProject(p);
      setTabState(defaultTabState);
      setRecentlyViewed([]);
    }
  };

  // Update app title based on the tab state
  const { setTitle } = props;
  useEffect(() => {
    if (!setTitle || !project) return;

    switch (true) {
      case tabState.tabKey === OnyxTabKey.USER:
        setTitle("Onyx | Profile");
        break;
      case tabState.tabKey === OnyxTabKey.SITE:
        setTitle("Onyx | Site");
        break;
      case tabState.tabKey === OnyxTabKey.RECORDS &&
        tabState.recordTabKey === RecordTabKey.LIST:
        setTitle(`${project.name} | Records`);
        break;
      case tabState.tabKey === OnyxTabKey.RECORDS &&
        tabState.recordTabKey === RecordTabKey.DETAIL:
        setTitle(`${project.name} | ${tabState.recordID}`);
        break;
      case tabState.tabKey === OnyxTabKey.ANALYSES &&
        tabState.analysisTabKey === AnalysisTabKey.LIST:
        setTitle(`${project.name} | Analyses`);
        break;
      case tabState.tabKey === OnyxTabKey.ANALYSES &&
        tabState.analysisTabKey === AnalysisTabKey.DETAIL:
        setTitle(`${project.name} | ${tabState.analysisID}`);
        break;
      case tabState.tabKey === OnyxTabKey.GRAPHS:
        setTitle(`${project.name} | Graphs`);
        break;
      default:
        setTitle(`Onyx | ${project.name}`);
    }
  }, [tabState, project, setTitle]);

  // Query for types, lookups and project permissions
  const { data: typesResponse } = useTypesQuery(props);
  const { data: lookupsResponse } = useLookupsQuery(props);
  const { data: projectPermissionsResponse } =
    useProjectPermissionsQuery(props);

  // Get a map of types to their lookups
  const typeLookups = useMemo(() => {
    if (typesResponse?.status !== "success") return new Map<string, string[]>();
    return new Map<string, string[]>(
      typesResponse.data.map((type) => [type.type, type.lookups])
    );
  }, [typesResponse]);

  // Get a map of lookups to their descriptions
  const lookupDescriptions = useMemo(() => {
    if (lookupsResponse?.status !== "success") return new Map<string, string>();
    return new Map<string, string>(
      lookupsResponse.data.map((lookup) => [lookup.lookup, lookup.description])
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
  }, [project, projects, setProject]);

  const handleRecentlyViewed = useCallback(
    (objectType: ObjectType, ID: string) => {
      setRecentlyViewed((prevState) => {
        const updatedList = [...prevState];

        // Remove the item if it exists
        const existingIndex = updatedList.findIndex((item) => item.ID === ID);
        if (existingIndex !== -1) updatedList.splice(existingIndex, 1);

        // Add new item to the front of the list
        updatedList.unshift({
          objectType: objectType,
          ID: ID,
          timestamp: new Date().toString(),
        });

        // Limit to 10 recently viewed items
        return updatedList.slice(0, 10);
      });
    },
    [setRecentlyViewed]
  );

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleProjectRecordShow = useCallback(
    (recordID: string) => {
      setTabState((prevState) => ({
        ...prevState,
        tabKey: OnyxTabKey.RECORDS,
        recordTabKey: RecordTabKey.DETAIL,
        recordDetailTabKey: RecordDetailTabKey.DATA,
        recordDataPanelTabKey: DataPanelTabKey.DETAILS,
        recordID: recordID,
      }));
      handleRecentlyViewed(ObjectType.RECORD, recordID);
    },
    [handleRecentlyViewed, setTabState]
  );

  const handleProjectRecordHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKey.RECORDS,
      recordTabKey: RecordTabKey.LIST,
    }));
  }, [setTabState]);

  const handleAnalysisShow = useCallback(
    (analysisID: string) => {
      setTabState((prevState) => ({
        ...prevState,
        tabKey: OnyxTabKey.ANALYSES,
        analysisTabKey: AnalysisTabKey.DETAIL,
        analysisDetailTabKey: AnalysisDetailTabKey.DATA,
        analysisDataPanelTabKey: DataPanelTabKey.DETAILS,
        analysisID: analysisID,
      }));
      handleRecentlyViewed(ObjectType.ANALYSIS, analysisID);
    },
    [handleRecentlyViewed, setTabState]
  );

  const handleAnalysisHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKey.ANALYSES,
      analysisTabKey: AnalysisTabKey.LIST,
    }));
  }, [setTabState]);

  return (
    <div className="onyx h-100">
      <Header
        {...props}
        darkMode={darkMode}
        tabState={tabState}
        setTabState={setTabState}
        project={project}
        projects={projects}
        recentlyViewed={recentlyViewed}
        handleThemeChange={handleThemeChange}
        handleProjectChange={handleProjectChange}
        handleProjectRecordShow={handleProjectRecordShow}
        handleAnalysisShow={handleAnalysisShow}
        handleProjectRecordHide={handleProjectRecordHide}
        handleAnalysisHide={handleAnalysisHide}
        handleRecentlyViewed={handleRecentlyViewed}
      />
      <Container fluid className="onyx-content p-2">
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
