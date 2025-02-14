import { useState } from "react";
import {
  JsonData,
  JsonEditor,
  githubDarkTheme,
  githubLightTheme,
} from "json-edit-react";
import { Input } from "../components/Inputs";
import { PageProps } from "../interfaces";

interface JsonProps extends PageProps {
  data: JsonData;
}

function JsonSearch(props: JsonProps) {
  const [jsonSearch, setJsonSearch] = useState("");

  return (
    <>
      <Input
        value={jsonSearch}
        onChange={(e) => setJsonSearch(e.target.value)}
        placeholder="Enter key/value..."
      />
      <JsonEditor
        data={props.data}
        theme={props.darkMode ? githubDarkTheme : githubLightTheme}
        restrictAdd
        restrictEdit
        restrictDelete
        searchFilter="all"
        searchText={jsonSearch}
      />
    </>
  );
}

export { JsonSearch };
