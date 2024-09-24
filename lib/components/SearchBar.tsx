import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { DataProps } from "../interfaces";

interface SearchBarProps extends DataProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
}

function SearchBar(props: SearchBarProps) {
  return (
    <Stack direction="horizontal" gap={2}>
      <Form.Control
        value={props.searchInput}
        placeholder="Search records..."
        onChange={(e) => props.setSearchInput(e.target.value)}
        onKeyUp={(event) => {
          if (event.key === "Enter") {
            props.handleSearch();
          }
        }}
      />
      <Button
        variant="primary"
        disabled={!props.project}
        onClick={props.handleSearch}
      >
        Search
      </Button>
    </Stack>
  );
}

export default SearchBar;
