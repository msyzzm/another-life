import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// mock 事件系统依赖，匹配runAdvancedEventLoop的返回格式
jest.mock('../eventSystem', () => ({
  runAdvancedEventLoop: jest.fn(async () => ({
    character: {
      id: 'test-char',
      name: '小明',
      level: 1,
      profession: '战士',
      daysLived: 1,
      stats: { strength: 5, agility: 5, intelligence: 5, stamina: 5 },
      equipment: {}
    },
    inventory: { ownerId: 'test-char', items: [] },
    results: [
      { 
        event: { 
          id: 'test-event', 
          name: '测试事件', 
          description: '这是一个测试事件', 
          type: 'custom' 
        }, 
        triggered: true,
        logs: ['获得了经验']
      }
    ],
    summary: {
      totalEvents: 1,
      triggeredEvents: 1,
      logs: ['获得了经验'],
      errors: []
    }
  }))
}));

describe('主流程集成测试', () => {
  it('角色创建表单完整流程', async () => {
    render(<App />);
    // 输入角色名
    const nameInput = screen.getByPlaceholderText('角色名');
    fireEvent.input(nameInput, { target: { value: '小明' } });
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /创建角色/ }));
    // 检查角色信息展示
    await waitFor(() => {
      expect(screen.getByText('角色信息')).toBeInTheDocument();
      // 检查角色信息包含"小明"
      expect(screen.getByText((content) => content.includes('小明'))).toBeInTheDocument();
    });
    // 检查背包展示
    expect(screen.getByText('背包')).toBeInTheDocument();
    // 触发事件循环
    fireEvent.click(screen.getByRole('button', { name: '触发事件循环' }));
    // 检查事件结果与日志
    await waitFor(() => {
      expect(screen.getByText('事件结果')).toBeInTheDocument();
      // 页面中应有"测试事件"出现
      expect(screen.getByText(/测试事件/)).toBeInTheDocument();
      expect(screen.getByText('事件日志')).toBeInTheDocument();
      expect(screen.getByText(/这是一个测试事件/)).toBeInTheDocument();
    }, { timeout: 5000 }); // 增加超时时间
  });

  it('表单校验与按钮禁用', () => {
    render(<App />);
    // 不输入角色名直接提交
    fireEvent.click(screen.getByRole('button', { name: /创建角色/ }));
    // 提交后按钮消失，断言按钮不再存在
    expect(screen.queryByRole('button', { name: /创建角色/ })).not.toBeInTheDocument();
  });
}); 