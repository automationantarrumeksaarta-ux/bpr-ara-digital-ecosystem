import React from 'react';
import { Check, CircleDot, Circle } from 'lucide-react';

export type PipelineStageName = 
  | 'Loan Origination'
  | 'Field Survey'
  | 'Credit Analysis'
  | 'Collateral Appraisal'
  | 'Committee Approval'
  | 'Legal & Documents'
  | 'Disbursement';

interface Props {
  currentStage: PipelineStageName;
}

const PIPELINE_STAGES: PipelineStageName[] = [
  'Loan Origination',
  'Field Survey',
  'Credit Analysis',
  'Collateral Appraisal',
  'Committee Approval',
  'Legal & Documents',
  'Disbursement'
];

export const CreditPipelineHeader: React.FC<Props> = ({ currentStage }) => {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);

  return (
    <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          Credit Pipeline
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <span className="text-sm font-bold text-slate-800 dark:text-white">
          Current Stage: {currentStage}
        </span>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center justify-between min-w-[700px]">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={stage} className="flex flex-col items-center relative flex-1 group">
                {idx !== 0 && (
                  <div className={`absolute top-4 left-[-50%] w-full h-[2px] -z-10 transition-colors ${
                    isCompleted || isCurrent ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'
                  }`} />
                )}
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 z-10 bg-white dark:bg-slate-900 border-2 transition-colors ${
                  isCompleted ? 'border-primary text-primary bg-primary/10' :
                  isCurrent ? 'border-primary text-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' :
                  'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> :
                   isCurrent ? <CircleDot className="w-4 h-4" /> :
                   <Circle className="w-4 h-4" />}
                </div>
                
                <span className={`text-[10px] font-bold text-center px-1 transition-colors ${
                  isCurrent ? 'text-primary' : 
                  isCompleted ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
