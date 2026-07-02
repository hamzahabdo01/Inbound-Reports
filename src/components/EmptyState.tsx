import { memo } from 'react';

function EmptyState({ colSpan, message, icon }: any) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center text-body-md text-on-surface-variant">
        {icon && <i className={`fa-solid ${icon} text-xl mb-2 block`}></i>}
        {message || 'No data found'}
      </td>
    </tr>
  );
}

export default memo(EmptyState);
