import React from 'react';

const ITEMS = [
  { id: 'item001', name: '铁剑' },
  { id: 'item002', name: '治疗药水' },
  { id: 'item003', name: '皮甲' },
  { id: 'item004', name: '魔法卷轴' },
];

export default function ItemSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };
  return (
    <div>
      <h4>物品选择</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ITEMS.map(item => (
          <li key={item.id}>
            <button
              type="button"
              style={{
                margin: 4,
                background: selected.includes(item.id) ? '#4caf50' : '#eee',
                color: selected.includes(item.id) ? '#fff' : '#333',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '4px 12px',
                cursor: 'pointer',
              }}
              onClick={() => toggle(item.id)}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 