import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import type { GameEvent, EventCondition, EventOutcome } from './eventTypes';

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  EVENT_PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR',
  CONDITION_EVALUATION_ERROR = 'CONDITION_EVALUATION_ERROR',
  OUTCOME_PROCESSING_ERROR = 'OUTCOME_PROCESSING_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  RECOVERY_ERROR = 'RECOVERY_ERROR'
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'LOW',           // 不影响正常功能，可以继续执行
  MEDIUM = 'MEDIUM',     // 影响部分功能，需要降级处理
  HIGH = 'HIGH',         // 严重影响，需要停止当前操作
  CRITICAL = 'CRITICAL'  // 系统级错误，需要完全重置
}

// 统一错误接口
export interface EventSystemError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  context?: {
    event?: GameEvent;
    character?: Character;
    inventory?: Inventory;
    condition?: EventCondition;
    outcome?: EventOutcome;
  };
  timestamp: string;
  stackTrace?: string;
  recoveryStrategy?: RecoveryStrategy;
}

// 恢复策略类型
export enum RecoveryStrategy {
  RETRY = 'RETRY',                    // 重试操作
  SKIP = 'SKIP',                      // 跳过当前操作
  FALLBACK = 'FALLBACK',              // 使用备用方案
  RESET_STATE = 'RESET_STATE',        // 重置状态
  TERMINATE = 'TERMINATE'             // 终止处理
}

// 错误恢复结果
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  newState?: {
    character?: Character;
    inventory?: Inventory;
  };
}

// 错误处理配置
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableRecovery: boolean;
  maxRetryAttempts: number;
  fallbackEvents: GameEvent[];
  onError?: (error: EventSystemError) => void;
  onRecovery?: (error: EventSystemError, result: RecoveryResult) => void;
  developmentMode?: boolean;
  onShowNotification?: (message: string, errorId: string, severity: ErrorSeverity) => void;
}

// 默认配置
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableRecovery: true,
  maxRetryAttempts: 3,
  developmentMode: false,
  fallbackEvents: [
    {
      id: 'system_error_fallback',
      name: '系统恢复',
      description: '系统检测到异常并已自动恢复正常。',
      type: 'custom',
      weight: 1,
      conditions: [],
      outcomes: [
        {
          type: 'attributeChange',
          key: 'stamina',
          value: 1
        }
      ]
    }
  ]
};

// 错误日志存储
class ErrorLogger {
  private errors: EventSystemError[] = [];
  private maxSize = 100;

  log(error: EventSystemError): void {
    this.errors.unshift(error);
    if (this.errors.length > this.maxSize) {
      this.errors = this.errors.slice(0, this.maxSize);
    }
    
    if (console && console.error) {
      console.error('[EventSystem Error]', {
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: error.timestamp
      });
    }
  }

  getErrors(type?: ErrorType, severity?: ErrorSeverity): EventSystemError[] {
    let filtered = this.errors;
    
    if (type) {
      filtered = filtered.filter(err => err.type === type);
    }
    
    if (severity) {
      filtered = filtered.filter(err => err.severity === severity);
    }
    
    return filtered;
  }

  getRecentErrors(count: number = 10): EventSystemError[] {
    return this.errors.slice(0, count);
  }

  clear(): void {
    this.errors = [];
  }

  getErrorStats(): { [key in ErrorType]: number } {
    const stats = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as { [key in ErrorType]: number });

    this.errors.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }
}

