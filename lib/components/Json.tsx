import { useState } from "react";
import {
  JsonData,
  JsonEditor,
  githubDarkTheme,
  githubLightTheme,
} from "json-edit-react";
import Stack from "react-bootstrap/Stack";
import { Input } from "../components/Inputs";
import { PageProps } from "../interfaces";

interface JsonProps extends PageProps {
  data: JsonData;
}

function JsonSearch(props: JsonProps) {
  const [jsonSearch, setJsonSearch] = useState("");

  return (
    <Stack gap={2}>
      <Input
        value={jsonSearch}
        onChange={(e) => setJsonSearch(e.target.value)}
        placeholder="Enter key/value..."
      />
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

export { JsonSearch };
