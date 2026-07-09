import { memo } from 'react';

function TabGroup({ tabs, activeTab, onChange, className }: any) {
  return (
    <div className={`flex flex-nowrap items-center gap-1 ${className || ''}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          {tab.icon && <i className={`fa-solid ${tab.icon} mr-2`}></i>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default memo(TabGroup);
