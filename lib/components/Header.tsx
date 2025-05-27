import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Stack from "react-bootstrap/Stack";
import { MdDarkMode, MdJoinInner, MdLightMode } from "react-icons/md";
import { useProfileQuery } from "../api";
import { OnyxProps } from "../interfaces";
import { OnyxTabKeys, Project } from "../types";
import { TextQueryHandler } from "./QueryHandler";

interface HeaderProps extends OnyxProps {
  darkMode: boolean;
  handleThemeChange: () => void;
  project?: Project;
  projects: Project[];
  handleProjectChange: (p: Project) => void;
  tabKey: string;
  setTabKey: (k: string) => void;
  handleProjectRecordHide: () => void;
  handleAnalysisHide: () => void;
}

function HeaderText({
  label,
  value,
}: {
  label: string;
  value?: string | JSX.Element;
}) {
  return (
    <Navbar.Text>
      {label}: <span className="text-light">{value}</span>
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

  const handleTabChange = (eventKey: string | null) => {
    if (
      props.tabKey === OnyxTabKeys.RECORDS &&
      eventKey === OnyxTabKeys.RECORDS
    )
      props.handleProjectRecordHide();

    if (
      props.tabKey === OnyxTabKeys.ANALYSES &&
      eventKey === OnyxTabKeys.ANALYSES
    )
      props.handleAnalysisHide();

    props.setTabKey(eventKey || OnyxTabKeys.RECORDS);
  };

  return (
    <Navbar
      style={{
        backgroundColor: "#121212",
      }}
      className="border-bottom onyx-border"
      variant="dark"
      expand="lg"
      fixed="top"
      onSelect={handleTabChange}
    >
      <Container fluid>
        <Navbar.Brand
          title="Onyx | API for Pathogen Metadata"
          onClick={() => {
            props.setTabKey(OnyxTabKeys.RECORDS);
            props.handleProjectRecordHide();
          }}
          style={{ cursor: "pointer" }}
        >
          <MdJoinInner color="var(--bs-pink)" size={30} /> Onyx
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown
              title={
                <HeaderText
                  label="Project"
                  value={props.project?.name || "Not Selected"}
                />
              }
              style={{ color: "white" }}
            >
              {props.projects.map((p) => (
                <NavDropdown.Item
                  key={p.code}
                  onClick={() => props.handleProjectChange(p)}
                >
                  {p.name}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
            <Nav variant="underline" activeKey={props.tabKey}>
              <Stack direction="horizontal" gap={3}>
                <Nav.Link eventKey={OnyxTabKeys.USER} className="fw-normal">
                  <HeaderText
                    label="User"
                    value={
                      <TextQueryHandler
                        isFetching={isFetching}
                        error={error as Error}
                      >
                        {profile.username}
                      </TextQueryHandler>
                    }
                  />
                </Nav.Link>
                <Nav.Link eventKey={OnyxTabKeys.SITE} className="fw-normal">
                  <HeaderText
                    label="Site"
                    value={
                      <TextQueryHandler
                        isFetching={isFetching}
                        error={error as Error}
                      >
                        {profile.site}
                      </TextQueryHandler>
                    }
                  />
                </Nav.Link>
                <Nav.Link disabled className="fw-normal ">
                  <HeaderVersion label="Version" version={props.extVersion} />
                </Nav.Link>
              </Stack>
            </Nav>
          </Nav>
          <Nav variant="underline" activeKey={props.tabKey}>
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
      </Container>
    </Navbar>
  );
}

export default Header;