// 主错误处理器类
export class EventSystemErrorHandler {
  private config: ErrorHandlerConfig;
  private logger: ErrorLogger;
  private retryCount: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new ErrorLogger();
  }

  private generateUserFriendlyMessage(error: EventSystemError): string {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return `出现了非常严重的问题(ID: ${error.id})，游戏可能无法继续。建议您保存进度后刷新页面。`;
      case ErrorSeverity.HIGH:
        return `出现了一个严重问题(ID: ${error.id})，部分功能可能无法使用。`;
      case ErrorSeverity.MEDIUM:
        return `系统遇到了一个小麻烦(ID: ${error.id})，已尝试自动恢复。`;
      case ErrorSeverity.LOW:
      default:
        return `系统遇到了一个小问题(ID: ${error.id})，已自动处理。`;
    }
  }

  // 创建错误对象
  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    details?: string,
    context?: EventSystemError['context']
  ): EventSystemError {
    const error: EventSystemError = {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      details,
      context,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
      recoveryStrategy: this.determineRecoveryStrategy(type, severity)
    };

    if (this.config.enableLogging) {
      this.logger.log(error);
    }

    if (this.config.onError) {
      try {
        this.config.onError(error);
      } catch (e) {
        console.error('Error in error handler callback:', e);
      }
    }

    if (this.config.onShowNotification && !this.config.developmentMode) {
      try {
        const userFriendlyMessage = this.generateUserFriendlyMessage(error);
        this.config.onShowNotification(userFriendlyMessage, error.id, error.severity);
      } catch (e) {
        console.error('Error in onShowNotification callback:', e);
      }
    }

    return error;
  }

  // 处理错误并尝试恢复
  async handleError(error: EventSystemError): Promise<RecoveryResult> {
    if (this.config.developmentMode) {
      console.error("【开发模式】错误已捕获，为便于调试，将在此处中断执行并将原始错误抛出:", error);
      throw error;
    }

    if (!this.config.enableRecovery) {
      return {
        success: false,
        strategy: RecoveryStrategy.TERMINATE,
        message: '错误恢复已禁用'
      };
    }

    const recoveryResult = await this.executeRecovery(error);

    if (this.config.onRecovery) {
      try {
        this.config.onRecovery(error, recoveryResult);
      } catch (e) {
        console.error('Error in recovery handler callback:', e);
      }
    }

    return recoveryResult;
  }

  // 执行恢复策略
  private async executeRecovery(error: EventSystemError): Promise<RecoveryResult> {
    const strategy = error.recoveryStrategy || RecoveryStrategy.TERMINATE;
    
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return this.executeRetry(error);
      
      case RecoveryStrategy.SKIP:
        return {
          success: true,
          strategy: RecoveryStrategy.SKIP,
          message: '已跳过出错的操作，继续执行后续步骤'
        };
      
      case RecoveryStrategy.FALLBACK:
        return this.executeFallback(error);
      
      case RecoveryStrategy.RESET_STATE:
        return this.executeStateReset(error);
      
      case RecoveryStrategy.TERMINATE:
      default:
        return {
          success: false,
          strategy: RecoveryStrategy.TERMINATE,
          message: '错误严重，已终止处理'
        };
    }
  }

  // 重试策略
  private async executeRetry(error: EventSystemError): Promise<RecoveryResult> {
    const retryKey = `${error.type}-${error.context?.event?.id || 'unknown'}`;
    const currentRetryCount = this.retryCount.get(retryKey) || 0;

    if (currentRetryCount >= this.config.maxRetryAttempts) {
      this.retryCount.delete(retryKey);
      return {
        success: false,
        strategy: RecoveryStrategy.RETRY,
        message: `重试次数已达上限 (${this.config.maxRetryAttempts})，放弃重试`
      };
    }

    this.retryCount.set(retryKey, currentRetryCount + 1);
    
    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, 100 * (currentRetryCount + 1)));

    return {
      success: true,
      strategy: RecoveryStrategy.RETRY,
      message: `正在进行第 ${currentRetryCount + 1} 次重试...`
    };
  }

  // 备用方案策略
  private async executeFallback(error: EventSystemError): Promise<RecoveryResult> {
    if (this.config.fallbackEvents.length === 0) {
      return {
        success: false,
        strategy: RecoveryStrategy.FALLBACK,
        message: '没有可用的备用方案'
      };
    }

    // 使用第一个备用事件
    const fallbackEvent = this.config.fallbackEvents[0];
    
    return {
      success: true,
      strategy: RecoveryStrategy.FALLBACK,
      message: `使用备用方案：${fallbackEvent.name}`,
      newState: {
        // 这里可以根据需要修改状态
        character: error.context?.character,
        inventory: error.context?.inventory
      }
    };
  }

  // 状态重置策略
  private async executeStateReset(error: EventSystemError): Promise<RecoveryResult> {
    return {
      success: true,
      strategy: RecoveryStrategy.RESET_STATE,
      message: '已重置到安全状态',
      newState: {
        character: this.createSafeCharacterState(error.context?.character),
        inventory: this.createSafeInventoryState(error.context?.inventory)
      }
    };
  }

  // 创建安全的角色状态
  private createSafeCharacterState(character?: Character): Character | undefined {
    if (!character) return undefined;

    return {
      ...character,
      stats: {
        strength: Math.max(1, character.stats.strength),
        agility: Math.max(1, character.stats.agility),
        intelligence: Math.max(1, character.stats.intelligence),
        stamina: Math.max(1, character.stats.stamina)
      },
      level: Math.max(1, character.level)
    };
  }

  // 创建安全的背包状态
  private createSafeInventoryState(inventory?: Inventory): Inventory | undefined {
    if (!inventory) return undefined;

    return {
      ...inventory,
      items: inventory.items.filter(item => 
        item.id && 
        item.name && 
        item.type && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      )
    };
  }

  // 确定恢复策略
  private determineRecoveryStrategy(type: ErrorType, severity: ErrorSeverity): RecoveryStrategy {
    switch (severity) {
      case ErrorSeverity.LOW:
        return RecoveryStrategy.SKIP;
      
      case ErrorSeverity.MEDIUM:
        switch (type) {
          case ErrorType.VALIDATION_ERROR:
          case ErrorType.CONDITION_EVALUATION_ERROR:
            return RecoveryStrategy.SKIP;
          case ErrorType.EVENT_PROCESSING_ERROR:
          case ErrorType.OUTCOME_PROCESSING_ERROR:
            return RecoveryStrategy.FALLBACK;
          default:
            return RecoveryStrategy.RETRY;
        }
      
      case ErrorSeverity.HIGH:
        switch (type) {
          case ErrorType.DATA_CORRUPTION:
            return RecoveryStrategy.RESET_STATE;
          case ErrorType.SYSTEM_ERROR:
            return RecoveryStrategy.FALLBACK;
          default:
            return RecoveryStrategy.RETRY;
        }
      
      case ErrorSeverity.CRITICAL:
      default:
        return RecoveryStrategy.TERMINATE;
    }
  }

  // 生成错误ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取错误统计信息
  getErrorStats() {
    return this.logger.getErrorStats();
  }

  // 获取最近的错误
  getRecentErrors(count?: number) {
    return this.logger.getRecentErrors(count);
  }

  // 清除错误日志
  clearErrors() {
    this.logger.clear();
    this.retryCount.clear();
  }

  // 更新配置
  updateConfig(newConfig: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 检查系统健康状态
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    recentErrors: number;
    criticalErrors: number;
    recommendations: string[];
  } {
    const recentErrors = this.logger.getRecentErrors(20);
    const criticalErrors = recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
    const highErrors = recentErrors.filter(e => e.severity === ErrorSeverity.HIGH).length;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    if (criticalErrors > 0) {
      status = 'critical';
      recommendations.push('存在严重错误，建议重启事件系统');
    } else if (highErrors > 2 || recentErrors.length > 10) {
      status = 'warning';
      recommendations.push('错误频率较高，建议检查事件配置');
    }

    if (recentErrors.filter(e => e.type === ErrorType.DATA_CORRUPTION).length > 0) {
      recommendations.push('检测到数据损坏，建议验证存储数据');
    }

    return {
      status,
      recentErrors: recentErrors.length,
      criticalErrors,
      recommendations
    };
  }
}

