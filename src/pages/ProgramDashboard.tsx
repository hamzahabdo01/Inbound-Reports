import { useState, useEffect } from 'react';
import ProgramChips from '../components/program/ProgramChips';
import ChildHealth from './programs/ChildHealth';
import ClinicalChemistry from './programs/ClinicalChemistry';
import LlinProgram from './programs/LLIN';
import DroughtImpact from './programs/DroughtImpact';

function OrgToggle({ value, onChange }: any) {
  const isHPR = value === 'HPR';
  return (
    <div className="border-b border-outline-variant/30 py-2 flex items-center gap-3 justify-end">
      <button
        onClick={() => onChange(isHPR ? 'RDF' : 'HPR')}
        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F54] cursor-pointer ${
          isHPR ? 'bg-[#0B4F54]' : 'bg-[#86BFC5]'
        }`}
        aria-label="Toggle HPR/RDF"
        role="switch"
        aria-checked={isHPR}
      >
        <span
          className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
            isHPR ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('HPR')}
          className={`text-sm font-bold tracking-wide transition-colors duration-200 cursor-pointer ${
            isHPR ? 'text-[#0B4F54]' : 'text-[#707979] hover:text-[#404849]'
          }`}
        >
          HPR
        </button>
        <span className="text-[#CFD8DC] text-sm font-light select-none">/</span>
        <span
          className={`text-sm font-bold tracking-wide transition-colors duration-200 ${
            !isHPR ? 'text-[#0B4F54]' : 'text-[#707979]'
          }`}
        >
          RDF
        </span>
      </div>
    </div>
  );
}

function ProgramDashboard() {
  const [activeProgram, setActiveProgram] = useState('Child Health');
  const [programType, setProgramType] = useState('HPR');

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeProgram]);

  const renderProgram = () => {
    switch (activeProgram) {
      case 'Child Health':
        return <ChildHealth />;
      case 'Clinical Chemistry':
        return <ClinicalChemistry programType={programType} />;
      case 'LLIN':
        return <LlinProgram />;
      case 'Drought Impact':
        return <DroughtImpact />;
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
          <OrgToggle value={programType} onChange={setProgramType} />
        )}
      </div>
      {renderProgram()}
    </div>
  );
}

export default ProgramDashboard;
