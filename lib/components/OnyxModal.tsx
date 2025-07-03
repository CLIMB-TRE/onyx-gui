import React, { useCallback } from "react";
import { Modal, ModalProps } from "react-bootstrap";

interface OnyxModalProps extends Omit<ModalProps, "container"> {
  children: React.ReactNode;
}

/**
 * Base modal component that automatically scopes modals to the .Onyx container
 * to ensure Bootstrap styles are properly applied when scoped.
 */
export function OnyxModal({ children, ...props }: OnyxModalProps) {
  const getOnyxContainer = useCallback((): HTMLElement | undefined => {
    const element = document.querySelector(".onyx");
    return element instanceof HTMLElement ? element : undefined;
  }, []);

  return (
    <Modal {...props} container={getOnyxContainer()} centered>
      {children}
    </Modal>
  );
}

export default OnyxModal;
