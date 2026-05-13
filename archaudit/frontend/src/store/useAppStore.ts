import { create } from 'zustand';

interface FileInfo {
  name: string;
  size: number;
  url?: string;
}

interface AnalysisResult {
  score: number;
  issues: string[];
  suggestions: string[];
  improved_structure: Record<string, any>;
  migration_script?: string;
}

interface AppState {
  fileInfo: FileInfo | null;
  structure: Record<string, any> | null;
  analysis: AnalysisResult | null;
  status: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';
  error: string | null;
  shareId: string | null;
  framework: string;

  setFileInfo: (info: FileInfo) => void;
  setFramework: (framework: string) => void;
  updateStructure: (newStructure: Record<string, any>) => void;
  setStatus: (status: AppState['status']) => void;
  setError: (error: string | null) => void;
  setResult: (data: { fileUrl: string; structure: any; analysis: AnalysisResult; shareId?: string }) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  fileInfo: null,
  structure: null,
  analysis: null,
  status: 'idle',
  error: null,
  shareId: null,
  framework: "Generic Software Project",

  setFileInfo: (info) => set({ fileInfo: info }),
  setFramework: (framework) => set({ framework }),
  updateStructure: (newStructure) => set({ structure: newStructure }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setResult: (data) => set((state) => ({
    fileInfo: state.fileInfo ? { ...state.fileInfo, url: data.fileUrl } : null,
    structure: data.structure,
    analysis: data.analysis,
    shareId: data.shareId || null,
    status: 'success',
  })),
  reset: () => set({
    fileInfo: null,
    structure: null,
    analysis: null,
    status: 'idle',
    error: null,
    shareId: null,
  }),
}));
