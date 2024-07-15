import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useQuery } from "@tanstack/react-query";

function HeaderText({ label, value }: { label: string; value: string }) {
  return (
    <Navbar.Text>
      {label}: <span className="text-light">{value || "None"}</span>
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

interface HeaderProps {
  httpPathHandler: (path: string) => Promise<Response>;
  projectName: string;
  projectList: string[];
  handleProjectChange: (p: string) => void;
  guiVersion?: string;
  extVersion?: string;
  tabKey: string;
  setTabKey: (k: string) => void;
  darkMode: boolean;
  handleThemeChange: () => void;
}

function Header(props: HeaderProps) {
  // Fetch user profile
  const { data: { username, site } = { username: "", site: "" } } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return props
        .httpPathHandler("accounts/profile/")
        .then((response) => response.json())
        .then((data) => {
          return { username: data.data.username, site: data.data.site };
        });
    },
  });

  return (
    <Navbar bg="dark" variant="dark" collapseOnSelect expand="sm">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Stack direction="horizontal" gap={3}>
            <NavDropdown
              title={<HeaderText label="Project" value={props.projectName} />}
              id="collapsible-nav-dropdown"
              style={{ color: "white" }}
            >
              {props.projectList.map((p) => (
                <NavDropdown.Item
                  key={p}
                  onClick={() => props.handleProjectChange(p)}
                >
                  {p}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
            <HeaderText label="User" value={username} />
            <HeaderText label="Site" value={site} />
            <HeaderVersion label="GUI" version={props.guiVersion} />
            <HeaderVersion label="Extension" version={props.extVersion} />
          </Stack>
        </Navbar.Collapse>
        <Stack direction="horizontal" gap={3}>
          <Tab.Container
            activeKey={props.tabKey}
            onSelect={(k) => props.setTabKey(k || "data")}
          >
            <Nav variant="underline">
              <Nav.Item>
                <Nav.Link eventKey="data">Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stats">Statistics</Nav.Link>
              </Nav.Item>
            </Nav>
          </Tab.Container>
          <Form.Check
            type="switch"
            id="theme-switch"
            label={<span className="text-light">Switch Theme</span>}
            checked={props.darkMode}
            onChange={props.handleThemeChange}
          />
        </Stack>
      </Container>
    </Navbar>
  );
}

export default Header;
