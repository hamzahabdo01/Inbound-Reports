import { useState } from 'react';
import ProgramChips from '../components/program/ProgramChips';
import ProgramTypeFilter from '../components/program/ProgramTypeFilter';
import ChildHealth from './programs/ChildHealth';
import ClinicalChemistry from './programs/ClinicalChemistry';

function ProgramDashboard() {
  const [activeProgram, setActiveProgram] = useState('Child Health');
  const [programType, setProgramType] = useState('Health Program');

  const renderProgram = () => {
    switch (activeProgram) {
      case 'Child Health':
        return <ChildHealth />;
      case 'Clinical Chemistry':
        return <ClinicalChemistry programType={programType} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <i className="fa-solid fa-code-branch text-2xl" />
            </div>
            <h2 className="text-headline-md font-bold text-on-surface">{activeProgram}</h2>
            <p className="text-body-md text-on-surface-variant max-w-md">
              This program dashboard is under development.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Single sticky block — chips always, filter only for Clinical Chemistry */}
      <div className="sticky top-0 z-10 bg-[#F6FAFC] -mx-lg px-lg">
        <ProgramChips active={activeProgram} onChange={setActiveProgram} />
        {activeProgram === 'Clinical Chemistry' && (
          <ProgramTypeFilter value={programType} onChange={setProgramType} />
        )}
      </div>
      {renderProgram()}
    </div>
  );
}

export default ProgramDashboard;
