import React, { useState, useEffect } from "react";
import { Modal, ModalProps } from "react-bootstrap";

interface OnyxModalProps extends Omit<ModalProps, "container"> {
  children: React.ReactNode;
}

/**
 * Base modal component that automatically scopes modals to the .Onyx container
 * to ensure Bootstrap styles are properly applied when scoped.
 */
export function OnyxModal({ children, ...props }: OnyxModalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const onyxElement = document.querySelector(".Onyx");
    if (onyxElement instanceof HTMLElement) {
      setContainer(onyxElement);
    }
  }, []);

  return (
    <Modal {...props} container={container || undefined} centered>
      {children}
    </Modal>
  );
}

export default OnyxModal;
