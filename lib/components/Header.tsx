import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

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
        <code className="text-success">{`v${version}`}</code>
      ) : (
        <span className="text-light">None</span>
      )}
    </Navbar.Text>
  );
}

function Header({
  profile,
  projectName,
  projectDescription,
  projectList,
  handleProjectChange,
  handleThemeChange,
  guiVersion,
  extVersion,
}: {
  profile: { username: string; site: string };
  projectName: string;
  projectDescription: string;
  projectList: string[];
  handleProjectChange: (p: string) => void;
  handleThemeChange: () => void;
  guiVersion?: string;
  extVersion?: string;
}) {
  return (
    <Navbar bg="dark" variant="dark" collapseOnSelect expand="lg">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Stack direction="horizontal" gap={3}>
            <NavDropdown
              title={<HeaderText label="Project" value={projectName} />}
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
            <HeaderText label="Description" value={projectDescription} />
            <HeaderText label="User" value={profile.username} />
            <HeaderText label="Site" value={profile.site} />
            <HeaderVersion label="GUI" version={guiVersion} />
            <HeaderVersion label="Extension" version={extVersion} />
          </Stack>
        </Navbar.Collapse>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Form.Check
          type="switch"
          id="theme-switch"
          label={<span className="text-light">Switch Theme</span>}
          onChange={handleThemeChange}
        />
      </Container>
    </Navbar>
  );
}

export default Header;
