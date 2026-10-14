/**
 * 新增/编辑触发位置弹窗
 *
 * 新增：conditionValue 白底可输入，提示「仅支持字母、数字、下划线，创建后不可修改」
 * 编辑：conditionValue 置灰不可修改，提示「创建后不可修改，如需变更请联系研发」
 */
import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  addPosition,
  updatePosition,
  type TriggerPosition,
} from '../lib/triggerPositionApi';

const POSITION_VALUE_RE = /^[A-Za-z0-9_]+$/;
const DEMO_LINK_PREFIX = 'https://example.com';

interface PositionModalProps {
  open: boolean;
  /** 编辑时传入现有记录；新增时为 null */
  editing: TriggerPosition | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  positionName: string;
  positionValue: string;
  sceneDesc: string;
  dcpLink: string;
}

const EMPTY_FORM: FormState = { positionName: '', positionValue: '', sceneDesc: '', dcpLink: '' };

export default function PositionModal({ open, editing, onClose, onSaved }: PositionModalProps) {
  const isEdit = editing !== null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'form', string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              positionName: editing.positionName,
              positionValue: editing.positionValue,
              sceneDesc: editing.sceneDesc ?? '',
              dcpLink: editing.dcpLink ?? '',
            }
          : EMPTY_FORM
      );
      setErrors({});
      setSubmitting(false);
    }
  }, [open, editing]);

  if (!open) return null;

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState | 'form', string>> = {};
    if (!form.positionName.trim()) next.positionName = '请输入展示名称';
    else if (form.positionName.trim().length > 256) next.positionName = '展示名称长度不能超过 256';

    if (!isEdit) {
      if (!form.positionValue.trim()) next.positionValue = '请输入 conditionValue';
      else if (form.positionValue.trim().length > 128) next.positionValue = 'conditionValue 长度不能超过 128';
      else if (!POSITION_VALUE_RE.test(form.positionValue.trim())) {
        next.positionValue = '仅支持字母、数字、下划线';
      }
    }

    if (form.dcpLink.trim() && !form.dcpLink.trim().startsWith(DEMO_LINK_PREFIX)) {
      next.dcpLink = `链接必须以 ${DEMO_LINK_PREFIX} 开头`;
    } else if (form.dcpLink.trim().length > 512) {
      next.dcpLink = '关联链接长度不能超过 512';
    }
    if (form.sceneDesc.trim().length > 512) next.sceneDesc = '使用场景描述长度不能超过 512';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updatePosition({
          id: editing.id,
          positionName: form.positionName.trim(),
          sceneDesc: form.sceneDesc.trim(),
          dcpLink: form.dcpLink.trim(),
        });
      } else {
        await addPosition({
          positionName: form.positionName.trim(),
          positionValue: form.positionValue.trim(),
          sceneDesc: form.sceneDesc.trim(),
          dcpLink: form.dcpLink.trim(),
        });
      }
      onSaved();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : '操作失败，请重试' });
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? '编辑触发位置' : '新增触发位置'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单 */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* 展示名称 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              展示名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.positionName}
              onChange={(e) => setField('positionName', e.target.value)}
              placeholder="请输入中文展示名称（全局唯一）"
              maxLength={256}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                errors.positionName ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.positionName && <p className="mt-1 text-xs text-red-500">{errors.positionName}</p>}
          </div>

          {/* conditionValue */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              conditionValue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.positionValue}
              onChange={(e) => setField('positionValue', e.target.value)}
              placeholder="请输入 conditionValue（仅字母/数字/下划线）"
              maxLength={128}
              disabled={isEdit}
              className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition-colors focus:ring-2 ${
                isEdit
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 focus:ring-0'
                  : errors.positionValue
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            <p className={`mt-1 text-xs ${isEdit ? 'text-amber-600' : 'text-gray-400'}`}>
              {isEdit ? '创建后不可修改，如需变更请联系研发' : '仅支持字母、数字、下划线，创建后不可修改'}
            </p>
            {errors.positionValue && <p className="mt-1 text-xs text-red-500">{errors.positionValue}</p>}
          </div>

          {/* 使用场景描述 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">使用场景描述</label>
            <textarea
              value={form.sceneDesc}
              onChange={(e) => setField('sceneDesc', e.target.value)}
              placeholder="帮助其他用户了解该触发位置的含义和适用场景"
              rows={4}
              maxLength={512}
              className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                errors.sceneDesc ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.sceneDesc ? (
              <p className="mt-1 text-xs text-red-500">{errors.sceneDesc}</p>
            ) : (
              <p className="mt-1 text-right text-xs text-gray-400">{form.sceneDesc.length}/512</p>
            )}
          </div>

          {/* 关联工单链接 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">关联工单链接</label>
            <input
              type="text"
              value={form.dcpLink}
              onChange={(e) => setField('dcpLink', e.target.value)}
              placeholder="https://example.com/tickets/..."
              maxLength={512}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                errors.dcpLink ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.dcpLink && <p className="mt-1 text-xs text-red-500">{errors.dcpLink}</p>}
          </div>

          {/* 提交错误（后端唯一性校验等） */}
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {errors.form}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 rounded-b-xl border-t border-gray-100 bg-gray-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}


