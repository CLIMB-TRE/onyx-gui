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
  profile,
  project,
  projectList,
  searchInput,
  handleProjectChange,
  handleSearchInputChange,
  handleSearch,
  handleThemeChange,
}: {
  profile: { username: string; site: string };
  project: string;
  projectList: string[];
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
            <Stack direction="horizontal" gap={3}>
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
                {projectList.map((p) => (
                  <NavDropdown.Item
                    key={p}
                    onClick={() => handleProjectChange(p)}
                  >
                    {p}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <Navbar.Text>
                User:{" "}
                <span className="text-light">
                  {profile.username ? profile.username : "None"}
                </span>
              </Navbar.Text>
              <Navbar.Text>
                Site:{" "}
                <span className="text-light">
                  {profile.site ? profile.site : "None"}
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
