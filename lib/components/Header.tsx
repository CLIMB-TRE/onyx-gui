import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import { Input } from "./Inputs";

function HeaderText({ label, value }: { label: string; value: string }) {
  return (
    <Navbar.Text>
      {label}: <span className="text-light">{value ? value : "None"}</span>
    </Navbar.Text>
  );
}

function HeaderVersion({
  label,
  version,
}: {
  label: string;
  version?: string;
}) {
  return (
    <Navbar.Text>
      {label}:{" "}
      {version ? (
        <code className="text-success">{version}</code>
      ) : (
        <span className="text-light">None</span>
      )}
    </Navbar.Text>
  );
}

function Header({
  profile,
  project,
  projectList,
  searchInput,
  handleProjectChange,
  handleSearchInputChange,
  handleSearch,
  handleThemeChange,
  guiVersion,
  extVersion,
}: {
  profile: { username: string; site: string };
  project: string;
  projectList: string[];
  searchInput: string;
  handleProjectChange: (p: string) => void;
  handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement>;
  handleSearch: () => void;
  handleThemeChange: () => void;
  guiVersion?: string;
  extVersion?: string;
}) {
  return (
    <Navbar bg="dark" variant="dark" collapseOnSelect expand="lg">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav>
            <Stack direction="horizontal" gap={3}>
              <NavDropdown
                title={<HeaderText label="Project" value={project} />}
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
              <HeaderText label="User" value={profile.username} />
              <HeaderText label="Site" value={profile.site} />
              <HeaderVersion label="GUI Version" version={guiVersion} />
              <HeaderVersion label="Extension Version" version={extVersion} />
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
