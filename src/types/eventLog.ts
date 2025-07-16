export interface EventLogEntry {
  id: string;
  timestamp: string; // ISO 格式
  type: string; // 事件类型
  characterId?: string;
  itemId?: string;
  details?: string;
  extra?: {
    [key: string]: any;
  };
}

export interface EventLog {
  entries: EventLogEntry[];
} 