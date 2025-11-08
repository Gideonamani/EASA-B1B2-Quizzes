import type { ReactNode } from 'react'

interface ModalProps {
  title?: string
  children: ReactNode
  actions?: ReactNode
}

const Modal = ({ title, children, actions }: ModalProps) => {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        {title && <h3>{title}</h3>}
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

export default Modal
