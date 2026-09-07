import React from 'react';
import AnalisisAgunan from './legacy-dashboards/AnalisisAgunan';

import { useApp } from '../../context/AppContext';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

export const CollateralAppraisalView: React.FC = () => {
  const { agunanData } = useApp();
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CreditPipelineHeader currentStage="Collateral Appraisal" />
      <AnalisisAgunan agunanList={agunanData} onAddAgunan={() => {}} onUpdateAgunan={() => {}} />
    </div>
  );
};
