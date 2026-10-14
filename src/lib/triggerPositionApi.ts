export interface TriggerPosition {
  id: number;
  positionValue: string; // 界面中的 conditionValue
  positionName: string; // 展示名称
  status: 0 | 1; // 1=启用 0=禁用
  sceneDesc: string | null;
  dcpLink: string | null;
  createUserId: string | null;
  createUserEn: string | null;
  createTime: string | null;
  updateTime: string | null;
}

export interface PageRequest {
  current: number;
  size: number;
  positionValue?: string;
  positionName?: string;
  status?: number;
}

export interface PageData {
  records: TriggerPosition[];
  total: number;
  current: number;
  size: number;
}

export interface AddPositionPayload {
  positionValue: string;
  positionName: string;
  status?: 0 | 1;
  sceneDesc?: string;
  dcpLink?: string;
}

export interface UpdatePositionPayload {
  id: number;
  positionName?: string;
  status?: 0 | 1;
  sceneDesc?: string;
  dcpLink?: string;
  // 注意：positionValue 创建后不可修改，编辑时不传该字段
}

const STORAGE_KEY = 'trigger-position-portfolio-v1';
const seed: TriggerPosition[] = [
  {id:1,positionValue:'home_recommendation',positionName:'首页推荐区域',status:1,sceneDesc:'展示首页推荐内容时使用。此记录模拟被运行中的实验引用，禁用将展示保护提示。',dcpLink:'https://example.com/tickets/DEMO-001',createUserId:'demo',createUserEn:'Demo User',createTime:'2026-01-10 10:00:00',updateTime:'2026-01-10 10:00:00'},
  {id:2,positionValue:'cart_banner',positionName:'购物车提示横幅',status:1,sceneDesc:'购物车提示横幅的虚构演示场景。',dcpLink:null,createUserId:'demo',createUserEn:'Demo User',createTime:'2026-01-11 10:00:00',updateTime:'2026-01-11 10:00:00'},
  {id:3,positionValue:'profile_refresh',positionName:'个人页刷新',status:0,sceneDesc:'演示禁用状态与重新启用操作。',dcpLink:null,createUserId:'demo',createUserEn:'Demo User',createTime:'2026-01-12 10:00:00',updateTime:'2026-01-12 10:00:00'}
];

function read(): TriggerPosition[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seed.map(row => ({...row}));
  return JSON.parse(raw) as TriggerPosition[];
}
function write(rows: TriggerPosition[]) {localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));}
function now() {return new Date().toISOString().replace('T',' ').slice(0,19);}
function validate(name: string, value?: string, desc?: string, link?: string) {
  if (!name.trim() || name.trim().length > 256) throw new Error('展示名称必填且不超过256字符');
  if (value !== undefined && (!/^[A-Za-z0-9_]+$/.test(value.trim()) || value.trim().length > 128)) throw new Error('Key仅支持字母、数字和下划线，且不超过128字符');
  if ((desc?.length || 0) > 512) throw new Error('描述不能超过512字符');
  if (link && (!link.startsWith('https://example.com') || link.length > 512)) throw new Error('演示链接必须以https://example.com开头且不超过512字符');
}

export async function fetchPositionPage(params: PageRequest): Promise<PageData> {
  let rows = read();
  if (params.positionName) rows = rows.filter(row => row.positionName.includes(params.positionName!));
  if (params.positionValue) rows = rows.filter(row => row.positionValue === params.positionValue);
  if (params.status !== undefined) rows = rows.filter(row => row.status === params.status);
  const current = Math.max(1,params.current);
  return {records:rows.slice((current-1)*params.size,current*params.size),total:rows.length,current,size:params.size};
}
export async function addPosition(payload: AddPositionPayload): Promise<void> {
  validate(payload.positionName,payload.positionValue,payload.sceneDesc,payload.dcpLink);
  const rows = read();
  if (rows.some(row => row.positionName === payload.positionName.trim())) throw new Error('展示名称已存在');
  if (rows.some(row => row.positionValue === payload.positionValue.trim())) throw new Error('Key已存在');
  const time=now();
  rows.unshift({id:Math.max(0,...rows.map(row=>row.id))+1,positionName:payload.positionName.trim(),positionValue:payload.positionValue.trim(),status:payload.status??1,sceneDesc:payload.sceneDesc||null,dcpLink:payload.dcpLink||null,createUserId:'demo',createUserEn:'Demo User',createTime:time,updateTime:time});
  write(rows);
}
export async function updatePosition(payload: UpdatePositionPayload): Promise<void> {
  const rows=read();
  const row=rows.find(item=>item.id===payload.id);
  if (!row) throw new Error('记录不存在');
  if (row.id===1 && payload.status===0) throw new Error('演示保护：此场景模拟被运行中的实验引用，无法禁用。');
  validate(payload.positionName??row.positionName,undefined,payload.sceneDesc,payload.dcpLink);
  if (payload.positionName && rows.some(item=>item.id!==row.id && item.positionName===payload.positionName!.trim())) throw new Error('展示名称已存在');
  if (payload.positionName!==undefined) row.positionName=payload.positionName.trim();
  if (payload.status!==undefined) row.status=payload.status;
  if (payload.sceneDesc!==undefined) row.sceneDesc=payload.sceneDesc||null;
  if (payload.dcpLink!==undefined) row.dcpLink=payload.dcpLink||null;
  row.updateTime=now();
  write(rows);
}



