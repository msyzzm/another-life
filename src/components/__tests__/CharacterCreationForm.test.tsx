import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacterCreationForm from '../CharacterCreationForm';

describe('CharacterCreationForm', () => {
  it('renders all sections', () => {
    render(<CharacterCreationForm />);
    expect(screen.getByText('属性分配')).toBeInTheDocument();
    expect(screen.getByText('职业：')).toBeInTheDocument();
    expect(screen.getByText('物品选择')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建角色' })).toBeInTheDocument();
  });

  it('prevents submit if no profession selected', () => {
    render(<CharacterCreationForm />);
    fireEvent.click(screen.getByRole('button', { name: '创建角色' }));
    expect(screen.getByText('请选择职业')).toBeInTheDocument();
  });

  it('prevents selecting more than 3 items', () => {
    render(<CharacterCreationForm />);
    // 选择职业
    fireEvent.change(screen.getByLabelText('职业：'), { target: { value: '战士' } });
    // 选择4个物品
    const buttons = screen.getAllByRole('button', { name: /铁剑|治疗药水|皮甲|魔法卷轴/ });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[3]);
    expect(screen.getByText('最多只能选择3件物品')).toBeInTheDocument();
    // 创建角色按钮应禁用
    expect(screen.getByRole('button', { name: '创建角色' })).toBeDisabled();
  });

  it('allows valid submit', () => {
    render(<CharacterCreationForm />);
    // 选择职业
    fireEvent.change(screen.getByLabelText('职业：'), { target: { value: '法师' } });
    // 选择2个物品
    const buttons = screen.getAllByRole('button', { name: /铁剑|治疗药水|皮甲|魔法卷轴/ });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    // 提交表单
    window.alert = jest.fn();
    fireEvent.click(screen.getByRole('button', { name: '创建角色' }));
    expect(window.alert).toHaveBeenCalledWith('角色创建成功！');
  });
}); 