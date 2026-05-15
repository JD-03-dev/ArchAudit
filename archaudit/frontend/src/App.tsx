import React from "react";
import { useAppStore } from "./store/useAppStore";
import { UploadZone } from "./components/UploadZone";
import { ManualInput } from "./components/ManualInput";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { StructureViewer } from "./components/StructureViewer";
import {
  Shield,
  FileJson,
  Sparkles,
  Download,
  Share2,
  Trash2,
  ArrowLeft,
  Layout,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  Power,
  Server,
} from "lucide-react";
import { toPng } from "html-to-image";
import { API_URL, cn } from "./lib/utils";
import { Terminal } from "lucide-react";

const FRAMEWORKS = [
  "Generic Software Project",
  "Next.js App Router",
  "Next.js Pages Router",
  "React + Vite",
  "Express.js REST API",
  "NestJS Microservices",
  "Python Django",
  "Go Fiber/Gin API",
];

function App() {
  const {
    analysis,
    structure,
    fileInfo,
    reset,
    shareId,
    setResult,
    setFileInfo,
    framework,
    setFramework,
    updateStructure,
  } = useAppStore();
  const [isCopied, setIsCopied] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [showScriptModal, setShowScriptModal] = React.useState(false);
  const [serverState, setServerState] = React.useState<
    "idle" | "waking" | "ready"
  >("idle");

  const wakeServer = async () => {
    setServerState("waking");
    try {
      await fetch(`${API_URL}/ping`);
      setServerState("ready");
    } catch (err) {
      setServerState("idle");
    }
  };

  React.useEffect(() => {
    wakeServer();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (share) {
      fetch(`${API_URL}/analysis/${share}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setResult({
              fileUrl: data.fileUrl || "",
              structure: data.structure,
              analysis: data.analysis,
              shareId: share,
            });
            setFileInfo({
              name: data.projectName || "Shared Analysis",
              size: 0,
            });
            window.history.replaceState({}, "", window.location.pathname);
          }
        })
        .catch(console.error);
    }
  }, [setResult, setFileInfo]);

  const handleExport = async () => {
    const node = document.getElementById("analysis-dashboard");
    if (!node) return;

    // Temporarily remove animation and backdrop-filter classes
    // to prevent html-to-image from capturing initial transparent state or failing to render blur
    const animatedNodes = Array.from(node.querySelectorAll(".animate-in"));
    const blurNodes = Array.from(node.querySelectorAll(".backdrop-blur-sm"));
    const nodeHadAnimate = node.classList.contains("animate-in");
    const nodeHadBlur = node.classList.contains("backdrop-blur-sm");

    animatedNodes.forEach((el) => el.classList.remove("animate-in"));
    blurNodes.forEach((el) => el.classList.remove("backdrop-blur-sm"));
    if (nodeHadAnimate) node.classList.remove("animate-in");
    if (nodeHadBlur) node.classList.remove("backdrop-blur-sm");

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: "#020617",
        cacheBust: true,
        filter: (el) => {
          if (el instanceof HTMLElement && el.id === "action-buttons")
            return false;
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `arch-audit-${fileInfo?.name || "analysis"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      animatedNodes.forEach((el) => el.classList.add("animate-in"));
      blurNodes.forEach((el) => el.classList.add("backdrop-blur-sm"));
      if (nodeHadAnimate) node.classList.add("animate-in");
      if (nodeHadBlur) node.classList.add("backdrop-blur-sm");
    }
  };

  const handleShare = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}?share=${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDeleteNode = (path: string[]) => {
    if (!structure) return;
    const newStruct = JSON.parse(JSON.stringify(structure));
    let current = newStruct;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]]) {
        current = current[path[i]];
      }
    }
    const nodeName = path[path.length - 1];
    delete current[nodeName];
    updateStructure(newStruct);
  };

  const handleDownloadScript = () => {
    if (!analysis?.migration_script) return;
    const blob = new Blob([analysis.migration_script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `migrate-${fileInfo?.name?.replace(".zip", "") || "structure"}.sh`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowScriptModal(false);
  };

  const hasResult = !!analysis;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {/* Sidebar/Header Navigation */}
      <nav className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileJson className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">ArchAudit</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                AI Structure Analyzer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={wakeServer}
              disabled={serverState === "waking" || serverState === "ready"}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                serverState === "idle"
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  : serverState === "waking"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default",
              )}
            >
              {serverState === "idle" && <Power size={14} />}
              {serverState === "waking" && (
                <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              )}
              {serverState === "ready" && <Server size={14} />}
              <span className="hidden sm:inline">
                {serverState === "idle"
                  ? "Wake Server"
                  : serverState === "waking"
                    ? "Waking Server..."
                    : "Server Ready"}
              </span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Shield size={14} />
              <span>E2E Encrypted</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasResult ? (
          <div className="max-w-3xl mx-auto space-y-12 py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles size={14} />
                <span>Powered by Gemini 2.5 Flash</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
                Optimize your project architecture.
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Get instant AI feedback on your folder structure. Secure,
                private, and fast.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Target Framework / Architecture
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-3 hover:bg-slate-900/50 transition-colors focus:ring-2 focus:ring-blue-500/50 outline-none"
                  >
                    <span>{framework}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-slate-500 transition-transform",
                        isDropdownOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="max-h-60 overflow-y-auto py-1">
                        {FRAMEWORKS.map((fw) => (
                          <button
                            key={fw}
                            onClick={() => {
                              setFramework(fw);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-sm transition-colors",
                              framework === fw
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                            )}
                          >
                            {fw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <ManualInput />

              <div className="flex items-center my-8">
                <div className="grow border-t border-slate-800/80"></div>
                <span className="mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  OR SECURE ZIP UPLOAD
                </span>
                <div className="grow border-t border-slate-800/80"></div>
              </div>

              <UploadZone />
            </div>
          </div>
        ) : (
          <div
            id="analysis-dashboard"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-950 rounded-2xl"
          >
            {/* Analysis Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  id="action-buttons"
                  onClick={reset}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Analysis Results
                  </h3>
                  <p className="text-sm text-slate-400">
                    {fileInfo?.name || "Manual Input"}
                  </p>
                </div>
              </div>

              <div id="action-buttons" className="flex items-center gap-2">
                {analysis?.migration_script && (
                  <button
                    onClick={() => setShowScriptModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors border border-emerald-500/20 mr-2"
                  >
                    <Terminal size={18} />
                    Fix It For Me
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
                >
                  <Download size={18} />
                  Export Image
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  {isCopied ? <Check size={18} /> : <Share2 size={18} />}
                  {isCopied ? "Copied!" : "Share Link"}
                </button>
                <button
                  onClick={reset}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Layout size={16} className="text-blue-400" />
                    Structure Map
                  </h4>
                  {structure && (
                    <StructureViewer
                      structure={structure}
                      compareWith={analysis?.improved_structure}
                      onDelete={handleDeleteNode}
                    />
                  )}
                </div>
              </div>
              <div className="lg:col-span-8">
                <AnalysisPanel />
              </div>
            </div>
          </div>
        )}
      </main>

      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="text-emerald-400" size={20} />
                Migration Script
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex gap-3 text-sm leading-relaxed">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-semibold mb-1">
                    Warning: Review before executing
                  </p>
                  <p className="opacity-90">
                    This script was generated by AI and will create and move
                    files on your machine. Always review the commands below and
                    commit your current changes to git before running it.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-300 text-sm">
                  How to use:
                </h4>
                <ol className="list-decimal list-inside text-sm text-slate-400 space-y-1">
                  <li>Download the script to your project's root folder.</li>
                  <li>
                    Make it executable:{" "}
                    <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">
                      chmod +x migrate.sh
                    </code>
                  </li>
                  <li>
                    Run it:{" "}
                    <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">
                      ./migrate.sh
                    </code>
                  </li>
                </ol>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 text-xs font-mono text-slate-500">
                  migrate.sh
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400">
                  {analysis?.migration_script}
                </pre>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadScript}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Download size={16} />
                Download Script
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800/60 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Built with React, Tailwind CSS, and Google Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
