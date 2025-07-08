import React, { useRef } from "react";
import { Modal, ModalProps } from "react-bootstrap";

interface ContainerModalProps extends Omit<ModalProps, "container"> {
  children: React.ReactNode;
}

/**
 * Base modal component that automatically scopes modals to a parent container
 * to ensure Bootstrap styles are properly applied when scoped.
 */
export function ContainerModal({ children, ...props }: ContainerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      <Modal {...props} container={containerRef} centered>
        {children}
      </Modal>
    </div>
  );
}

export default ContainerModal;
