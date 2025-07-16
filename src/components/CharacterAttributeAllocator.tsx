import React, { useState } from 'react';

interface AttributeState {
  strength: number;
  agility: number;
  intelligence: number;
  stamina: number;
}

const ATTRIBUTE_KEYS: (keyof AttributeState)[] = [
  'strength',
  'agility',
  'intelligence',
  'stamina',
];

const INITIAL_POINTS = 20;
const MIN_ATTRIBUTE = 1;

export default function CharacterAttributeAllocator({
  initialAttributes = { strength: 5, agility: 5, intelligence: 5, stamina: 5 },
  onChange,
}: {
  initialAttributes?: AttributeState;
  onChange?: (attributes: AttributeState) => void;
}) {
  const [attributes, setAttributes] = useState<AttributeState>(initialAttributes);
  const totalAllocated = ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key], 0);
  const remaining = INITIAL_POINTS - (totalAllocated - ATTRIBUTE_KEYS.length * MIN_ATTRIBUTE);

  const handleChange = (key: keyof AttributeState, delta: number) => {
    setAttributes(prev => {
      const next = { ...prev };
      const newValue = next[key] + delta;
      if (newValue < MIN_ATTRIBUTE) return prev;
      if (delta > 0 && remaining <= 0) return prev;
      next[key] = newValue;
      onChange?.(next);
      return next;
    });
  };

  return (
    <div>
      <h3>属性分配</h3>
      <div>剩余点数：{remaining}</div>
      <table>
        <thead>
          <tr>
            <th>属性</th>
            <th>数值</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {ATTRIBUTE_KEYS.map(key => (
            <tr key={key}>
              <td>{key}</td>
              <td>{attributes[key]}</td>
              <td>
                <button onClick={() => handleChange(key, -1)} disabled={attributes[key] <= MIN_ATTRIBUTE}>-</button>
                <button onClick={() => handleChange(key, 1)} disabled={remaining <= 0}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 