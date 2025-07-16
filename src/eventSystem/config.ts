/**
 * 事件系统配置模块
 * 集中管理事件系统的各种配置选项
 */

export interface EventSystemConfig {
  /** 事件循环配置 */
  loop: {
    /** 默认最大事件数 */
    defaultMaxEvents: number;
    /** 默认是否使用权重 */
    defaultUseWeights: boolean;
    /** 默认概率阈值 */
    defaultProbabilityThreshold: number;
  };

  /** 权重计算配置 */
  weights: {
    /** 力量属性权重系数 */
    strengthMultiplier: number;
    /** 智力属性权重系数 */
    intelligenceMultiplier: number;
    /** 最小权重值 */
    minWeight: number;
    /** 最大权重值 */
    maxWeight: number;
  };

  /** 事件类型优先级配置 */
  priorities: {
    battle: number;
    findItem: number;
    levelUp: number;
    custom: number;
  };

  /** 调试和日志配置 */
  debug: {
    /** 是否启用详细日志 */
    enableVerboseLogging: boolean;
    /** 是否启用性能监控 */
    enablePerformanceMonitoring: boolean;
    /** 是否启用事件验证 */
    enableEventValidation: boolean;
  };

  /** 安全配置 */
  safety: {
    /** 是否启用深拷贝保护 */
    enableDeepCopy: boolean;
    /** 是否启用条件预验证 */
    enablePreValidation: boolean;
    /** 最大递归深度 */
    maxRecursionDepth: number;
  };
}

/**
 * 默认配置
 */
export const defaultConfig: EventSystemConfig = {
  loop: {
    defaultMaxEvents: 3,
    defaultUseWeights: true,
    defaultProbabilityThreshold: 0.1
  },
  weights: {
    strengthMultiplier: 1.2,
    intelligenceMultiplier: 1.15,
    minWeight: 0.1,
    maxWeight: 10.0
  },
  priorities: {
    battle: 2,
    findItem: 2,
    levelUp: 5,
    custom: 3
  },
  debug: {
    enableVerboseLogging: false,
    enablePerformanceMonitoring: false,
    enableEventValidation: true
  },
  safety: {
    enableDeepCopy: true,
    enablePreValidation: true,
    maxRecursionDepth: 10
  }
};

/**
 * 事件系统配置管理器
 */
export class EventSystemConfigManager {
  private static instance: EventSystemConfigManager;
  private config: EventSystemConfig;

  private constructor() {
    this.config = { ...defaultConfig };
  }

  /**
   * 获取配置管理器实例（单例）
   */
  static getInstance(): EventSystemConfigManager {
    if (!EventSystemConfigManager.instance) {
      EventSystemConfigManager.instance = new EventSystemConfigManager();
    }
    return EventSystemConfigManager.instance;
  }

  /**
   * 获取当前配置
   */
  getConfig(): EventSystemConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<EventSystemConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      // 深度合并嵌套对象
      loop: { ...this.config.loop, ...(updates.loop || {}) },
      weights: { ...this.config.weights, ...(updates.weights || {}) },
      priorities: { ...this.config.priorities, ...(updates.priorities || {}) },
      debug: { ...this.config.debug, ...(updates.debug || {}) },
      safety: { ...this.config.safety, ...(updates.safety || {}) }
    };
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...defaultConfig };
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof EventSystemConfig>(key: K): EventSystemConfig[K] {
    return this.config[key];
  }

  /**
   * 设置特定配置项
   */
  set<K extends keyof EventSystemConfig>(key: K, value: EventSystemConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * 验证配置的有效性
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证事件循环配置
    if (this.config.loop.defaultMaxEvents <= 0) {
      errors.push('defaultMaxEvents must be greater than 0');
    }
    if (this.config.loop.defaultProbabilityThreshold < 0 || this.config.loop.defaultProbabilityThreshold > 1) {
      errors.push('defaultProbabilityThreshold must be between 0 and 1');
    }

    // 验证权重配置
    if (this.config.weights.minWeight < 0) {
      errors.push('minWeight must be non-negative');
    }
    if (this.config.weights.maxWeight <= this.config.weights.minWeight) {
      errors.push('maxWeight must be greater than minWeight');
    }

    // 验证安全配置
    if (this.config.safety.maxRecursionDepth <= 0) {
      errors.push('maxRecursionDepth must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出配置到JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson) as EventSystemConfig;
      this.config = imported;
      const validation = this.validateConfig();
      if (!validation.valid) {
        console.warn('Imported config has validation errors:', validation.errors);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }
}

/**
 * 预设配置模板
 */
export class ConfigPresets {
  /**
   * 调试模式配置
   */
  static getDebugConfig(): Partial<EventSystemConfig> {
    return {
      debug: {
        enableVerboseLogging: true,
        enablePerformanceMonitoring: true,
        enableEventValidation: true
      },
      loop: {
        defaultMaxEvents: 1,
        defaultUseWeights: false,
        defaultProbabilityThreshold: 0
      }
    };
  }

  /**
   * 高性能模式配置
   */
  static getPerformanceConfig(): Partial<EventSystemConfig> {
    return {
      debug: {
        enableVerboseLogging: false,
        enablePerformanceMonitoring: false,
        enableEventValidation: false
      },
      safety: {
        enableDeepCopy: false,
        enablePreValidation: false,
        maxRecursionDepth: 5
      },
      loop: {
        defaultMaxEvents: 5,
        defaultUseWeights: true,
        defaultProbabilityThreshold: 0.2
      }
    };
  }

  /**
   * 安全模式配置
   */
  static getSafeConfig(): Partial<EventSystemConfig> {
    return {
      safety: {
        enableDeepCopy: true,
        enablePreValidation: true,
        maxRecursionDepth: 3
      },
      debug: {
        enableVerboseLogging: true,
        enablePerformanceMonitoring: true,
        enableEventValidation: true
      },
      loop: {
        defaultMaxEvents: 2,
        defaultUseWeights: true,
        defaultProbabilityThreshold: 0.3
      }
    };
  }

  /**
   * 快速游戏模式配置
   */
  static getFastGameConfig(): Partial<EventSystemConfig> {
    return {
      loop: {
        defaultMaxEvents: 7,
        defaultUseWeights: true,
        defaultProbabilityThreshold: 0.05
      },
      weights: {
        strengthMultiplier: 1.5,
        intelligenceMultiplier: 1.3,
        minWeight: 0.5,
        maxWeight: 15.0
      }
    };
  }
}

// 导出全局配置实例
export const configManager = EventSystemConfigManager.getInstance();

// 便捷函数
export const getConfig = () => configManager.getConfig();
export const updateConfig = (updates: Partial<EventSystemConfig>) => configManager.updateConfig(updates);

export default EventSystemConfigManager; 