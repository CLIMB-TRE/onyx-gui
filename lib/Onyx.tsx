import { useState, useMemo, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Header from "./components/Header";
import User from "./pages/User";
import Site from "./pages/Site";
import Results from "./pages/Results";
import ProjectRecord from "./pages/ProjectRecord";
import Analysis from "./pages/Analysis";
import Graphs from "./pages/Graphs";
import { OnyxProps } from "./interfaces";
import {
  ProjectField,
  TypeObject,
  LookupObject,
  ProjectPermissionType,
  FieldsResponse,
  ErrorResponse,
} from "./types";
import {
  useTypesQuery,
  useLookupsQuery,
  useProjectPermissionsQuery,
  useProjectFieldsQuery,
  useAnalysisFieldsQuery,
} from "./api";

import "@fontsource/ibm-plex-sans";
import "./Onyx.css";
import "./bootstrap.css";

const VERSION = "0.13.0";

function flattenFields(fields: Record<string, ProjectField>) {
  const flatFields: Record<string, ProjectField> = {};

  // Loop over object and flatten nested fields
  const flatten = (obj: Record<string, ProjectField>, prefix = "") => {
    for (const [field, fieldInfo] of Object.entries(obj)) {
      flatFields[prefix + field] = fieldInfo;
      if (fieldInfo.type === "relation" && fieldInfo.fields) {
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

const useFieldsInfo = (fieldsResponse: FieldsResponse | ErrorResponse) => {
  return useMemo(() => {
    if (fieldsResponse?.status !== "success") {
      return {
        name: "None",
        fields: new Map<string, ProjectField>(),
        descriptions: new Map<string, string>(),
      };
    }

    // The name of the project
    const name = fieldsResponse.data.name;

    // A map of field names to their type, description, actions, values and nested fields
    const fields = new Map(
      Object.entries(flattenFields(fieldsResponse.data.fields))
    );

    // A map of field names to their descriptions
    const descriptions = new Map(
      Array.from(fields, ([field, options]) => [field, options.description])
    );
    return { name, fields, descriptions };
  }, [fieldsResponse]);
};

function App(props: OnyxProps) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("onyx-theme") === "dark"
  );
  const [project, setProject] = useState("");
  const [tabKey, setTabKey] = useState("data");
  const [recordID, setRecordID] = useState("");
  const [analysisID, setAnalysisID] = useState("");

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
    setTabKey("data");
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
    return projectPermissionsResponse.data.map(
      (projectPermission: ProjectPermissionType) => projectPermission.project
    );
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
    setRecordID(climbID);
  }, []);

  const handleAnalysisShow = useCallback((analysisID: string) => {
    setTabKey("analysis");
    setAnalysisID(analysisID);
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
        guiVersion={VERSION}
        tabKey={tabKey}
        setTabKey={setTabKey}
        darkMode={darkMode}
        handleThemeChange={handleThemeChange}
      />
      <div className="h-100" style={{ paddingTop: "60px" }}>
        <Container fluid className="h-100 px-0 py-2">
          <Tab.Container activeKey={tabKey} mountOnEnter>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey="user" className="h-100">
                <User {...props} project={project} darkMode={darkMode} />
              </Tab.Pane>
              <Tab.Pane eventKey="site" className="h-100">
                <Site {...props} project={project} darkMode={darkMode} />
              </Tab.Pane>
              <Tab.Pane eventKey="data" className="h-100">
                <Results
                  {...pageProps}
                  projectFields={projectFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  title="Data"
                  searchPath={`projects/${project}`}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="record" className="h-100" unmountOnExit>
                <ProjectRecord
                  {...pageProps}
                  projectFields={projectFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  recordID={recordID}
                  onHide={() => setTabKey("data")}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analyses" className="h-100">
                <Results
                  {...pageProps}
                  projectFields={analysisFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={analysisDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  title="Analyses"
                  searchPath={`projects/${project}/analysis`}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis" className="h-100" unmountOnExit>
                <Analysis
                  {...pageProps}
                  projectFields={analysisFields}
                  typeLookups={typeLookups}
                  fieldDescriptions={fieldDescriptions}
                  lookupDescriptions={lookupDescriptions}
                  handleProjectRecordShow={handleProjectRecordShow}
                  handleAnalysisShow={handleAnalysisShow}
                  analysisID={analysisID}
                  onHide={() => setTabKey("analyses")}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="graphs" className="h-100">
                <Graphs
                  {...pageProps}
                  projectFields={projectFields}
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
