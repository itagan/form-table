import type { TableRow } from '@itagan/form-table'

export type DemandType = 'venue' | 'hotel' | 'meal' | 'flight' | 'train' | 'car' | 'other' | 'guest'
export type ComplexDemandType = Exclude<DemandType, 'other' | 'guest'>
export type TransportDemandType = Extract<DemandType, 'flight' | 'train' | 'car'>

/** 所有场景编辑器遵循相同的受控输入、只读和事件协议。 */
export interface DemandEditorProps<T> {
  value: T
  demandType: DemandType
  readonly?: boolean
}

export interface DemandDetail {
  [key: string]: unknown
}

export interface DemandSchedule {
  start?: string
  end?: string
}

export interface DemandPricing {
  quantity: number
  unit: string
  unitPrice: number
}

export interface DemandRow extends TableRow {
  _rowKey: string
  type: DemandType
  detail: DemandDetail
  schedule: DemandSchedule
  pricing: DemandPricing
}

export const demandTypeLabels: Record<DemandType, string> = {
  venue: '会场',
  hotel: '酒店住宿',
  meal: '用餐',
  flight: '机票',
  train: '火车票',
  car: '用车',
  other: '其他',
  guest: '嘉宾'
}

const defaults: Record<DemandType, Omit<DemandRow, '_rowKey'>> = {
  venue: {
    type: 'venue',
    detail: { venueType: '', attendeeCount: 20, equipment: '', remark: '' },
    schedule: { start: '', end: '' },
    pricing: { quantity: 1, unit: '场', unitPrice: 0 }
  },
  hotel: {
    type: 'hotel',
    detail: { hotelName: '', roomName: '', roomCount: 1, roomType: '', guestCount: 1, breakfast: true, remark: '' },
    schedule: { start: '', end: '' },
    pricing: { quantity: 1, unit: '间夜', unitPrice: 0 }
  },
  meal: {
    type: 'meal',
    detail: { mealType: '', supplies: '', remark: '' },
    schedule: { start: '' },
    pricing: { quantity: 1, unit: '份', unitPrice: 0 }
  },
  flight: {
    type: 'flight',
    detail: { seatClass: '', departure: '', arrival: '', remark: '' },
    schedule: { start: '' },
    pricing: { quantity: 1, unit: '人', unitPrice: 0 }
  },
  train: {
    type: 'train',
    detail: { seatClass: '', departure: '', arrival: '', remark: '' },
    schedule: { start: '' },
    pricing: { quantity: 1, unit: '人', unitPrice: 0 }
  },
  car: {
    type: 'car',
    detail: { departure: '', arrival: '', carType: '', remark: '' },
    schedule: { start: '', end: '' },
    pricing: { quantity: 1, unit: '辆', unitPrice: 0 }
  },
  other: {
    type: 'other',
    detail: { expenseType: '', description: '' },
    schedule: {},
    pricing: { quantity: 1, unit: '项', unitPrice: 0 }
  },
  guest: {
    type: 'guest',
    detail: { guestCount: 1, remark: '' },
    schedule: {},
    pricing: { quantity: 1, unit: '人', unitPrice: 0 }
  }
}

let rowSequence = 0

/** 新增同类需求统一经过工厂，确保每种场景只携带自己的字段。 */
export const createDemandRow = (type: DemandType): DemandRow => {
  const source = defaults[type]
  return {
    _rowKey: `demand:${Date.now()}:${++rowSequence}`,
    type,
    detail: { ...source.detail },
    schedule: { ...source.schedule },
    pricing: { ...source.pricing }
  }
}

export const calculateDemandTotal = (row: DemandRow) => {
  const quantity = Math.max(0, Number(row.pricing.quantity) || 0)
  const unitPrice = Math.max(0, Number(row.pricing.unitPrice) || 0)
  return Number((quantity * unitPrice).toFixed(2))
}

export const requiresDemandSchedule = (type: DemandType) => type !== 'other' && type !== 'guest'
export const requiresDemandEndTime = (type: DemandType) => type === 'venue' || type === 'hotel' || type === 'car'
export const getDemandStartPlaceholder = (type: DemandType) => type === 'hotel' ? '入住时间' : type === 'meal' ? '就餐时间' : '开始/出发时间'
export const getDemandEndPlaceholder = (type: DemandType) => type === 'hotel' ? '离店时间' : '结束时间'
