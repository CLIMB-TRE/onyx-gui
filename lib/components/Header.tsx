import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Stack from "react-bootstrap/Stack";
import { MdDarkMode, MdJoinInner, MdLightMode } from "react-icons/md";
import { useProfileQuery } from "../api";
import { PageProps } from "../interfaces";
import { OnyxTabKeys, Profile, Project } from "../types";
import { TextQueryHandler } from "./QueryHandler";

interface HeaderProps extends PageProps {
  project?: Project;
  projects: Project[];
  handleThemeChange: () => void;
  handleProjectChange: (p: Project) => void;
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
        username: "",
        site: "",
        email: "",
      } as Profile;

    return data.data;
  }, [data]);

  const handleTabChange = (tabKey: string | null) => {
    if (
      props.tabState.tabKey === OnyxTabKeys.RECORDS &&
      tabKey === OnyxTabKeys.RECORDS
    )
      props.handleProjectRecordHide();

    if (
      props.tabState.tabKey === OnyxTabKeys.ANALYSES &&
      tabKey === OnyxTabKeys.ANALYSES
    )
      props.handleAnalysisHide();

    props.setTabState((prevState) => ({
      ...prevState,
      tabKey: tabKey as OnyxTabKeys,
    }));
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
          onClick={props.handleProjectRecordHide}
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
                  value={props.project?.name || "Not Found"}
                />
              }
              style={{ color: "white" }}
            >
              <NavDropdown.Header>Projects</NavDropdown.Header>
              {props.projects.map((p) => (
                <NavDropdown.Item
                  key={p.code}
                  onClick={() => props.handleProjectChange(p)}
                >
                  {p.name}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
            <Nav
              variant="underline"
              activeKey={props.project ? props.tabState.tabKey : undefined}
            >
              <Stack direction="horizontal" gap={3}>
                <Nav.Link
                  eventKey={OnyxTabKeys.USER}
                  className="fw-normal"
                  disabled={!props.project}
                >
                  <HeaderText
                    label="User"
                    value={
                      <TextQueryHandler isFetching={isFetching} error={error}>
                        {profile.username}
                      </TextQueryHandler>
                    }
                  />
                </Nav.Link>
                <Nav.Link
                  eventKey={OnyxTabKeys.SITE}
                  className="fw-normal"
                  disabled={!props.project}
                >
                  <HeaderText
                    label="Site"
                    value={
                      <TextQueryHandler isFetching={isFetching} error={error}>
                        {profile.site}
                      </TextQueryHandler>
                    }
                  />
                </Nav.Link>
                <Nav.Link disabled className="fw-normal">
                  <HeaderVersion label="Version" version={props.extVersion} />
                </Nav.Link>
              </Stack>
            </Nav>
          </Nav>
          <Nav
            variant="underline"
            activeKey={props.project ? props.tabState.tabKey : undefined}
          >
            <Stack direction="horizontal" gap={3}>
              <Nav.Link
                eventKey={OnyxTabKeys.RECORDS}
                className="fw-normal"
                disabled={!props.project}
              >
                Records
              </Nav.Link>
              <Nav.Link
                eventKey={OnyxTabKeys.ANALYSES}
                className="fw-normal"
                disabled={!props.project}
              >
                Analyses
              </Nav.Link>
              <Nav.Link
                eventKey={OnyxTabKeys.GRAPHS}
                className="fw-normal"
                disabled={!props.project}
              >
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
