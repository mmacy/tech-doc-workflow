import React from 'react';
import { AgentRuntimeState, AgentStatus } from '../types';
import Spinner from './Spinner';

interface AgentCardProps {
  agentState: AgentRuntimeState;
}

const getStatusColorAndIcon = (status: AgentStatus): {bgColor: string, textColor: string, icon: React.ReactNode} => {
  switch (status) {
    case AgentStatus.PENDING:
      return { bgColor: 'bg-slate-700', textColor: 'text-slate-300', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    case AgentStatus.WORKING:
    case AgentStatus.REVIEWING:
      return { bgColor: 'bg-sky-700', textColor: 'text-sky-100', icon: <Spinner size="sm" color="text-sky-300" /> };
    case AgentStatus.WAITING:
      return { bgColor: 'bg-purple-700', textColor: 'text-purple-100', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    case AgentStatus.APPROVED:
    case AgentStatus.COMPLETED:
      return { bgColor: 'bg-green-700', textColor: 'text-green-100', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    case AgentStatus.SKIPPED_MAX_LOOPS:
      return { bgColor: 'bg-amber-700', textColor: 'text-amber-100', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg> };
    case AgentStatus.FAILED:
       return { bgColor: 'bg-red-700', textColor: 'text-red-100', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> };
    default:
      return { bgColor: 'bg-slate-600', textColor: 'text-slate-200', icon: null };
  }
};


const AgentCard: React.FC<AgentCardProps> = ({ agentState }) => {
  const {bgColor, textColor, icon} = getStatusColorAndIcon(agentState.status);

  return (
    <div className={`p-4 rounded-lg shadow-md ${bgColor} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`text-md font-semibold ${textColor}`}>{agentState.id}</h4>
        <div className={`text-xs px-2 py-1 rounded-full ${bgColor} ${textColor} border border-current/50 flex items-center space-x-1.5`}>
          {icon}
          <span>{agentState.status}</span>
        </div>
      </div>
      <p className={`text-xs ${textColor} opacity-80`}>{agentState.description}</p>
      {agentState.loops !== undefined && agentState.role === 'REVIEWER' && (
        <p className={`text-xs ${textColor} opacity-70 mt-1`}>Revision loops: {agentState.loops} / {agentState.defaultMaxLoops}</p>
      )}
      {agentState.feedbackGiven && (
        <div className="mt-2 pt-2 border-t border-current/20">
            <p className={`text-xs font-medium ${textColor} opacity-90 mb-0.5`}>Feedback Provided:</p>
            <p className={`text-xs ${textColor} opacity-70 italic`}>{agentState.feedbackGiven.substring(0,100)}{agentState.feedbackGiven.length > 100 ? '...' : ''}</p>
        </div>
      )}
    </div>
  );
};

export default AgentCard;