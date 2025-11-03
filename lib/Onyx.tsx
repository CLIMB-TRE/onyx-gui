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
import QueryHandler from "./components/QueryHandler";
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
  OnyxTabKeys,
  Project,
  ProjectPermissionGroup,
  RecordTabKeys,
  RecordDetailTabKeys,
  TabState,
  Themes,
  RecentlyViewed,
  ObjectType,
} from "./types";
import { useDelayedValue, usePersistedState } from "./utils/hooks";
import { getTheme } from "./utils/functions";

import "./Onyx.scss";

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
  const { isFetching, error, data: fieldsResponse } = useFieldsQuery(props);
  const { description, fields, defaultFields } = useFieldsInfo(fieldsResponse);

  // Get project analyses information
  const {
    isFetching: isAnalysisFetching,
    error: analysisError,
    data: analysisFieldsResponse,
  } = useAnalysisFieldsQuery(props);
  const { fields: analysisFields, defaultFields: defaultAnalysisFields } =
    useFieldsInfo(analysisFieldsResponse);

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
          <QueryHandler
            isFetching={isFetching}
            error={error}
            data={fieldsResponse}
          >
            <Tab.Container
              activeKey={props.tabState.recordTabKey}
              transition={false}
            >
              <Tab.Content className="h-100">
                <Tab.Pane eventKey={RecordTabKeys.LIST} className="h-100">
                  <Results
                    {...props}
                    fields={fields}
                    defaultFields={defaultFields}
                    projectDescription={description}
                    title="Records"
                    commandBase={`onyx filter ${props.project.code}`}
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
          </QueryHandler>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.ANALYSES} className="h-100">
          <QueryHandler
            isFetching={isAnalysisFetching}
            error={analysisError}
            data={analysisFieldsResponse}
          >
            <Tab.Container
              activeKey={props.tabState.analysisTabKey}
              transition={false}
            >
              <Tab.Content className="h-100">
                <Tab.Pane eventKey={AnalysisTabKeys.LIST} className="h-100">
                  <Results
                    {...props}
                    fields={analysisFields}
                    defaultFields={defaultAnalysisFields}
                    projectDescription={description}
                    title="Analyses"
                    commandBase={`onyx filter-analysis ${props.project.code}`}
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
          </QueryHandler>
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
  const extTheme = getTheme(props.extTheme);
  const localTheme = getTheme(localStorage.getItem("onyx-theme"));
  const [theme, setTheme] = useState(extTheme ?? localTheme ?? Themes.LIGHT);

  // Set the theme
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const handleThemeChange = () => {
    const updatedTheme = theme === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    setTheme(updatedTheme);
    localStorage.setItem("onyx-theme", updatedTheme);
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
      case tabState.tabKey === OnyxTabKeys.USER:
        setTitle("Onyx | Profile");
        break;
      case tabState.tabKey === OnyxTabKeys.SITE:
        setTitle("Onyx | Site");
        break;
      case tabState.tabKey === OnyxTabKeys.RECORDS &&
        tabState.recordTabKey === RecordTabKeys.LIST:
        setTitle(`${project.name} | Records`);
        break;
      case tabState.tabKey === OnyxTabKeys.RECORDS &&
        tabState.recordTabKey === RecordTabKeys.DETAIL:
        setTitle(`${project.name} | ${tabState.recordID}`);
        break;
      case tabState.tabKey === OnyxTabKeys.ANALYSES &&
        tabState.analysisTabKey === AnalysisTabKeys.LIST:
        setTitle(`${project.name} | Analyses`);
        break;
      case tabState.tabKey === OnyxTabKeys.ANALYSES &&
        tabState.analysisTabKey === AnalysisTabKeys.DETAIL:
        setTitle(`${project.name} | ${tabState.analysisID}`);
        break;
      case tabState.tabKey === OnyxTabKeys.GRAPHS:
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
    (climbID: string) => {
      setTabState((prevState) => ({
        ...prevState,
        tabKey: OnyxTabKeys.RECORDS,
        recordTabKey: RecordTabKeys.DETAIL,
        recordDetailTabKey: RecordDetailTabKeys.DATA,
        recordDataPanelTabKey: DataPanelTabKeys.DETAILS,
        recordID: climbID,
      }));
      handleRecentlyViewed("record", climbID);
    },
    [handleRecentlyViewed, setTabState]
  );

  const handleProjectRecordHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.RECORDS,
      recordTabKey: RecordTabKeys.LIST,
    }));
  }, [setTabState]);

  const handleAnalysisShow = useCallback(
    (analysisID: string) => {
      setTabState((prevState) => ({
        ...prevState,
        tabKey: OnyxTabKeys.ANALYSES,
        analysisTabKey: AnalysisTabKeys.DETAIL,
        analysisDetailTabKey: AnalysisDetailTabKeys.DATA,
        analysisDataPanelTabKey: DataPanelTabKeys.DETAILS,
        analysisID: analysisID,
      }));
      handleRecentlyViewed("analysis", analysisID);
    },
    [handleRecentlyViewed, setTabState]
  );

  const handleAnalysisHide = useCallback(() => {
    setTabState((prevState) => ({
      ...prevState,
      tabKey: OnyxTabKeys.ANALYSES,
      analysisTabKey: AnalysisTabKeys.LIST,
    }));
  }, [setTabState]);

  return (
    <div className="climb-jupyter onyx h-100">
      <Header
        {...props}
        theme={extTheme ?? theme}
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
        {!(props.enabled && project) ? (
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
                    theme={extTheme ?? theme}
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
