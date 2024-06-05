import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import { Input } from "./Inputs";

import VERSION from "../version";

function Header({
  username,
  project,
  projectOptions,
  searchInput,
  handleProjectChange,
  handleSearchInputChange,
  handleSearch,
  handleThemeChange,
}: {
  username: string;
  project: string;
  projectOptions: string[];
  searchInput: string;
  handleProjectChange: (p: string) => void;
  handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement>;
  handleSearch: () => void;
  handleThemeChange: () => void;
}) {
  return (
    <Navbar bg="dark" variant="dark" collapseOnSelect expand="lg">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav>
            <Stack direction="horizontal" gap={2}>
              <NavDropdown
                title={
                  <Navbar.Text>
                    Project:{" "}
                    <span className="text-light">
                      {project ? project : "None"}
                    </span>
                  </Navbar.Text>
                }
                id="collapsible-nav-dropdown"
              >
                {projectOptions.map((p) => (
                  <NavDropdown.Item
                    key={p}
                    onClick={() => handleProjectChange(p)}
                  >
                    {p}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <Navbar.Text>
                Signed in as:{" "}
                <span className="text-light">
                  {username ? username : "None"}
                </span>
              </Navbar.Text>
              <Navbar.Text>
                Version: <span className="text-light">{VERSION}</span>
              </Navbar.Text>
            </Stack>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Stack direction="horizontal" gap={1}>
          <Form.Check
            type="switch"
            id="theme-switch"
            onChange={handleThemeChange}
          />
          <Input
            type="text"
            value={searchInput}
            placeholder="Search records..."
            onChange={handleSearchInputChange}
          />
          <Button
            variant="primary"
            disabled={!project}
            onClick={() => handleSearch()}
          >
            Search
          </Button>
        </Stack>
      </Container>
    </Navbar>
  );
}

export default Header;
