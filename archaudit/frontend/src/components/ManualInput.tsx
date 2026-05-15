import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { parseTextToStructure } from "../utils/treeParser";
import {
  Play,
  ClipboardList,
  Info,
  HelpCircle,
  Copy,
  Check,
  Terminal,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { cn, API_URL } from "../lib/utils";

export function ManualInput() {
  const { setStatus, setError, setResult, status, framework, error } =
    useAppStore();
  const [text, setText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedWin, setCopiedWin] = useState(false);

  const macCmd = `tree -I "node_modules|.git|.next|dist|build"`;
  const winCmd = `npx tree-cli -l 4 --ignore "node_modules,.git,.next,dist,build"`;

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setStatus("analyzing");
    setError(null);

    try {
      const structure = parseTextToStructure(text);

      const response = await axios.post(`${API_URL}/analyze-direct`, {
        structure,
        projectName: "Manual Input",
        framework,
      });

      setResult(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to analyze structure",
      );
      setStatus("error");
    }
  };

  const loadExample = () => {
    setText(
      `src/
  components/
    Button.tsx
    Header.tsx
  pages/
    api/
      hello.ts
    index.tsx
  styles/
    globals.css
package.json
tsconfig.json`,
    );
  };

  const copyCmd = async (cmd: string, type: "mac" | "win") => {
    await navigator.clipboard.writeText(cmd);
    if (type === "mac") {
      setCopiedMac(true);
      setTimeout(() => setCopiedMac(false), 2000);
    } else {
      setCopiedWin(true);
      setTimeout(() => setCopiedWin(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Info size={16} />
          <span>Paste your folder structure below</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <HelpCircle size={14} />
            How to generate?
          </button>
          <button
            onClick={loadExample}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <ClipboardList size={14} />
            Load Example
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 space-y-3 animate-in fade-in slide-in-from-top-2">
          <p>
            Run these commands in your project root to copy the tree to your
            clipboard (or save to a file):
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto text-emerald-400">
                <Terminal size={12} />
                <span>{macCmd}</span>
              </div>
              <button
                onClick={() => copyCmd(macCmd, "mac")}
                className="text-slate-500 hover:text-white p-1"
              >
                {copiedMac ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto text-emerald-400">
                <Terminal size={12} />
                <span>{winCmd}</span>
              </div>
              <button
                onClick={() => copyCmd(winCmd, "win")}
                className="text-slate-500 hover:text-white p-1"
              >
                {copiedWin ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g.\nsrc/\n  main.js\n  utils.js\npackage.json"
          className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/5 to-purple-500/5 pointer-events-none" />
      </div>

      {error && status === "error" && (
        <div className="flex items-center p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          <AlertCircle className="shrink-0 mr-3" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!text.trim() || status === "analyzing"}
        className={cn(
          "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10",
          text.trim() && status !== "analyzing"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            : "bg-slate-800 text-slate-500 cursor-not-allowed",
        )}
      >
        <Play size={20} fill="currentColor" />
        {status === "analyzing" ? "Analyzing..." : "Analyze Structure"}
      </button>
    </div>
  );
}
