import Button from "react-bootstrap/Button";
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";

interface SidebarButtonProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
}

function SidebarButton(props: SidebarButtonProps) {
  return (
    <Button
      size="sm"
      variant="dark"
      title={props.sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
      onClick={() => props.setSidebarCollapsed(!props.sidebarCollapsed)}
    >
      {props.sidebarCollapsed ? (
        <VscLayoutSidebarLeftOff />
      ) : (
        <VscLayoutSidebarLeft />
      )}
    </Button>
  );
}

export { SidebarButton };
