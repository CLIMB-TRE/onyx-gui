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
import { OnyxTabKeys } from "../types";

interface HeaderProps extends PageProps {
  projectName: string;
  projectList: string[];
  handleProjectChange: (p: string) => void;
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
        <span className="onyx-text-pink font-monospace">{version}</span>
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
      className="border-bottom onyx-border"
      variant="dark"
      expand="lg"
      fixed="top"
    >
      <Container fluid>
        <Tab.Container
          activeKey={props.tabKey}
          onSelect={(k) => props.setTabKey(k || OnyxTabKeys.RECORDS)}
        >
          <Navbar.Brand
            title="Onyx | API for Pathogen Metadata"
            onClick={() => props.setTabKey(OnyxTabKeys.RECORDS)}
            style={{ cursor: "pointer" }}
          >
            <MdJoinInner color="var(--bs-pink)" /> Onyx
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
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
                  <Nav.Link eventKey={OnyxTabKeys.USER} className="fw-normal">
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
                  <Nav.Link eventKey={OnyxTabKeys.SITE} className="fw-normal">
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
                  <Nav.Link disabled className="fw-normal ">
                    <HeaderVersion label="Version" version={props.extVersion} />
                  </Nav.Link>
                </Stack>
              </Nav>
            </Nav>
            <Nav variant="underline">
              <Stack direction="horizontal" gap={3}>
                <Nav.Link eventKey={OnyxTabKeys.RECORDS} className="fw-normal">
                  Records
                </Nav.Link>
                <Nav.Link eventKey={OnyxTabKeys.ANALYSES} className="fw-normal">
                  Analyses
                </Nav.Link>
                <Nav.Link eventKey={OnyxTabKeys.GRAPHS} className="fw-normal">
                  Graphs
                </Nav.Link>
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
