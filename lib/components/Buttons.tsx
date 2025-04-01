import Button, { ButtonProps } from "react-bootstrap/Button";
import { MdContentCopy } from "react-icons/md";
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";

interface SidebarButtonProps extends ButtonProps {
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

function CopyToClipboardButton(props: ButtonProps) {
  return (
    <Button
      size="sm"
      variant="dark"
      title="Copy to Clipboard"
      onClick={() =>
        navigator.clipboard.writeText(props.children?.toString() || "")
      }
    >
      <MdContentCopy />
    </Button>
  );
}

export { CopyToClipboardButton, SidebarButton };
