import { useState } from "react";
import Button, { ButtonProps } from "react-bootstrap/Button";
import { MdContentCopy } from "react-icons/md";
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";
import { useIsMounted } from "../utils/hooks";

interface SidebarButtonProps extends ButtonProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
}

interface CopyToClipboardButtonProps extends ButtonProps {
  showTitle?: boolean;
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

function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const isMounted = useIsMounted();

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) props.onClick(e);
    else navigator.clipboard.writeText(props.children?.toString() || "");
    setCopied(true);
    setTimeout(() => {
      if (isMounted.current) setCopied(false);
    }, 2000);
  };

  return (
    <Button
      size="sm"
      variant="dark"
      title={props.title || "Copy to Clipboard"}
      onClick={handleCopy}
    >
      <MdContentCopy />{" "}
      {copied ? "Copied!" : props.showTitle ? props.title : ""}
    </Button>
  );
}

export { CopyToClipboardButton, SidebarButton };
