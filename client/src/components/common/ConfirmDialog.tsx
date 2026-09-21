import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, isPending = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-6 text-sm text-slate-800">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" data-autofocus onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-danger" disabled={isPending} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
