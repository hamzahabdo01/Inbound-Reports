import ProgramPanel from './ProgramPanel';
import PieChart from '../PieChart';
import ExpandButton from '../ExpandButton';

/**
 * Reusable 2/3 + 1/3 layout: stacked/bar chart on the left, pie chart on the right.
 * Used consistently across all program pages.
 * Automatically includes an ExpandButton beside any rightAction.
 */
function ProgramChartRow({ leftTitle, leftSubtitle, leftChart, rightTitle, rightSubtitle, rightData, rightAction }) {
  const rightActions = (
    <div className="flex items-center gap-1">
      <ExpandButton data={rightData} title={rightTitle} />
      {rightAction}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-5">
      <ProgramPanel title={leftTitle} subtitle={leftSubtitle} className="col-span-2">
        {leftChart}
      </ProgramPanel>
      <ProgramPanel title={rightTitle} subtitle={rightSubtitle} action={rightActions}>
        <PieChart data={rightData} />
      </ProgramPanel>
    </div>
  );
}

export default ProgramChartRow;
