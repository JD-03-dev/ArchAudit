import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface TreeNodeProps {
  name: string;
  data: any;
  depth?: number;
  improvedStructure?: Record<string, any>;
  path?: string[];
  onDelete?: (path: string[]) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ name, data, depth = 0, improvedStructure, path = [], onDelete }) => {
  const [isOpen, setIsOpen] = useState(depth < 2); // Auto-open first two levels
  const currentPath = [...path, name];
  
  const isFile = data === true;
  
  let statusColor = "";
  let iconColor = "text-blue-400";

  if (improvedStructure) {
    if (improvedStructure[name] !== undefined) {
      statusColor = "text-emerald-400"; // Kept in new structure (good)
      iconColor = "text-emerald-500";
    } else {
      statusColor = "text-red-400/60 line-through opacity-50"; // Removed in new structure (issue)
      iconColor = "text-red-500/50";
    }
  }

  if (isFile) {
    return (
      <div 
        className={cn("flex items-center py-1.5 hover:bg-white/5 rounded-lg px-2 cursor-default transition-colors group", statusColor)}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <File size={16} className={cn("mr-2.5", statusColor ? iconColor : "text-slate-500 group-hover:text-slate-400")} />
        <span className="text-sm font-medium tracking-tight">{name}</span>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(currentPath); }}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
            title="Remove item"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div 
        className={cn("flex items-center py-1.5 hover:bg-white/5 rounded-lg px-2 cursor-pointer group transition-colors", statusColor)}
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="w-5 flex justify-center text-slate-500 group-hover:text-slate-300 transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {isOpen ? (
          <FolderOpen size={16} className={cn("mr-2.5", statusColor ? iconColor : "text-indigo-400 group-hover:text-indigo-300")} />
        ) : (
          <Folder size={16} className={cn("mr-2.5", statusColor ? iconColor : "text-indigo-400 group-hover:text-indigo-300")} />
        )}
        <span className="text-sm font-semibold tracking-tight">{name}</span>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(currentPath); }}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
            title="Remove folder"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="flex flex-col mt-0.5">
          {Object.entries(data)
            .sort(([aName, aVal], [bName, bVal]) => {
              if (aVal === true && bVal !== true) return 1;
              if (aVal !== true && bVal === true) return -1;
              return aName.localeCompare(bName);
            })
            .map(([childName, childData]) => (
            <TreeNode 
              key={childName} 
              name={childName} 
              data={childData} 
              depth={depth + 1}
              path={currentPath}
              onDelete={onDelete}
              improvedStructure={improvedStructure ? (typeof improvedStructure[name] === 'object' ? improvedStructure[name] : undefined) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface StructureViewerProps {
  title: string;
  structure: Record<string, any>;
  compareWith?: Record<string, any>;
  className?: string;
  onDelete?: (path: string[]) => void;
}

export function StructureViewer({ title, structure, compareWith, className, onDelete }: StructureViewerProps) {
  if (!structure || Object.keys(structure).length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm italic">
        No structure data available.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-1 flex-1">
        {Object.entries(structure)
          .sort(([aName, aVal], [bName, bVal]) => {
            if (aVal === true && bVal !== true) return 1;
            if (aVal !== true && bVal === true) return -1;
            return aName.localeCompare(bName);
          })
          .map(([name, data]) => (
          <TreeNode 
            key={name} 
            name={name} 
            data={data} 
            path={[]}
            onDelete={onDelete}
            improvedStructure={compareWith}
          />
        ))}
      </div>
    </div>
  );
}
