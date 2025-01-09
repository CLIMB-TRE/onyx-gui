import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useTypesQuery,
  useLookupsQuery,
  useProjectPermissionsQuery,
  useProjectFieldsQuery,
} from "./api";
import Header from "./components/Header";
import User from "./pages/User";
import Site from "./pages/Site";
import Data from "./pages/Data";
import Stats from "./pages/Stats";
import Analysis from "./pages/Analysis";
import RecordModal from "./components/RecordModal";
import AnalysisModal from "./components/AnalysisModal";
import { ProjectField, ProjectPermissionType } from "./types";
import { OnyxProps } from "./interfaces";

import "./Onyx.css";
import "./bootstrap.css";

const VERSION = "0.13.0";

function flattenFields(fields: Record<string, ProjectField>) {
  const flatFields: Record<string, ProjectField> = {};

  // Loop over object and flatten nested fields
  const flatten = (obj: Record<string, ProjectField>, prefix = "") => {
    for (const [field, fieldInfo] of Object.entries(obj)) {
      flatFields[prefix + field] = fieldInfo;
      if (fieldInfo.type === "relation") {
        flatten(
          fieldInfo.fields as Record<string, ProjectField>,
          prefix + field + "__"
        );
      }
    }
  };

  flatten(fields);
  return flatFields;
}

function App(props: OnyxProps) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("onyx-theme") === "dark"
  );
  const [project, setProject] = useState("");
  const [tabKey, setTabKey] = useState("data");
  const [modalState, setModalState] = useState<
    "record-modal" | "analysis-modal" | "closed"
  >("closed");
  const [recordModalID, setRecordModalID] = useState("");
  const [analysisModalID, setAnalysisModalID] = useState("");

  // Set the theme based on darkMode state
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setModalState("closed");
    setRecordModalID("");
    setAnalysisModalID("");
  }, [project]);

  const handleThemeChange = () => {
    const darkModeChange = !darkMode;
    setDarkMode(darkModeChange);
    localStorage.setItem("onyx-theme", darkModeChange ? "dark" : "light");
  };

  const pageProps = useMemo(
    () => ({
      ...props,
      project,
    }),
    [props, project]
  );

  // Query for types, lookups and project permissions
  const { data: typesResponse } = useTypesQuery(props);
  const { data: lookupsResponse } = useLookupsQuery(props);
  const { data: userProjectPermissionsResponse } =
    useProjectPermissionsQuery(props);
  const {
    isFetching: projectFieldsPending,
    error: projectFieldsError,
    data: projectFieldsResponse,
  } = useProjectFieldsQuery(pageProps);

  // Get a map of types to their lookups
  const typeLookups = useMemo(() => {
    if (typesResponse?.status !== "success") return new Map<string, string[]>();
    return new Map<string, string[]>(
      typesResponse.data.map((type: { type: string; lookups: string[] }) => [
        type.type,
        type.lookups,
      ])
    );
  }, [typesResponse]);

  // Get a map of lookups to their descriptions
  const lookupDescriptions = useMemo(() => {
    if (lookupsResponse?.status !== "success") return new Map<string, string>();
    return new Map<string, string>(
      lookupsResponse.data.map(
        (lookup: { lookup: string; description: string }) => [
          lookup.lookup,
          lookup.description,
        ]
      )
    );
  }, [lookupsResponse]);

  // Get the list of projects
  const projects = useMemo(() => {
    if (userProjectPermissionsResponse?.status !== "success") return [];
    return userProjectPermissionsResponse.data.map(
      (projectPermission: ProjectPermissionType) => projectPermission.project
    );
  }, [userProjectPermissionsResponse]);

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects.length > 0) {
      setProject(projects[0]);
    }
  }, [project, projects]);

  // Get project information:
  // projectFields: A map of field names to their type, description, actions, values and nested fields
  // fieldDescriptions: A map of field names to their descriptions
  const { projectFields, fieldDescriptions } = useMemo(() => {
    if (projectFieldsResponse?.status !== "success") {
      return {
        projectFields: new Map<string, ProjectField>(),
        fieldDescriptions: new Map<string, string>(),
      };
    }
    const projectFields = new Map(
      Object.entries(flattenFields(projectFieldsResponse.data.fields))
    );
    const fieldDescriptions = new Map(
      Array.from(projectFields, ([field, options]) => [
        field,
        options.description,
      ])
    );
    return { projectFields, fieldDescriptions };
  }, [projectFieldsResponse]);

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleRecordModalShow = useCallback((climbID: string) => {
    setModalState("record-modal");
    setRecordModalID(climbID);
  }, []);

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleAnalysisModalShow = useCallback((analysisID: string) => {
    setModalState("analysis-modal");
    setAnalysisModalID(analysisID);
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
            : projectFieldsResponse.data.name
        }
        projectList={projects}
        handleProjectChange={setProject}
        guiVersion={VERSION}
        tabKey={tabKey}
        setTabKey={setTabKey}
        darkMode={darkMode}
        handleThemeChange={handleThemeChange}
      />
      <RecordModal
        {...props}
        project={project}
        projectFields={projectFields}
        typeLookups={typeLookups}
        fieldDescriptions={fieldDescriptions}
        lookupDescriptions={lookupDescriptions}
        handleRecordModalShow={handleRecordModalShow}
        handleAnalysisModalShow={handleAnalysisModalShow}
        recordID={recordModalID}
        show={modalState === "record-modal"}
        onHide={() => setModalState("closed")}
      />
      <AnalysisModal
        {...props}
        project={project}
        projectFields={projectFields}
        typeLookups={typeLookups}
        fieldDescriptions={fieldDescriptions}
        lookupDescriptions={lookupDescriptions}
        handleRecordModalShow={handleRecordModalShow}
        handleAnalysisModalShow={handleAnalysisModalShow}
        analysisID={analysisModalID}
        show={modalState === "analysis-modal"}
        onHide={() => setModalState("closed")}
      />
      <div className="h-100" style={{ paddingTop: "60px" }}>
        <Container fluid className="h-100 px-0 py-1">
          <Tab.Container activeKey={tabKey} mountOnEnter>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey="user" className="h-100">
                <User {...props} project={project} />
              </Tab.Pane>
              <Tab.Pane eventKey="site" className="h-100">
                <Site {...props} project={project} />
              </Tab.Pane>
              <Tab.Pane eventKey="data" className="h-100">
                <Data
                  {...props}
                  project={project}
                  projectFields={projectFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleRecordModalShow={handleRecordModalShow}
                  handleAnalysisModalShow={handleAnalysisModalShow}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analyses" className="h-100">
                <Analysis
                  {...props}
                  project={project}
                  projectFields={projectFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleRecordModalShow={handleRecordModalShow}
                  handleAnalysisModalShow={handleAnalysisModalShow}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="stats" className="h-100">
                <Stats
                  {...props}
                  project={project}
                  projectFields={projectFields}
                  fieldDescriptions={fieldDescriptions}
                  darkMode={darkMode}
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
