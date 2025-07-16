import { 
  defaultErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  EventSystemError,
  RecoveryStrategy 
} from '../eventSystem/errorHandler';
import type { UserFriendlyError, RecoveryInfo, SystemHealth, ErrorStats } from '../types/error';

// 用户友好的错误信息映射
const ERROR_MESSAGE_MAP: Record<ErrorType, string> = {
  [ErrorType.VALIDATION_ERROR]: '数据已自动修复，游戏正常继续',
  [ErrorType.DATA_CORRUPTION]: '检测到数据损坏，系统正在尝试修复',
  [ErrorType.EVENT_PROCESSING_ERROR]: '事件处理出现问题，但游戏可以继续',
  [ErrorType.CONDITION_EVALUATION_ERROR]: '条件检查出现错误，部分功能可能受影响',
  [ErrorType.OUTCOME_PROCESSING_ERROR]: '结果处理出现问题，请稍后重试',
  [ErrorType.SYSTEM_ERROR]: '系统错误，正在尝试恢复',
  [ErrorType.RECOVERY_ERROR]: '错误恢复失败，请刷新页面'
};

const SEVERITY_MESSAGE_MAP: Record<ErrorSeverity, string> = {
  [ErrorSeverity.LOW]: '信息提示',
  [ErrorSeverity.MEDIUM]: '轻微问题',
  [ErrorSeverity.HIGH]: '需要注意',
  [ErrorSeverity.CRITICAL]: '严重错误'
};

// 错误处理集成类
export class ErrorIntegration {
  private onErrorCallback?: (error: UserFriendlyError) => void;
  private onRecoveryCallback?: (recovery: RecoveryInfo) => void;
  
  // 连接到错误处理器
  connect(errorHandler: any): void {
    errorHandler.updateConfig({
      onError: this.handleSystemError.bind(this),
      onRecovery: this.handleRecovery.bind(this)
    });
  }
  
  // 设置错误回调
  setErrorCallback(callback: (error: UserFriendlyError) => void): void {
    this.onErrorCallback = callback;
  }
  
  // 设置恢复回调
  setRecoveryCallback(callback: (recovery: RecoveryInfo) => void): void {
    this.onRecoveryCallback = callback;
  }
  
  // 处理系统错误
  private handleSystemError(error: EventSystemError): void {
    const userFriendlyError: UserFriendlyError = {
      id: error.id,
      title: SEVERITY_MESSAGE_MAP[error.severity],
      message: ERROR_MESSAGE_MAP[error.type] || error.message,
      severity: error.severity,
      timestamp: error.timestamp,
      canRetry: error.recoveryStrategy === RecoveryStrategy.RETRY,
      technical: {
        type: error.type,
        originalMessage: error.message,
        details: error.details,
        stackTrace: error.stackTrace
      }
    };
    
    if (this.onErrorCallback) {
      this.onErrorCallback(userFriendlyError);
    }
  }
  
  // 处理恢复信息
  private handleRecovery(error: EventSystemError, recovery: any): void {
    const recoveryInfo: RecoveryInfo = {
      errorId: error.id,
      strategy: recovery.strategy,
      success: recovery.success,
      message: recovery.message,
      timestamp: new Date().toISOString()
    };
    
    if (this.onRecoveryCallback) {
      this.onRecoveryCallback(recoveryInfo);
    }
  }
  
  // 获取系统健康状态
  getSystemHealth(): SystemHealth {
    const health = defaultErrorHandler.getSystemHealth();
    
    return {
      status: health.status,
      recentErrors: health.recentErrors,
      criticalErrors: health.criticalErrors,
      recommendations: health.recommendations,
      timestamp: new Date().toISOString()
    };
  }
  
  // 获取错误统计
  getErrorStats(): ErrorStats {
    const stats = defaultErrorHandler.getErrorStats();
    const recentErrors = defaultErrorHandler.getRecentErrors(50);
    
    const severityStats = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };
    
    recentErrors.forEach(error => {
      severityStats[error.severity]++;
    });
    
