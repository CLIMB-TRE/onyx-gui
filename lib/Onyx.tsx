import { useState, useEffect } from "react";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Header from "./components/Header";
import Data from "./pages/Data";
import Stats from "./pages/Stats";
import { OnyxProps, ProjectField } from "./types";

import "./Onyx.css";
import "./bootstrap.css";

const VERSION = "0.11.2";

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
  const [darkMode, setDarkMode] = useState(false);
  const [project, setProject] = useState("");
  const [tabKey, setTabKey] = useState("data");

  // Set the theme based on darkMode state
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Fetch the project list
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/")
        .then((response) => response.json())
        .then((data) => {
          return [
            ...new Set(
              data.data.map((project: { project: string }) => project.project)
            ),
          ] as string[];
        });
    },
  });

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects) {
      setProject(projects[0]);
    }
  }, [project, projects]);

  // Fetch types and their lookups
  const { data: typeLookups = new Map<string, string[]>() } = useQuery({
    queryKey: ["types"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/types/")
        .then((response) => response.json())
        .then((data) => {
          return new Map(
            data.data.map((type: { type: string; lookups: string[] }) => [
              type.type,
              type.lookups,
            ])
          ) as Map<string, string[]>;
        });
    },
  });

  // Fetch lookup descriptions
  const { data: lookupDescriptions = new Map<string, string>() } = useQuery({
    queryKey: ["lookups"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/lookups/")
        .then((response) => response.json())
        .then((data) => {
          return new Map(
            data.data.map((lookup: { lookup: string; description: string }) => [
              lookup.lookup,
              lookup.description,
            ])
          ) as Map<string, string>;
        });
    },
  });

  // Fetch project information
  const {
    isFetching: projectInfoPending,
    data: { projectName, projectFields, fieldDescriptions } = {
      projectName: "",
      projectFields: new Map<string, ProjectField>(),
      fieldDescriptions: new Map<string, string>(),
    },
  } = useQuery({
    queryKey: ["fields", project],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${project}/fields/`)
        .then((response) => response.json())
        .then((data) => {
          const fields = flattenFields(data.data.fields);
          const projectName = data.data.name;
          const projectFields = new Map(
            Object.keys(fields).map((field) => [
              field,
              {
                type: fields[field].type,
                description: fields[field].description,
                actions: fields[field].actions,
                values: fields[field].values,
              },
            ])
          );
          const fieldDescriptions = new Map(
            Array.from(projectFields.entries()).map(([field, options]) => [
              field,
              options.description,
            ])
          );
          return { projectName, projectFields, fieldDescriptions };
        });
    },
    enabled: !!project,
  });

  return (
    <Stack gap={2} className="Onyx">
      <Header
        {...props}
        projectName={projectInfoPending ? "Loading..." : projectName}
        projectList={projects}
        handleProjectChange={setProject}
        guiVersion={VERSION}
        tabKey={tabKey}
        setTabKey={setTabKey}
        darkMode={darkMode}
        handleThemeChange={() => setDarkMode(!darkMode)}
      />
      <Tab.Container activeKey={tabKey}>
        <Tab.Content>
          <Tab.Pane eventKey="data">
            <Data
              {...props}
              project={project}
              projectFields={projectFields}
              typeLookups={typeLookups}
              fieldDescriptions={fieldDescriptions}
              lookupDescriptions={lookupDescriptions}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="stats">
            <Stats
              {...props}
              project={project}
              projectFields={projectFields}
              darkMode={darkMode}
            />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
      <div></div>
    </Stack>
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
