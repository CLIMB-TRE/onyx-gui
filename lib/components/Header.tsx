import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useQuery } from "@tanstack/react-query";

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

function HeaderText({ label, value }: { label: string; value: string }) {
  return (
    <Navbar.Text>
      {label}:{" "}
      <span style={{ color: "var(--bs-pink)" }}>{value || "None"}</span>
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
        <code style={{ color: "var(--bs-pink)" }}>{`v${version}`}</code>
      ) : (
        "None"
      )}
    </Navbar.Text>
  );
}

function Header(props: HeaderProps) {
  // Fetch user profile
  const {
    isFetching: profilePending,
    data: { username, site } = { username: "", site: "" },
  } = useQuery({
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
    <Navbar
      style={{ backgroundColor: "var(--bs-black)" }}
      variant="dark"
      collapseOnSelect
      expand="lg"
      fixed="top"
    >
      <Container fluid>
        <Navbar.Brand style={{ color: "var(--bs-pink)" }}>⬗ Onyx</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav className="me-auto">
            <Nav style={{ maxHeight: "200px" }} navbarScroll>
              <Stack direction="horizontal" gap={2}>
                <NavDropdown
                  title={
                    <HeaderText label="Project" value={props.projectName} />
                  }
                  id="navbarScrollingDropdown"
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
                <div></div>
              </Stack>
            </Nav>
            <Nav>
              <Stack direction="horizontal" gap={3}>
                <HeaderText
                  label="User"
                  value={profilePending ? "Loading..." : username}
                />
                <HeaderText
                  label="Site"
                  value={profilePending ? "Loading..." : site}
                />
                <HeaderVersion label="GUI" version={props.guiVersion} />
                <HeaderVersion label="Extension" version={props.extVersion} />
              </Stack>
            </Nav>
          </Nav>
          <Tab.Container
            activeKey={props.tabKey}
            onSelect={(k) => props.setTabKey(k || "data")}
          >
            <Nav variant="underline">
              <Stack direction="horizontal" gap={3}>
                <Nav.Item>
                  <Nav.Link eventKey="data">Data</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="stats">Statistics</Nav.Link>
                </Nav.Item>
                <Form.Check
                  type="switch"
                  id="theme-switch"
                  label={
                    <span className="text-light">
                      {props.darkMode ? "☾" : "☼"}{" "}
                    </span>
                  }
                  title={`Switch to ${
                    props.darkMode ? "light mode" : "dark mode"
                  }`}
                  checked={props.darkMode}
                  onChange={props.handleThemeChange}
                />
              </Stack>
            </Nav>
          </Tab.Container>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
