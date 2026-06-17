import ProgramPanel from './ProgramPanel';
import PieChart from '../PieChart';

/**
 * Reusable 2/3 + 1/3 layout: stacked/bar chart on the left, pie chart on the right.
 * Used consistently across all program pages.
 */
function ProgramChartRow({ leftTitle, leftSubtitle, leftChart, rightTitle, rightSubtitle, rightData }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      <ProgramPanel title={leftTitle} subtitle={leftSubtitle} className="col-span-2">
        {leftChart}
      </ProgramPanel>
      <ProgramPanel title={rightTitle} subtitle={rightSubtitle}>
        <PieChart data={rightData} />
      </ProgramPanel>
    </div>
  );
}

export default ProgramChartRow;