    return {
      totalErrors: recentErrors.length,
      errorsByType: stats,
      errorsBySeverity: severityStats,
      lastErrorTime: recentErrors[0]?.timestamp,
      timestamp: new Date().toISOString()
    };
  }
  
  // 清除错误日志
  clearErrors(): void {
    defaultErrorHandler.clearErrors();
  }
  
  // 手动触发错误恢复
  async triggerRecovery(): Promise<boolean> {
    try {
      const recentErrors = defaultErrorHandler.getRecentErrors(5);
      const criticalErrors = recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL);
      
      if (criticalErrors.length > 0) {
        // 处理最近的严重错误
        const recovery = await defaultErrorHandler.handleError(criticalErrors[0]);
        return recovery.success;
      }
      
      return true;
    } catch (error) {
      console.error('手动恢复失败:', error);
      return false;
    }
  }
  
  // 创建应用级错误
  createAppError(message: string, details?: string): EventSystemError {
    return defaultErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      message,
      details
    );
  }
  
  // 包装异步函数并添加错误处理
  wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorMessage: string = '操作失败'
  ): T {
    // console.log('[[DEBUG]] wrapAsyncFunction: fn:', fn, 'errorMessage:', errorMessage);
    return (async (...args: any[]) => {
      try {
        // console.log('[[DEBUG]] wrapAsyncFunction: fn:', fn, 'errorMessage:', errorMessage);
        return await fn(...args);
      } catch (error: any) {
        console.error('[[DEBUG]] wrapAsyncFunction: error:', error);
        const appError = this.createAppError(
          `${errorMessage}: ${error.message}`,
          error.stack
        );
        
        const recoveryResult = await defaultErrorHandler.handleError(appError);
        
        // 如果恢复不成功，则向上抛出错误，以便UI层可以捕获
        if (!recoveryResult.success) {
          throw new Error(`错误恢复失败: ${recoveryResult.message}`);
        }
        
        // 如果恢复成功，可以选择不抛出错误，静默处理
        // 在这种情况下，我们希望知道发生了什么，所以最好总是有一个可追踪的记录
      }
    }) as T;
  }

  // 包装同步函数并添加错误处理
  wrapSyncFunction<T extends (...args: any[]) => any>(
    fn: T,
    errorMessage: string = '操作失败'
  ): (...args: Parameters<T>) => ReturnType<T> | void {
    return (...args: Parameters<T>): ReturnType<T> | void => {
      try {
        return fn(...args);
      } catch (error: any) {
        console.error('[[DEBUG]] wrapSyncFunction: error:', error);
        const appError = this.createAppError(
          `${errorMessage}: ${error.message}`,
          error.stack
        );
        
        // 错误处理是异步的，但包装器是同步的。
        // 我们将“即发即忘”地处理错误。
        defaultErrorHandler.handleError(appError).then(recoveryResult => {
            if (!recoveryResult.success) {
                // 这里不能重新抛出，因为我们在一个 promise 中。
                // 原始的同步函数已经返回了。
                // 仅记录日志。主处理器应该已经通知了用户。
                console.error(`同步操作错误恢复失败: ${recoveryResult.message}`);
            }
        });
      }
    };
  }
}

// 类型定义
export type { UserFriendlyError, RecoveryInfo, SystemHealth, ErrorStats };

// 全局错误集成实例
export const errorIntegration = new ErrorIntegration();

// 便利函数
export function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  errorMessage: string = '操作失败'
): Promise<T | void> {
  console.log('[[DEBUG]] handleAsyncError: asyncFn:', asyncFn, 'errorMessage:', errorMessage);
  return errorIntegration.wrapAsyncFunction(
    asyncFn,
    errorMessage
  )();
}

export function handleSyncError<T>(
  syncFn: () => T,
  errorMessage: string = '操作失败'
): T | void {
  return errorIntegration.wrapSyncFunction(
    syncFn,
    errorMessage
  )();
}

// React Hook 风格的错误处理
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: string) => {
      const appError = errorIntegration.createAppError(
        `${context || '应用错误'}: ${error.message}`,
        error.stack
      );
      defaultErrorHandler.handleError(appError);
    },
    
    wrapAsync: errorIntegration.wrapAsyncFunction.bind(errorIntegration),

    wrapSync: errorIntegration.wrapSyncFunction.bind(errorIntegration),
    
    getHealth: errorIntegration.getSystemHealth.bind(errorIntegration),
    
    getStats: errorIntegration.getErrorStats.bind(errorIntegration)
  };
} 