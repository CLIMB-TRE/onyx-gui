import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Tab from "react-bootstrap/Tab";
import { MdJoinInner } from "react-icons/md";
import {
  useAnalysisFieldsQuery,
  useLookupsQuery,
  useProjectFieldsQuery,
  useProjectPermissionsQuery,
  useTypesQuery,
} from "./api";
import Fade from "react-bootstrap/Fade";
import { useFieldsInfo } from "./api/hooks";
import Header from "./components/Header";
import { OnyxProps, PageProps } from "./interfaces";
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
  LookupObject,
  OnyxTabKeys,
  Project,
  ProjectPermissionType,
  RecordTabKeys,
  RecordDetailTabKeys,
  Theme,
  TypeObject,
} from "./types";
import { useDelayedValue } from "./utils/hooks";

import "@fontsource/ibm-plex-sans";
import "./Onyx.css";
import "./bootstrap.css";
import PageTitle from "./components/PageTitle";

interface ProjectPageProps extends PageProps {
  typeLookups: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  tabKey: string;
  recordTabKey: string;
  analysisTabKey: string;
  recordID: string;
  analysisID: string;
  handleProjectRecordShow: (recordID: string) => void;
  handleAnalysisShow: (analysisID: string) => void;
  handleProjectRecordHide: () => void;
  handleAnalysisHide: () => void;
  recordDetailTabKey: string;
  setRecordDetailTabKey: (key: string) => void;
  recordDataPanelTabKey: string;
  setRecordDataPanelTabKey: (key: string) => void;
  analysisDetailTabKey: string;
  setAnalysisDetailTabKey: (key: string) => void;
  analysisDataPanelTabKey: string;
  setAnalysisDataPanelTabKey: (key: string) => void;
}

