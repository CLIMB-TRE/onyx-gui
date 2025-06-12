import { useCallback, useEffect, useState } from "react";

interface ResizerProps {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  setWidth: (width: number) => void;
}

export default function Resizer(props: ResizerProps) {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= props.minWidth && newWidth <= props.maxWidth) {
        props.setWidth(newWidth);
      }
    },
    [isResizing, props]
  );

  // Reset to default width
  const handleDoubleClick = () => props.setWidth(props.defaultWidth);

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
      className="resizer"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    />
  );
}
