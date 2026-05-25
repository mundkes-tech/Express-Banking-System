import React from 'react';
import './Modal.css';

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  const titleId = `modal-title-${String(title || 'dialog').replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <div className="modal-card">
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
