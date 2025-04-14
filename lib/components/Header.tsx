import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import { MdDarkMode, MdJoinInner, MdLightMode } from "react-icons/md";
import { useProfileQuery } from "../api";
import { PageProps } from "../interfaces";

interface HeaderProps extends PageProps {
  projectName: string;
  projectList: string[];
  handleProjectChange: (p: string) => void;
  guiVersion?: string;
  extVersion?: string;
  tabKey: string;
  setTabKey: (k: string) => void;
  handleThemeChange: () => void;
  recordID: string;
  handleProjectRecordHide: () => void;
  analysisID: string;
  handleAnalysisHide: () => void;
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

  const handleTabChange = (eventKey: string | null) => {
    if (eventKey === "records" && props.recordID) {
      if (props.tabKey === "record") {
        props.handleProjectRecordHide();
      } else {
        props.setTabKey("record");
      }
    } else if (eventKey === "analyses" && props.analysisID) {
      if (props.tabKey === "analysis") {
        props.handleAnalysisHide();
      } else props.setTabKey("analysis");
    } else props.setTabKey(eventKey || "records");
  };

  return (
    <Navbar
      style={{
        backgroundColor: "#121212",
      }}
      className="border-bottom border-3 onyx-border"
      variant="dark"
      collapseOnSelect
      expand="lg"
      fixed="top"
    >
      <Container fluid>
        <Tab.Container activeKey={props.tabKey} onSelect={handleTabChange}>
          <Navbar.Brand
            title="Onyx | API for Pathogen Metadata"
            onClick={() => handleTabChange("records")}
            style={{ cursor: "pointer" }}
          >
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
                    eventKey="records"
                    className="fw-normal"
                    active={
                      props.tabKey == "records" || props.tabKey == "record"
                    }
                  >
                    Records
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