function ProjectPage(props: ProjectPageProps) {
  // Get project information
  const { data: projectFieldsResponse } = useProjectFieldsQuery(props);
  const {
    description: projectDescription,
    fields: projectFields,
    descriptions: fieldDescriptions,
  } = useFieldsInfo(projectFieldsResponse);

  // Get project analyses information
  const { data: analysisFieldsResponse } = useAnalysisFieldsQuery(props);
  const { fields: analysisFields, descriptions: analysisDescriptions } =
    useFieldsInfo(analysisFieldsResponse);

  return (
    <Tab.Container activeKey={props.tabKey} mountOnEnter transition={false}>
      <Tab.Content className="h-100">
        <Tab.Pane eventKey={OnyxTabKeys.USER} className="h-100">
          <User {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.SITE} className="h-100">
          <Site {...props} />
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.RECORDS} className="h-100">
          <Tab.Container activeKey={props.recordTabKey} transition={false}>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey={RecordTabKeys.LIST} className="h-100">
                <Results
                  {...props}
                  projectFields={projectFields}
                  projectDescription={projectDescription}
                  fieldDescriptions={fieldDescriptions}
                  title="Records"
                  searchPath={`projects/${props.project}`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={RecordTabKeys.DETAIL}
                className="h-100"
                unmountOnExit
              >
                <ProjectRecord
                  {...props}
                  projectFields={projectFields}
                  projectDescription={projectDescription}
                  fieldDescriptions={fieldDescriptions}
                  ID={props.recordID}
                  tabKey={props.recordDetailTabKey}
                  setTabKey={props.setRecordDetailTabKey}
                  dataPanelTabKey={props.recordDataPanelTabKey}
                  setDataPanelTabKey={props.setRecordDataPanelTabKey}
                  onHide={props.handleProjectRecordHide}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.ANALYSES} className="h-100">
          <Tab.Container activeKey={props.analysisTabKey} transition={false}>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey={AnalysisTabKeys.LIST} className="h-100">
                <Results
                  {...props}
                  projectFields={analysisFields}
                  projectDescription={projectDescription}
                  fieldDescriptions={analysisDescriptions}
                  title="Analyses"
                  searchPath={`projects/${props.project}/analysis`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisTabKeys.DETAIL}
                className="h-100"
                unmountOnExit
              >
                <Analysis
                  {...props}
                  projectFields={analysisFields}
                  projectDescription={projectDescription}
                  fieldDescriptions={analysisDescriptions}
                  ID={props.analysisID}
                  tabKey={props.analysisDetailTabKey}
                  setTabKey={props.setAnalysisDetailTabKey}
                  dataPanelTabKey={props.analysisDataPanelTabKey}
                  setDataPanelTabKey={props.setAnalysisDataPanelTabKey}
                  onHide={props.handleAnalysisHide}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Tab.Pane>
        <Tab.Pane eventKey={OnyxTabKeys.GRAPHS} className="h-100">
          <Graphs
            {...props}
            projectFields={projectFields}
            projectDescription={projectDescription}
            fieldDescriptions={fieldDescriptions}
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

  // Project state
  const [project, setProject] = useState<Project>();
  const [tabKey, setTabKey] = useState<string>(OnyxTabKeys.RECORDS);

  // Record tab state
  const [recordTabKey, setRecordTabKey] = useState<string>(RecordTabKeys.LIST);
  const [recordID, setRecordID] = useState("");
  const [recordDetailTabKey, setRecordDetailTabKey] = useState<string>(
    RecordDetailTabKeys.DATA
  );
  const [recordDataPanelTabKey, setRecordDataPanelTabKey] = useState<string>(
    DataPanelTabKeys.DETAILS
  );

  // Analysis tab state
  const [analysisTabKey, setAnalysisTabKey] = useState<string>(
    AnalysisTabKeys.LIST
  );
  const [analysisID, setAnalysisID] = useState("");
  const [analysisDetailTabKey, setAnalysisDetailTabKey] = useState<string>(
    AnalysisDetailTabKeys.DATA
  );
  const [analysisDataPanelTabKey, setAnalysisDataPanelTabKey] =
    useState<string>(DataPanelTabKeys.DETAILS);

  // Clear parameters when project changes
  const handleProjectChange = (project: Project) => {
    setTabKey(OnyxTabKeys.RECORDS);
    setRecordTabKey(RecordTabKeys.LIST);
    setAnalysisTabKey(AnalysisTabKeys.LIST);
    setRecordID("");
    setAnalysisID("");
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
      .map((projectPermission: ProjectPermissionType) => ({
        code: projectPermission.project,
        name: projectPermission.name,
      }))
      .sort() as Project[];
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
    setTabKey(OnyxTabKeys.RECORDS);
    setRecordTabKey(RecordTabKeys.DETAIL);
    setRecordDetailTabKey(RecordDetailTabKeys.DATA);
    setRecordDataPanelTabKey(DataPanelTabKeys.DETAILS);
    setRecordID(climbID);
  }, []);

  const handleProjectRecordHide = useCallback(() => {
    setRecordTabKey(RecordTabKeys.LIST);
  }, []);

  const handleAnalysisShow = useCallback((analysisID: string) => {
    setTabKey(OnyxTabKeys.ANALYSES);
    setAnalysisTabKey(AnalysisTabKeys.DETAIL);
    setAnalysisDetailTabKey(AnalysisDetailTabKeys.DATA);
    setAnalysisDataPanelTabKey(DataPanelTabKeys.DETAILS);
    setAnalysisID(analysisID);
  }, []);

  const handleAnalysisHide = useCallback(() => {
    setAnalysisTabKey(AnalysisTabKeys.LIST);
  }, []);

  return (
    <div className="Onyx h-100">
      <Header
        {...props}
        project={project?.code || ""}
        projectObj={project}
        projectList={projects}
        handleProjectChange={handleProjectChange}
        tabKey={tabKey}
        setTabKey={setTabKey}
        darkMode={darkMode}
        handleThemeChange={handleThemeChange}
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
                      typeLookups={typeLookups}
                      lookupDescriptions={lookupDescriptions}
                      project={p.code}
                      tabKey={tabKey}
                      recordTabKey={recordTabKey}
                      analysisTabKey={analysisTabKey}
                      recordID={recordID}
                      analysisID={analysisID}
                      handleProjectRecordShow={handleProjectRecordShow}
                      handleAnalysisShow={handleAnalysisShow}
                      handleProjectRecordHide={handleProjectRecordHide}
                      handleAnalysisHide={handleAnalysisHide}
                      recordDetailTabKey={recordDetailTabKey}
                      setRecordDetailTabKey={setRecordDetailTabKey}
                      recordDataPanelTabKey={recordDataPanelTabKey}
                      setRecordDataPanelTabKey={setRecordDataPanelTabKey}
                      analysisDetailTabKey={analysisDetailTabKey}
                      setAnalysisDetailTabKey={setAnalysisDetailTabKey}
                      analysisDataPanelTabKey={analysisDataPanelTabKey}
                      setAnalysisDataPanelTabKey={setAnalysisDataPanelTabKey}
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
