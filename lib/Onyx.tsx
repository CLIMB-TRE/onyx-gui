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
import {
  useFields,
  useLookupDescriptions,
  useProjects,
  useTypeLookups,
} from "./api/hooks";
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
  Navigation,
  OnyxTabKey,
  Project,
  RecordTabKey,
  RecordDetailTabKey,
  TabState,
  Theme,
  RecentlyViewed,
  ObjectType,
  DefaultPrimaryID,
} from "./types";
import { useDelayedValue, usePersistedState } from "./utils/hooks";
import { getTheme } from "./utils/functions";

import "./Onyx.scss";

interface ProjectPageProps extends ProjectProps {
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
}

function ProjectPage(props: ProjectPageProps) {
  // Get record fields for the project
  const {
    isFetching: isRecordFieldsFetching,
    error: recordFieldsError,
    data: recordFieldsResponse,
  } = useFieldsQuery(props);
  const recordFields = useFields(recordFieldsResponse);
  const recordPrimaryID = useMemo(() => {
    return recordFields.primary_id ?? DefaultPrimaryID.RECORD;
  }, [recordFields]);

  // Get analyses fields for the project
  const {
    isFetching: isAnalysisFieldsFetching,
    error: analysisFieldsError,
    data: analysisFieldsResponse,
  } = useAnalysisFieldsQuery(props);
  const analysisFields = useFields(analysisFieldsResponse);
  const analysisPrimaryID = useMemo(() => {
    return analysisFields.primary_id ?? DefaultPrimaryID.ANALYSIS;
  }, [analysisFields]);

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
                    fields={recordFields}
                    recordPrimaryID={recordPrimaryID}
                    analysisPrimaryID={analysisPrimaryID}
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
                    fields={recordFields}
                    recordPrimaryID={recordPrimaryID}
                    analysisPrimaryID={analysisPrimaryID}
                    ID={props.tabState.recordID}
                    onHide={() => props.handleObjectHide(ObjectType.RECORD)}
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
                    fields={analysisFields}
                    recordPrimaryID={recordPrimaryID}
                    analysisPrimaryID={analysisPrimaryID}
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
                    fields={analysisFields}
                    recordPrimaryID={recordPrimaryID}
                    analysisPrimaryID={analysisPrimaryID}
                    ID={props.tabState.analysisID}
                    onHide={() => props.handleObjectHide(ObjectType.ANALYSIS)}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </QueryHandler>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKey.GRAPHS} className="h-100">
          <Graphs
            {...props}
            fields={recordFields}
            recordPrimaryID={recordPrimaryID}
            analysisPrimaryID={analysisPrimaryID}
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
  const extTheme = getTheme(props.extTheme);
  const localThemeKey = "onyx-theme";
  const localTheme = getTheme(localStorage.getItem(localThemeKey));
  const [theme, setTheme] = useState(extTheme ?? localTheme ?? Theme.LIGHT);

  // Set the theme
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const handleThemeChange = () => {
    const updatedTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(updatedTheme);
    localStorage.setItem(localThemeKey, updatedTheme);
  };

  // Default application state
  const defaultTabState: TabState = {
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
  const defaultNavigation: Navigation = {
    history: [],
    index: -1,
  };
  const defaultRecentlyViewed: RecentlyViewed[] = [];

  // Project and application state
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
  const [navigation, setNavigation] = useState<Navigation>(defaultNavigation);
  const [recentlyViewed, setRecentlyViewed] = usePersistedState<
    RecentlyViewed[]
  >(props, "recentlyViewed", defaultRecentlyViewed);

  // Clear parameters when project changes
  const handleProjectChange = (p: Project) => {
    if (p !== project) {
      setProject(p);
      setTabState(defaultTabState);
      setNavigation(defaultNavigation);
      setRecentlyViewed(defaultRecentlyViewed);
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

  // Get a map of types to their lookups
  const { data: typesResponse } = useTypesQuery(props);
  const typeLookups = useTypeLookups(typesResponse);

  // Get a map of lookups to their descriptions
  const { data: lookupsResponse } = useLookupsQuery(props);
  const lookupDescriptions = useLookupDescriptions(lookupsResponse);

  // Get the projects from project permissions
  const { data: projectPermissionsResponse } =
    useProjectPermissionsQuery(props);
  const projects = useProjects(projectPermissionsResponse);

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects.length > 0) {
      setProject(projects[0]);
    }
  }, [project, projects, setProject]);

  const handleNavigationChange = useCallback(
    (tabState: TabState, updatedState: TabState) => {
      setNavigation((prevState) => {
        const history = prevState.history.slice(0, prevState.index + 1);
        let lastState = history[history.length - 1];
        if (!lastState) {
          lastState = tabState;
          history.push(lastState);
        }

        if (JSON.stringify(lastState) === JSON.stringify(updatedState)) {
          return prevState;
        }

        const updatedHistory = [...history, updatedState].slice(-50);
        const updatedIndex = updatedHistory.length - 1;

        return {
          history: updatedHistory,
          index: updatedIndex,
        };
      });
    },
    []
  );

  const handleNavigationBack = useCallback(() => {
    if (navigation.index > 0) {
      const updatedIndex = navigation.index - 1;
      setNavigation((prevState) => ({
        ...prevState,
        index: updatedIndex,
      }));
      setTabState(navigation.history[updatedIndex]);
    }
  }, [navigation, setTabState]);

  const handleNavigationForward = useCallback(() => {
    if (navigation.index < navigation.history.length - 1) {
      const updatedIndex = navigation.index + 1;
      setNavigation((prevState) => ({
        ...prevState,
        index: updatedIndex,
      }));
      setTabState(navigation.history[updatedIndex]);
    }
  }, [navigation, setTabState]);

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

  const handleTabChange = useCallback(
    (updatedState: TabState) => {
      setTabState(updatedState);
      handleNavigationChange(tabState, updatedState);
      if (
        updatedState.tabKey === OnyxTabKey.RECORDS &&
        updatedState.recordTabKey === RecordTabKey.DETAIL &&
        updatedState.recordID
      )
        handleRecentlyViewed(ObjectType.RECORD, updatedState.recordID);
      else if (
        updatedState.tabKey === OnyxTabKey.ANALYSES &&
        updatedState.analysisTabKey === AnalysisTabKey.DETAIL &&
        updatedState.analysisID
      )
        handleRecentlyViewed(ObjectType.ANALYSIS, updatedState.analysisID);
    },
    [tabState, setTabState, handleNavigationChange, handleRecentlyViewed]
  );

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleObjectShow = useCallback(
    (objectType: ObjectType, ID: string) => {
      if (objectType === ObjectType.RECORD) {
        handleTabChange({
          ...tabState,
          tabKey: OnyxTabKey.RECORDS,
          recordTabKey: RecordTabKey.DETAIL,
          recordDetailTabKey: RecordDetailTabKey.DATA,
          recordDataPanelTabKey: DataPanelTabKey.DETAILS,
          recordID: ID,
        });
      } else if (objectType === ObjectType.ANALYSIS) {
        handleTabChange({
          ...tabState,
          tabKey: OnyxTabKey.ANALYSES,
          analysisTabKey: AnalysisTabKey.DETAIL,
          analysisDetailTabKey: AnalysisDetailTabKey.DATA,
          analysisDataPanelTabKey: DataPanelTabKey.DETAILS,
          analysisID: ID,
        });
      }
    },
    [tabState, handleTabChange]
  );

  const handleObjectHide = useCallback(
    (objectType: ObjectType) => {
      if (objectType === ObjectType.RECORD) {
        handleTabChange({
          ...tabState,
          tabKey: OnyxTabKey.RECORDS,
          recordTabKey: RecordTabKey.LIST,
        });
      } else if (objectType === ObjectType.ANALYSIS) {
        handleTabChange({
          ...tabState,
          tabKey: OnyxTabKey.ANALYSES,
          analysisTabKey: AnalysisTabKey.LIST,
        });
      }
    },
    [tabState, handleTabChange]
  );

  return (
    <div className="climb-jupyter onyx h-100">
      <Header
        {...props}
        theme={extTheme ?? theme}
        tabState={tabState}
        handleThemeChange={handleThemeChange}
        handleTabChange={handleTabChange}
        handleObjectShow={handleObjectShow}
        handleObjectHide={handleObjectHide}
        project={project}
        projects={projects}
        recentlyViewed={recentlyViewed}
        handleProjectChange={handleProjectChange}
        navigation={navigation}
        handleNavigateBack={handleNavigationBack}
        handleNavigateForward={handleNavigationForward}
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
                    handleTabChange={handleTabChange}
                    handleObjectShow={handleObjectShow}
                    handleObjectHide={handleObjectHide}
                    project={p}
                    typeLookups={typeLookups}
                    lookupDescriptions={lookupDescriptions}
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