// 默认错误处理器实例
export const defaultErrorHandler = new EventSystemErrorHandler();

// 便捷的错误创建函数
export function createValidationError(message: string, context?: any): EventSystemError {
  return defaultErrorHandler.createError(
    ErrorType.VALIDATION_ERROR,
    ErrorSeverity.LOW,  // 从MEDIUM降低为LOW
    message,
    undefined,
    context
  );
}

export function createProcessingError(message: string, context?: any): EventSystemError {
  return defaultErrorHandler.createError(
    ErrorType.EVENT_PROCESSING_ERROR,
    ErrorSeverity.HIGH,
    message,
    undefined,
    context
  );
}

export function createSystemError(message: string, context?: any): EventSystemError {
  return defaultErrorHandler.createError(
    ErrorType.SYSTEM_ERROR,
    ErrorSeverity.CRITICAL,
    message,
    undefined,
    context
  );
}

// 错误处理装饰器
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorType = ErrorType.SYSTEM_ERROR,
  severity: ErrorSeverity = ErrorSeverity.HIGH
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // 处理Promise
      if (result && typeof result.then === 'function') {
        return result.catch((error: any) => {
          const eventError = defaultErrorHandler.createError(
            errorType,
            severity,
            error.message || '未知错误',
            error.stack,
            { event: args[0] }
          );
          defaultErrorHandler.handleError(eventError);
          throw eventError;
        });
      }
      
      return result;
    } catch (error: any) {
      const eventError = defaultErrorHandler.createError(
        errorType,
        severity,
        error.message || '未知错误',
        error.stack,
        { event: args[0] }
      );
      defaultErrorHandler.handleError(eventError);
      throw eventError;
    }
  }) as T;
} 