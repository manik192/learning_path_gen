import { X } from "lucide-react";
import "./modal.css";
import { useEffect, useRef } from "react";

const Modal = ({ children, open = false, onClose }) => {
  const modalContentRef = useRef();

  return (
    <div
      className="flexbox modal"
      style={{ display: open ? "flex" : "none" }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cross" onClick={onClose}>
          <X size={30} strokeWidth={1} color="white" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
