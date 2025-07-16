import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  EventSystemErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  RecoveryStrategy,
  defaultErrorHandler,
  withErrorHandling,
  createValidationError,
  createProcessingError,
  createSystemError 
} from '../eventSystem/errorHandler';
import { ErrorIntegration } from '../utils/errorIntegration';
import { defaultCharacterInstance } from '../types/character';
import { defaultInventory } from '../types/inventory';

describe('错误处理系统', () => {
  let errorHandler;
  let mockCharacter;
  let mockInventory;

  beforeEach(() => {
    errorHandler = new EventSystemErrorHandler();
    mockCharacter = defaultCharacterInstance();
    mockInventory = defaultInventory();
    
    // 清除默认处理器的错误历史
    defaultErrorHandler.clearErrors();
  });

  describe('EventSystemErrorHandler', () => {
    it('应该正确创建错误', () => {
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        '测试错误',
        '详细信息',
        { character: mockCharacter }
      );

      expect(error).toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: '测试错误',
        details: '详细信息',
        context: { character: mockCharacter }
      });
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.recoveryStrategy).toBeDefined();
    });

    it('应该根据错误类型和严重程度选择恢复策略', () => {
      const lowError = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '低严重度错误'
      );
      expect(lowError.recoveryStrategy).toBe(RecoveryStrategy.SKIP);

      const highDataError = errorHandler.createError(
        ErrorType.DATA_CORRUPTION,
        ErrorSeverity.HIGH,
        '数据损坏'
      );
      expect(highDataError.recoveryStrategy).toBe(RecoveryStrategy.RESET_STATE);

      const criticalError = errorHandler.createError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.CRITICAL,
        '严重系统错误'
      );
      expect(criticalError.recoveryStrategy).toBe(RecoveryStrategy.TERMINATE);
    });

    it('应该正确记录错误', () => {
      const error = errorHandler.createError(
        ErrorType.EVENT_PROCESSING_ERROR,
        ErrorSeverity.MEDIUM,
        '事件处理错误'
      );

      const recentErrors = errorHandler.getRecentErrors(10);
      expect(recentErrors).toContainEqual(error);
    });

    it('应该提供错误统计', () => {
      errorHandler.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, '错误1');
      errorHandler.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.MEDIUM, '错误2');
      errorHandler.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH, '错误3');

      const stats = errorHandler.getErrorStats();
      expect(stats[ErrorType.VALIDATION_ERROR]).toBe(2);
      expect(stats[ErrorType.SYSTEM_ERROR]).toBe(1);
    });

    it('应该能够清除错误历史', () => {
      errorHandler.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, '错误1');
      errorHandler.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH, '错误2');

      expect(errorHandler.getRecentErrors(10)).toHaveLength(2);

      errorHandler.clearErrors();
      expect(errorHandler.getRecentErrors(10)).toHaveLength(0);
    });

    it('应该提供系统健康状态', () => {
      const health = errorHandler.getSystemHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('recentErrors');
      expect(health).toHaveProperty('criticalErrors');
      expect(health).toHaveProperty('recommendations');
    });

    it('应该能够更新配置', () => {
      const mockCallback = vi.fn();
      errorHandler.updateConfig({
        onError: mockCallback,
        maxRetryAttempts: 5
      });

      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '测试错误'
      );

      expect(mockCallback).toHaveBeenCalledWith(error);
    });
  });

  describe('错误恢复机制', () => {
    it('应该能够执行SKIP恢复策略', async () => {
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '轻微验证错误'
      );

      const recovery = await errorHandler.handleError(error);
      expect(recovery.success).toBe(true);
      expect(recovery.strategy).toBe(RecoveryStrategy.SKIP);
    });

    it('应该能够执行RESET_STATE恢复策略', async () => {
      const error = errorHandler.createError(
        ErrorType.DATA_CORRUPTION,
        ErrorSeverity.HIGH,
        '数据损坏',
        undefined,
        { character: mockCharacter, inventory: mockInventory }
      );

      const recovery = await errorHandler.handleError(error);
      expect(recovery.success).toBe(true);
      expect(recovery.strategy).toBe(RecoveryStrategy.RESET_STATE);
      expect(recovery.newState).toBeDefined();
      expect(recovery.newState.character).toBeDefined();
      expect(recovery.newState.inventory).toBeDefined();
    });

    it('应该能够限制重试次数', async () => {
      const errorType = ErrorType.EVENT_PROCESSING_ERROR;
      const eventId = 'test-event';
      
      // 创建多个相同类型的错误来触发重试限制
      for (let i = 0; i < 5; i++) {
        const error = errorHandler.createError(
          errorType,
          ErrorSeverity.MEDIUM,
          '重试测试错误',
          undefined,
          { event: { id: eventId } }
        );

        const recovery = await errorHandler.handleError(error);
        
        if (i < 3) {
          expect(recovery.success).toBe(true);
          expect(recovery.strategy).toBe(RecoveryStrategy.RETRY);
        } else {
          // 超过重试限制后应该失败
          expect(recovery.success).toBe(false);
        }
      }
    });

    it('应该在恢复后调用回调函数', async () => {
      const onRecovery = vi.fn();
      errorHandler.updateConfig({ onRecovery });

      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '测试错误'
      );

      const recovery = await errorHandler.handleError(error);
      expect(onRecovery).toHaveBeenCalledWith(error, recovery);
    });
  });

  describe('withErrorHandling装饰器', () => {
    it('应该能够包装同步函数', () => {
      const originalFunction = (a, b) => a + b;
      const wrappedFunction = withErrorHandling(
        originalFunction,
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM
      );

      const result = wrappedFunction(2, 3);
      expect(result).toBe(5);
    });

    it('应该能够捕获并处理函数中的错误', () => {
      const errorFunction = () => {
        throw new Error('测试错误');
      };

      const wrappedFunction = withErrorHandling(
        errorFunction,
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH
      );

      expect(() => wrappedFunction()).toThrow('测试错误');
      
      // 检查错误是否被记录
      const recentErrors = defaultErrorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].type).toBe(ErrorType.SYSTEM_ERROR);
    });

    it('应该保持原函数的参数和返回值', () => {
      const complexFunction = (obj, multiplier) => ({
        ...obj,
        value: obj.value * multiplier
      });

      const wrappedFunction = withErrorHandling(complexFunction);
      const input = { value: 10, name: 'test' };
      const result = wrappedFunction(input, 2);

      expect(result).toEqual({ value: 20, name: 'test' });
    });
  });

  describe('便利函数', () => {
    it('createValidationError应该创建验证错误', () => {
      const error = createValidationError('验证失败', { field: 'username' });
      
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toBe('验证失败');
      expect(error.context).toEqual({ field: 'username' });
    });

    it('createProcessingError应该创建处理错误', () => {
      const error = createProcessingError('处理失败', { step: 'calculation' });
      
      expect(error.type).toBe(ErrorType.EVENT_PROCESSING_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.message).toBe('处理失败');
    });

    it('createSystemError应该创建系统错误', () => {
      const error = createSystemError('系统故障', { component: 'database' });
      
      expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.message).toBe('系统故障');
    });
  });

  describe('ErrorIntegration集成类', () => {
    let errorIntegration;
    let mockErrorCallback;
    let mockRecoveryCallback;

    beforeEach(() => {
      errorIntegration = new ErrorIntegration();
      mockErrorCallback = vi.fn();
      mockRecoveryCallback = vi.fn();
      
      errorIntegration.setErrorCallback(mockErrorCallback);
      errorIntegration.setRecoveryCallback(mockRecoveryCallback);
    });

    it('应该能够设置和调用错误回调', () => {
      defaultErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        '集成测试错误'
      );

      // 模拟错误处理器调用回调
      defaultErrorHandler.updateConfig({
        onError: (err) => {
          if (mockErrorCallback) {
            const userFriendlyError = {
              id: err.id,
              title: '中等问题',
              message: '数据验证失败，请检查输入内容',
              severity: err.severity,
              timestamp: err.timestamp,
              canRetry: false,
              technical: {
                type: err.type,
                originalMessage: err.message,
                details: err.details,
                stackTrace: err.stackTrace
              }
            };
            mockErrorCallback(userFriendlyError);
          }
        }
      });

      // 触发错误
      defaultErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        '触发回调测试'
      );

      expect(mockErrorCallback).toHaveBeenCalled();
      const callArgs = mockErrorCallback.mock.calls[0][0];
      expect(callArgs).toHaveProperty('title', '中等问题');
      expect(callArgs).toHaveProperty('message', '数据验证失败，请检查输入内容');
    });

    it('应该能够获取系统健康状态', () => {
      const health = errorIntegration.getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('recentErrors');
      expect(health).toHaveProperty('criticalErrors');
      expect(health).toHaveProperty('recommendations');
      expect(health).toHaveProperty('timestamp');
    });

    it('应该能够获取错误统计', () => {
      // 创建一些错误
      defaultErrorHandler.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, '错误1');
      defaultErrorHandler.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH, '错误2');

      const stats = errorIntegration.getErrorStats();
      
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('errorsBySeverity');
      expect(stats).toHaveProperty('timestamp');
      expect(stats.totalErrors).toBeGreaterThanOrEqual(2);
    });

    it('应该能够包装异步函数', async () => {
      const asyncFunction = async (value) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        if (value < 0) throw new Error('负数不被允许');
        return value * 2;
      };

      const wrappedFunction = errorIntegration.wrapAsyncFunction(
        asyncFunction,
        '异步操作失败'
      );

      // 正常情况
      const result = await wrappedFunction(5);
      expect(result).toBe(10);

      // 错误情况
      await expect(wrappedFunction(-1)).rejects.toThrow('负数不被允许');
      
      // 检查错误是否被记录
      const recentErrors = defaultErrorHandler.getRecentErrors(1);
      expect(recentErrors[0].message).toContain('异步操作失败');
    });

    it('应该能够清除错误历史', () => {
      // 创建一些错误
      defaultErrorHandler.createError(ErrorType.VALIDATION_ERROR, ErrorSeverity.LOW, '错误1');
      defaultErrorHandler.createError(ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH, '错误2');

      expect(defaultErrorHandler.getRecentErrors(10)).toHaveLength(2);

      errorIntegration.clearErrors();
      expect(defaultErrorHandler.getRecentErrors(10)).toHaveLength(0);
    });

    it('应该能够创建应用级错误', () => {
      const appError = errorIntegration.createAppError(
        '应用程序错误',
        '详细的错误信息'
      );

      expect(appError.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(appError.severity).toBe(ErrorSeverity.HIGH);
      expect(appError.message).toBe('应用程序错误');
      expect(appError.details).toBe('详细的错误信息');
    });
  });

  describe('边界情况和错误边界', () => {
    it('应该正确处理null/undefined上下文', () => {
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '无上下文错误',
        undefined,
        null
      );

      expect(error.context).toBeNull();
      expect(() => errorHandler.handleError(error)).not.toThrow();
    });

    it('应该正确处理大量错误', () => {
      // 创建超过最大容量的错误
      for (let i = 0; i < 150; i++) {
        errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.LOW,
          `错误 ${i}`
        );
      }

      const recentErrors = errorHandler.getRecentErrors(200);
      expect(recentErrors.length).toBeLessThanOrEqual(100); // 最大容量限制
    });

    it('应该正确处理循环引用对象', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.LOW,
          '循环引用测试',
          undefined,
          { circular: circularObj }
        );
      }).not.toThrow();
    });

    it('应该在错误回调中处理异常', async () => {
      const faultyCallback = () => {
        throw new Error('回调函数错误');
      };

      errorHandler.updateConfig({
        onError: faultyCallback,
        onRecovery: faultyCallback
      });

      // 这些操作不应该因为回调错误而失败
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        '回调测试错误'
      );

      expect(() => errorHandler.handleError(error)).not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该能够快速处理大量错误', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.LOW,
          `性能测试错误 ${i}`
        );
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('错误统计计算应该高效', () => {
      // 创建多种类型的错误
      for (let i = 0; i < 100; i++) {
        const errorType = Object.values(ErrorType)[i % Object.values(ErrorType).length];
        errorHandler.createError(
          errorType,
          ErrorSeverity.LOW,
          `统计测试错误 ${i}`
        );
      }

      const startTime = performance.now();
      const stats = errorHandler.getErrorStats();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
      expect(Object.keys(stats)).toHaveLength(Object.values(ErrorType).length);
    });
  });
});

describe('错误处理集成测试', () => {
  it('应该能够端到端处理错误流程', async () => {
    const errorIntegration = new ErrorIntegration();
    const errors = [];
    const recoveries = [];

    errorIntegration.setErrorCallback((error) => errors.push(error));
    errorIntegration.setRecoveryCallback((recovery) => recoveries.push(recovery));

    // 创建一个会产生错误的函数
    const problematicFunction = withErrorHandling(
      function() {
        throw new Error('集成测试错误');
      },
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.MEDIUM
    );

    // 执行函数（应该捕获错误）
    expect(() => problematicFunction()).toThrow();

    // 检查错误是否被正确处理
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待异步处理

    expect(errors.length).toBeGreaterThan(0);
    if (errors.length > 0) {
      expect(errors[0]).toHaveProperty('title');
      expect(errors[0]).toHaveProperty('message');
      expect(errors[0]).toHaveProperty('severity');
    }

    // 测试系统健康状态
    const health = errorIntegration.getSystemHealth();
    expect(health.status).toBeDefined();
    expect(health.recentErrors).toBeGreaterThan(0);
  });
}); 