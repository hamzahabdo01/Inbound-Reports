import { memo } from 'react';

function LoadingState({ message, fullScreen }: any) {
  const content = (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-24'}`}>
      <div className="text-body-md text-on-surface-variant">
        {message || 'Loading...'}
      </div>
    </div>
  );

  if (fullScreen) {
    return <div className="bg-surface">{content}</div>;
  }

  return content;
}

export default memo(LoadingState);
