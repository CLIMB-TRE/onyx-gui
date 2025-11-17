import { useCallback, useEffect, useRef, useState } from "react";

interface ResizerProps {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  children?: React.ReactNode;
}

export default function Resizer(props: ResizerProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(props.defaultWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the sidebar container (parent of the resizer)
      const sidebarContainer = resizerRef.current?.parentElement;
      if (!sidebarContainer) return;

      const containerRect = sidebarContainer.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= props.minWidth && newWidth <= props.maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, props]
  );

  // Reset to default width
  const handleDoubleClick = () => setWidth(props.defaultWidth);

  // Add/remove event listeners when user starts/stops resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    // Cleanup function runs when component unmounts or dependencies change
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove]);

  return (
    <div
      className="h-100"
      style={{
        position: "relative",
        flexBasis: width,
        minWidth: props.minWidth,
        maxWidth: props.maxWidth,
      }}
    >
      {props.children}
      <div
        ref={resizerRef}
        className="onyx-resizer"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}
