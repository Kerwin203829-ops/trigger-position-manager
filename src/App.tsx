/**
 * 参数触发位置管理平台
 *
 * 页面结构：
 * 顶部操作栏（名称/conditionValue 搜索 + 状态筛选 + 新增按钮）
 * → 触发位置列表（状态徽标、编辑、启用/禁用）→ 分页
 * 弹窗：新增/编辑表单（PositionModal）、禁用二次确认（ConfirmDialog）
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  FilePlus2,
  MapPin,
  Pencil,
  Power,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  fetchPositionPage,
  updatePosition,
  type TriggerPosition,
} from './lib/triggerPositionApi';
import PositionModal from './components/PositionModal';
import ConfirmDialog from './components/ConfirmDialog';
import CannotDisableDialog from './components/CannotDisableDialog';
import Pagination from './components/Pagination';

const PAGE_SIZE = 20;

export default function App() {
  const [records, setRecords] = useState<TriggerPosition[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 搜索条件（输入即时生效，用防抖避免频繁请求）
  const [nameInput, setNameInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [query, setQuery] = useState<{ positionName?: string; positionValue?: string; status?: number }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TriggerPosition | null>(null);
  const [disableTarget, setDisableTarget] = useState<TriggerPosition | null>(null);
  const [disableBlockedReason, setDisableBlockedReason] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null);

  const toastTimer = useRef<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const loadList = useCallback(
    async (page: number, q: typeof query, size: number = pageSize) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPositionPage({
          current: page,
          size,
          positionName: q.positionName,
          positionValue: q.positionValue,
          status: q.status,
        });
        setRecords(data.records);
        setTotal(data.total);
        setCurrent(data.current);
      } catch (err) {
        setError(err instanceof Error ? err.message : '列表加载失败');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    loadList(1, query);
  }, [loadList, query]);

  // 搜索输入防抖
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery({
        positionName: nameInput.trim() || undefined,
        positionValue: valueInput.trim() || undefined,
        status: statusFilter === '' ? undefined : statusFilter,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [nameInput, valueInput, statusFilter]);

  const handleToggleStatus = async (row: TriggerPosition) => {
    setTogglingId(row.id);
    try {
      await updatePosition({ id: row.id, status: row.status === 1 ? 0 : 1 });
      showToast('success', row.status === 1 ? '已禁用' : '已启用');
      setDisableTarget(null);
      await loadList(current, query);
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      // 禁用失败（如被运行中的实验/参数引用）→ 弹出「无法禁用」弹窗
      if (row.status === 1) {
        setDisableTarget(null);
        setDisableBlockedReason(message);
      } else {
        showToast('error', message);
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 页头（吸顶固定） */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">触发位置管理平台</h1>
          <span className="text-xs text-gray-500">作品演示 · 虚构数据 · 本地保存</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* 顶部操作栏 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="按展示名称搜索"
              className="w-56 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="按 conditionValue 搜索"
              className="w-80 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 font-mono text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === '' ? '' : Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">全部状态</option>
            <option value={1}>启用</option>
            <option value={0}>禁用</option>
          </select>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98]"
            >
              <FilePlus2 className="h-4 w-4" />
              新增触发位置
            </button>
          </div>
        </div>

        {/* 筛选反馈条 */}
        {(query.positionName || query.positionValue || query.status !== undefined) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2 text-sm text-gray-600">
            <span className="text-gray-500">当前筛选：</span>
            {query.positionName && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 ring-1 ring-blue-200">
                名称含「{query.positionName}」
              </span>
            )}
            {query.positionValue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-xs ring-1 ring-blue-200">
                {query.positionValue}
              </span>
            )}
            {query.status !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 ring-1 ring-blue-200">
                {query.status === 1 ? '仅启用' : '仅禁用'}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setNameInput('');
                setValueInput('');
                setStatusFilter('');
              }}
              className="ml-1 text-xs font-medium text-blue-600 hover:underline"
            >
              清除全部
            </button>
          </div>
        )}

        {/* 列表（表头吸顶 + 首列固定，区域内滚动） */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[calc(100vh-215px)] overflow-auto">
            <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="sticky left-0 top-0 z-30 w-40 min-w-40 border-b border-gray-200 bg-gray-50 px-5 py-3">展示名称</th>
                  <th className="sticky top-0 z-20 w-48 min-w-48 border-b border-gray-200 bg-gray-50 px-5 py-3">conditionValue</th>
                  <th className="sticky top-0 z-20 w-20 min-w-20 border-b border-gray-200 bg-gray-50 px-5 py-3">状态</th>
                  <th className="sticky top-0 z-20 w-28 min-w-28 border-b border-gray-200 bg-gray-50 px-5 py-3">创建人</th>
                  <th className="sticky top-0 z-20 w-44 min-w-44 border-b border-gray-200 bg-gray-50 px-5 py-3">创建时间</th>
                  <th className="sticky top-0 z-20 w-44 min-w-44 border-b border-gray-200 bg-gray-50 px-5 py-3">最后更新时间</th>
                  <th className="sticky top-0 z-20 w-52 min-w-52 border-b border-gray-200 bg-gray-50 px-5 py-3">使用场景描述</th>
                  <th className="sticky top-0 z-20 w-28 min-w-28 border-b border-gray-200 bg-gray-50 px-5 py-3">关联链接</th>
                  <th className="sticky top-0 z-20 w-32 min-w-32 border-b border-gray-200 bg-gray-50 px-5 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                      <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-300" />
                      加载中…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <p className="text-red-500">{error}</p>
                      <button
                        type="button"
                        onClick={() => loadList(current, query)}
                        className="mt-3 rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        重试
                      </button>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                      <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                      暂无触发位置，点击右上角「新增触发位置」创建
                    </td>
                  </tr>
                ) : (
                  records.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="sticky left-0 z-10 w-40 min-w-40 max-w-52 truncate border-b border-gray-100 bg-white px-5 py-3.5 font-medium group-hover:bg-gray-50 hover:bg-gray-50" title={row.positionName}>
                        {row.positionName}
                      </td>
                      <td className="border-b border-gray-100 px-5 py-3.5">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                          {row.positionValue}
                        </code>
                      </td>
                      <td className="border-b border-gray-100 px-5 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.status === 1
                              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                              : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${row.status === 1 ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {row.status === 1 ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-5 py-3.5 text-gray-600">{row.createUserEn || '-'}</td>
                      <td className="whitespace-nowrap border-b border-gray-100 px-5 py-3.5 text-gray-500">{row.createTime || '-'}</td>
                      <td className="whitespace-nowrap border-b border-gray-100 px-5 py-3.5 text-gray-500">{row.updateTime || '-'}</td>
                      <td className="w-52 min-w-52 border-b border-gray-100 px-5 py-3.5 text-gray-600">
                        {row.sceneDesc ? (
                          <span
                            onClick={() => setExpandedDescId(expandedDescId === row.id ? null : row.id)}
                            className={`cursor-pointer whitespace-pre-wrap break-words ${expandedDescId === row.id ? '' : 'line-clamp-2'}`}
                            title={expandedDescId === row.id ? '点击收起' : '点击展开全文'}
                          >
                            {row.sceneDesc}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="border-b border-gray-100 px-5 py-3.5">
                        {row.dcpLink ? (
                          <a
                            href={row.dcpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-44 items-center gap-1 truncate text-blue-600 hover:underline"
                            title={row.dcpLink}
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            查看工单
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-100 px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(row);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          编辑
                        </button>
                        {row.status === 1 ? (
                          <button
                            type="button"
                            onClick={() => setDisableTarget(row)}
                            disabled={togglingId === row.id}
                            className="ml-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Power className="h-3.5 w-3.5" />
                            禁用
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(row)}
                            disabled={togglingId === row.id}
                            className="ml-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                          >
                            <Power className="h-3.5 w-3.5" />
                            启用
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {!loading && !error && (
            <Pagination
              current={current}
              total={total}
              pageSize={pageSize}
              onChange={(page) => loadList(page, query)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                loadList(1, query, size);
              }}
            />
          )}
        </div>
      </main>

      {/* 新增/编辑弹窗 */}
      <PositionModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          showToast('success', editing ? '保存成功' : '创建成功');
          loadList(editing ? current : 1, query);
        }}
      />

      {/* 禁用二次确认 */}
      <ConfirmDialog
        open={disableTarget !== null}
        title="确认禁用该触发位置？"
        message="禁用后该触发位置将无法在参数维度配置中被选择，是否确认？"
        confirmText="确认禁用"
        loading={togglingId !== null}
        onConfirm={() => disableTarget && handleToggleStatus(disableTarget)}
        onCancel={() => setDisableTarget(null)}
      />

      {/* 无法禁用提示（被运行中的实验/参数引用） */}
      <CannotDisableDialog
        open={disableBlockedReason !== ''}
        reason={disableBlockedReason}
        onCancel={() => setDisableBlockedReason('')}
      />

      {/* 全局提示 */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}


