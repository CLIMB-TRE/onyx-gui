import { useState, useEffect } from "react";
import Button, { ButtonProps } from "react-bootstrap/Button";
import { MdContentCopy } from "react-icons/md";
import { VscLayoutSidebarLeft, VscLayoutSidebarLeftOff } from "react-icons/vsc";

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
      variant="secondary"
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

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) props.onClick(e);
    else navigator.clipboard.writeText(props.children?.toString() || "");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Cleanup effect to reset copied state when component unmounts
  // https://stackoverflow.com/a/65007703
  useEffect(() => {
    return () => {
      setCopied(false);
    };
  }, []);

  return (
    <Button
      size="sm"
      variant="secondary"
      title={props.title || "Copy to Clipboard"}
      onClick={handleCopy}
    >
      <MdContentCopy />{" "}
      {copied ? "Copied!" : props.showTitle ? props.title : ""}
    </Button>
  );
}

export { CopyToClipboardButton, SidebarButton };
