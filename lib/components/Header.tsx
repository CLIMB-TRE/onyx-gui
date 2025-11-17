import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Stack from "react-bootstrap/Stack";
import {
  MdDarkMode,
  MdJoinInner,
  MdLightMode,
  MdHistory,
  MdArrowBackIosNew,
  MdArrowForwardIos,
} from "react-icons/md";
import { useProfileQuery } from "../api";
import { PageProps } from "../interfaces";
import {
  DarkModeColour,
  Navigation,
  ObjectType,
  OnyxTabKey,
  Profile,
  Project,
  RecentlyViewed,
  Theme,
} from "../types";
import { formatTimeAgo } from "../utils/functions";
import { TextQueryHandler } from "./QueryHandler";
import { Button } from "react-bootstrap";

interface HeaderProps extends PageProps {
  handleThemeChange: () => void;
  project?: Project;
  projects: Project[];
  handleProjectChange: (p: Project) => void;
  navigation: Navigation;
  handleNavigateBack: () => void;
  handleNavigateForward: () => void;
  recentlyViewed: RecentlyViewed[];
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

  const handleTabChange = (tabKey: OnyxTabKey) => {
    if (
      props.tabState.tabKey === OnyxTabKey.RECORDS &&
      tabKey === OnyxTabKey.RECORDS
    )
      props.handleObjectHide(ObjectType.RECORD);
    else if (
      props.tabState.tabKey === OnyxTabKey.ANALYSES &&
      tabKey === OnyxTabKey.ANALYSES
    )
      props.handleObjectHide(ObjectType.ANALYSIS);
    else props.handleTabChange({ ...props.tabState, tabKey: tabKey });
  };

  const canNavigateBack = props.navigation.index > 0;
  const canNavigateForward =
    props.navigation.index < props.navigation.history.length - 1;

  return (
    <Navbar
      style={{
        backgroundColor: DarkModeColour.BS_BODY_BG,
      }}
      className="border-bottom onyx-border"
      variant="dark"
      expand="lg"
      onSelect={(e) => {
        if (e) handleTabChange(e as OnyxTabKey);
      }}
    >
      <Container fluid>
        <Navbar.Brand
          title="Onyx | API for Pathogen Metadata"
          onClick={() => props.handleObjectHide(ObjectType.RECORD)}
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
                  eventKey={OnyxTabKey.USER}
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
                  eventKey={OnyxTabKey.SITE}
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
              <Button
                className="onyx-transparent-button"
                size="sm"
                title="Go Back in Navigation"
                onClick={props.handleNavigateBack}
                disabled={!canNavigateBack}
              >
                <MdArrowBackIosNew />
              </Button>
              <Button
                className="onyx-transparent-button"
                size="sm"
                title="Go Forward in Navigation"
                onClick={props.handleNavigateForward}
                disabled={!canNavigateForward}
              >
                <MdArrowForwardIos />
              </Button>
              <Nav.Link
                eventKey={OnyxTabKey.RECORDS}
                className="fw-normal"
                disabled={!props.project}
              >
                Records
              </Nav.Link>
              <Nav.Link
                eventKey={OnyxTabKey.ANALYSES}
                className="fw-normal"
                disabled={!props.project}
              >
                Analyses
              </Nav.Link>
              <Nav.Link
                eventKey={OnyxTabKey.GRAPHS}
                className="fw-normal"
                disabled={!props.project}
              >
                Graphs
              </Nav.Link>
              {!props.extTheme && (
                <Form.Check
                  type="switch"
                  id="theme-switch"
                  label={
                    <span className="text-light">
                      {props.theme === Theme.DARK ? (
                        <MdDarkMode />
                      ) : (
                        <MdLightMode />
                      )}{" "}
                    </span>
                  }
                  title={`Switch to ${
                    props.theme === Theme.DARK ? "Light Mode" : "Dark Mode"
                  }`}
                  checked={props.theme === Theme.DARK}
                  onChange={props.handleThemeChange}
                />
              )}
              <Dropdown>
                <Dropdown.Toggle
                  id="recently-viewed-dropdown"
                  size="sm"
                  title="Recently Viewed"
                >
                  <MdHistory />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Header>Recently Viewed</Dropdown.Header>
                  {props.recentlyViewed.map((item) => (
                    <Dropdown.Item
                      key={item.ID}
                      title={item.ID + " - " + item.timestamp.toLocaleString()}
                      onClick={() =>
                        props.handleObjectShow(item.objectType, item.ID)
                      }
                    >
                      {item.ID} -{" "}
                      <span className="text-muted">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Stack>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
