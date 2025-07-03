
import React from 'react';
import { WorkflowLog, AgentName } from '../types';

interface WorkflowStatusLogProps {
  logs: WorkflowLog[];
}

const getIconForType = (type: WorkflowLog['type'], agent?: AgentName) => {
  switch (type) {
    case 'INFO':
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
    case 'ERROR':
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
    case 'SUCCESS':
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'AGENT_ACTION':
       // Simple hash function for agent color
      const agentColor = (agentName?: string) => {
        if (!agentName) return 'text-slate-400';
        let hash = 0;
        for (let i = 0; i < agentName.length; i++) {
          hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = ['text-indigo-400', 'text-purple-400', 'text-pink-400', 'text-teal-400'];
        return colors[Math.abs(hash) % colors.length];
      };
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${agentColor(agent)}`}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    default:
      return null;
  }
};

const WorkflowStatusLog: React.FC<WorkflowStatusLogProps> = ({ logs }) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-inner h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 mb-3 border-b border-slate-700 pb-2">Workflow log</h3>
      <div ref={logContainerRef} className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {logs.length === 0 && <p className="text-slate-400 italic">Workflow not started yet.</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start text-sm p-2 bg-slate-700/50 rounded-md">
            <div className="mr-2 mt-0.5 shrink-0">{getIconForType(log.type, log.agent)}</div>
            <div className="flex-grow">
              <span className="text-slate-500 mr-2 text-xs">{log.timestamp}</span>
              {log.agent && <span className="font-semibold text-sky-300 mr-1">{log.agent}:</span>}
              <span className={`whitespace-pre-wrap ${log.type === 'ERROR' ? 'text-red-300' : 'text-slate-300'}`}>{log.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowStatusLog;
