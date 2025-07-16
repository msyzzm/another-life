import type { ErrorType, ErrorSeverity, RecoveryStrategy } from '../eventSystem/errorHandler';

// 用户友好的错误接口
export interface UserFriendlyError {
  id: string;
  title: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  canRetry: boolean;
  technical: {
    type: ErrorType;
    originalMessage: string;
    details?: string;
    stackTrace?: string;
  };
}

// 恢复信息接口
export interface RecoveryInfo {
  errorId: string;
  strategy: RecoveryStrategy;
  success: boolean;
  message: string;
  timestamp: string;
}

// 系统健康状态接口
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  recentErrors: number;
  criticalErrors: number;
  recommendations: string[];
  timestamp: string;
}

// 错误统计接口
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  lastErrorTime?: string;
  timestamp: string;
} 