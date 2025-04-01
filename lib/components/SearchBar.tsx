import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";

interface SearchBarProps {
  placeholder: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
}

function SearchBar(props: SearchBarProps) {
  return (
    <Stack direction="horizontal" gap={2}>
      <Form.Control
        value={props.searchInput}
        placeholder={props.placeholder}
        onChange={(e) => props.setSearchInput(e.target.value)}
        onKeyUp={(event) => {
          if (event.key === "Enter") {
            props.handleSearch();
          }
        }}
      />
      <Button variant="primary" onClick={props.handleSearch}>
        Search
      </Button>
    </Stack>
  );
}

export default SearchBar;
