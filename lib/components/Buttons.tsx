import Button from "react-bootstrap/Button";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

interface SidebarButtonProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
}

function SidebarButton(props: SidebarButtonProps) {
  return (
    <Button
      size="sm"
      variant="dark"
      title={props.sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      onClick={() => props.setSidebarCollapsed(!props.sidebarCollapsed)}
    >
      {props.sidebarCollapsed ? (
        <MdKeyboardDoubleArrowRight />
      ) : (
        <MdKeyboardDoubleArrowLeft />
      )}
    </Button>
  );
}

export { SidebarButton };
