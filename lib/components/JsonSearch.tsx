import {
  JsonData,
  JsonEditor,
  githubDarkTheme,
  githubLightTheme,
} from "json-edit-react";
import { useState } from "react";
import Stack from "react-bootstrap/Stack";
import { Input } from "./Inputs";
import { ProjectProps } from "../interfaces";

interface JsonProps extends ProjectProps {
  data: JsonData;
  description: string;
}

function JsonSearch(props: JsonProps) {
  const [jsonSearch, setJsonSearch] = useState("");

  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2}>
        <span className="me-auto text-muted">{props.description}</span>
        <div style={{ width: "300px" }}>
          <Input
            value={jsonSearch}
            onChange={(e) => setJsonSearch(e.target.value)}
            placeholder="Enter key/value..."
          />
        </div>
      </Stack>
      <JsonEditor
        data={props.data}
        theme={
          props.darkMode
            ? [
                githubDarkTheme,
                {
                  container: {
                    backgroundColor: "var(--bs-body-bg)",
                  },
                },
              ]
            : githubLightTheme
        }
        restrictAdd
        restrictEdit
        restrictDelete
        searchFilter="all"
        searchText={jsonSearch}
      />
    </Stack>
  );
}

export default JsonSearch;
