import ProgramPanel from './ProgramPanel';
import PieChart from '../PieChart';
import IconButton from '../IconButton';

/**
 * Reusable 2/3 + 1/3 layout: stacked/bar chart on the left, pie chart on the right.
 * Used consistently across all program pages.
 * Automatically includes an ExpandButton beside any rightAction.
 */
function ProgramChartRow({ leftTitle, leftSubtitle, leftChart, leftAction, rightTitle, rightSubtitle, rightData, rightAction, rightExtra, rightLoading }: any) {
  const rightActions = (
    <div className="flex items-center gap-1">
      <IconButton variant="expand" data={rightData} title={rightTitle} />
      {rightAction}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <ProgramPanel title={leftTitle} subtitle={leftSubtitle} className="col-span-1 lg:col-span-2" action={leftAction}>
        {leftChart}
      </ProgramPanel>
      <ProgramPanel title={rightTitle} subtitle={rightSubtitle} action={rightActions}>
        {rightExtra && <div className="px-5 pt-3 pb-1">{rightExtra}</div>}
        {rightLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <PieChart data={rightData} />
        )}
      </ProgramPanel>
    </div>
  );
}

export default ProgramChartRow;
