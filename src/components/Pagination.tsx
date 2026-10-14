/**
 * 分页组件 — 左侧「共 X 条，第 Y / Z 页 + 每页条数选择」，右侧页码按钮（当前页蓝色高亮）
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
/** 页码按钮窗口大小（与设计稿一致，最多显示 7 个连续页码） */
const WINDOW = 7;

export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 滑动窗口：以当前页为中心展示最多 7 个连续页码
  let start = Math.max(1, current - Math.floor(WINDOW / 2));
  const end = Math.min(totalPages, start + WINDOW - 1);
  start = Math.max(1, end - WINDOW + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const arrowBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
      {/* 左侧：统计 + 每页条数 */}
      <div className="flex items-center">
        <span>
          共 <span className="font-medium text-gray-700">{total}</span> 条，第 {current} / {totalPages} 页
        </span>
        <span className="ml-4">每页</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} 条
            </option>
          ))}
        </select>
      </div>

      {/* 右侧：页码按钮 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className={arrowBtn}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
              p === current
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={current >= totalPages}
          className={arrowBtn}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
