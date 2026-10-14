/**
 * 「无法禁用」提示弹窗 — 触发位置被运行中的实验/参数引用时展示
 * （确认禁用按钮置灰不可点，仅允许取消）
 */
import { CircleAlert } from 'lucide-react';

interface CannotDisableDialogProps {
  open: boolean;
  /** 后端返回的具体原因（可选，缺省用标准文案） */
  reason?: string;
  onCancel: () => void;
}

export default function CannotDisableDialog({ open, reason, onCancel }: CannotDisableDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-500" fill="#fecaca" stroke="#dc2626" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">无法禁用</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {reason || '该触发位置正在被运行中的实验/参数引用，请先下线或解除相关引用后再禁用。'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            取 消
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-red-300 px-5 py-2 text-sm font-medium text-white"
          >
            确认禁用
          </button>
        </div>
      </div>
    </div>
  );
}
