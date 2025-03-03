import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useProfileQuery } from "../api";
import { MdLightMode, MdDarkMode, MdJoinInner } from "react-icons/md";
import { PageProps } from "../interfaces";
import { useMemo } from "react";

interface HeaderProps extends PageProps {
  projectName: string;
  projectList: string[];
  handleProjectChange: (p: string) => void;
  guiVersion?: string;
  extVersion?: string;
  tabKey: string;
  setTabKey: (k: string) => void;
  handleThemeChange: () => void;
}

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
        <code style={{ color: "var(--bs-pink)" }}>{`v${version}`}</code>
      ) : (
        <span className="text-light">None</span>
      )}
    </Navbar.Text>
  );
}

function Header(props: HeaderProps) {
  const { isFetching, error, data } = useProfileQuery(props);

  // Get the user profile
  const profile = useMemo(() => {
    if (data?.status !== "success")
      return {
        username: "None",
        site: "None",
      };

    return {
      username: data.data.username,
      site: data.data.site,
    };
  }, [data]);

  return (
    <Navbar
      style={{
        backgroundColor: "#121212",
      }}
      className="border-bottom border-4 border-pink"
      variant="dark"
      collapseOnSelect
      expand="lg"
      fixed="top"
    >
      <Container fluid>
        <Tab.Container
          activeKey={props.tabKey}
          onSelect={(k) => props.setTabKey(k || "data")}
        >
          <Navbar.Brand>
            <MdJoinInner color="var(--bs-pink)" /> Onyx
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="header" />
          <Navbar.Collapse id="header">
            <Nav className="me-auto">
              <NavDropdown
                title={<HeaderText label="Project" value={props.projectName} />}
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
              <Nav variant="underline">
                <Stack direction="horizontal" gap={3}>
                  <Nav.Item>
                    <Nav.Link eventKey="user" className="fw-normal">
                      <HeaderText
                        label="User"
                        value={
                          isFetching
                            ? "Loading..."
                            : error
                            ? "Failed to load"
                            : profile.username
                        }
                      />
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="site" className="fw-normal">
                      <HeaderText
                        label="Site"
                        value={
                          isFetching
                            ? "Loading..."
                            : error
                            ? "Failed to load"
                            : profile.site
                        }
                      />
                    </Nav.Link>
                  </Nav.Item>
                  <HeaderVersion label="GUI" version={props.guiVersion} />
                  <HeaderVersion label="Extension" version={props.extVersion} />
                </Stack>
              </Nav>
            </Nav>
            <Nav variant="underline">
              <Stack direction="horizontal" gap={3}>
                <Nav.Item>
                  <Nav.Link
                    eventKey="data"
                    className="fw-normal"
                    active={props.tabKey == "data" || props.tabKey == "record"}
                  >
                    Data
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="analyses"
                    className="fw-normal"
                    active={
                      props.tabKey == "analyses" || props.tabKey == "analysis"
                    }
                  >
                    Analyses
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="graphs" className="fw-normal">
                    Graphs
                  </Nav.Link>
                </Nav.Item>
                <Form.Check
                  type="switch"
                  id="theme-switch"
                  label={
                    <span className="text-light">
                      {props.darkMode ? <MdDarkMode /> : <MdLightMode />}{" "}
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
          </Navbar.Collapse>
        </Tab.Container>
      </Container>
    </Navbar>
  );
}

export default Header;
