import React, { useState } from 'react';
import CharacterAttributeAllocator from './CharacterAttributeAllocator';
import ItemSelector from './ItemSelector';

const MAX_ITEMS = 3;

export default function CharacterCreationForm() {
  const [attributes, setAttributes] = useState({ strength: 5, agility: 5, intelligence: 5, stamina: 5 });
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState('');

  const overItemLimit = items.length > MAX_ITEMS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overItemLimit) {
      setError('最多只能选择3件物品');
      return;
    }
    setError('');
    // 这里可以提交数据
    alert('角色创建成功！');
  };

  return (
    <form onSubmit={handleSubmit}>
      <CharacterAttributeAllocator initialAttributes={attributes} onChange={setAttributes} />
      <ItemSelector selected={items} onChange={ids => {
        setItems(ids);
        if (ids.length <= MAX_ITEMS) {
          setError('');
        } else {
          setError('最多只能选择3件物品');
        }
      }} />
      {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
      <button type="submit" disabled={overItemLimit}>创建角色</button>
    </form>
  );
} 