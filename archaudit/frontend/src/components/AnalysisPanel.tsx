import { useAppStore } from "../store/useAppStore";
import { AlertTriangle, CheckCircle, Lightbulb, Activity } from "lucide-react";
import { cn } from "../lib/utils";

export function AnalysisPanel() {
  const { analysis, status } = useAppStore();

  if (status !== "success" || !analysis) return null;

  const scoreColor =
    analysis.score >= 8
      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
      : analysis.score >= 5
        ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
        : "text-red-400 border-red-500/20 bg-red-500/5";

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Score Card */}
      <div
        className={cn(
          "rounded-2xl border p-8 flex items-center justify-between shadow-lg backdrop-blur-sm",
          scoreColor,
        )}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Architecture Score
          </h2>
          <p className="text-sm opacity-60">
            AI assessment based on industry patterns
          </p>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-6xl font-black tracking-tighter">
            {analysis.score}
          </span>
          <span className="text-2xl opacity-40 font-bold">/10</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1">
        {/* Issues List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full shadow-xl">
          <h3 className="font-bold text-red-400 flex items-center mb-6 text-lg uppercase tracking-wider">
            <AlertTriangle className="mr-2" size={20} />
            Critical Issues
          </h3>
          <ul className="space-y-4 flex-1 pr-2">
            {analysis.issues.length > 0 ? (
              analysis.issues.map((issue, idx) => (
                <li
                  key={idx}
                  className="flex items-start text-slate-300 bg-red-500/5 p-4 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-colors"
                >
                  <span className="min-w-6 mt-1 text-red-500 text-lg leading-none">
                    •
                  </span>
                  <span className="text-sm leading-relaxed">{issue}</span>
                </li>
              ))
            ) : (
              <li className="flex items-center text-slate-400 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 italic">
                <CheckCircle className="mr-3 text-emerald-500" size={20} />
                No critical issues found!
              </li>
            )}
          </ul>
        </div>

        {/* Suggestions List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full shadow-xl">
          <h3 className="font-bold text-amber-400 flex items-center mb-6 text-lg uppercase tracking-wider">
            <Lightbulb className="mr-2" size={20} />
            Suggestions
          </h3>
          <ul className="space-y-4 flex-1 pr-2">
            {analysis.suggestions.length > 0 ? (
              analysis.suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="flex items-start text-slate-300 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/20 transition-colors"
                >
                  <span className="min-w-6 mt-1 text-amber-500 text-lg leading-none">
                    •
                  </span>
                  <span className="text-sm leading-relaxed">{suggestion}</span>
                </li>
              ))
            ) : (
              <li className="flex items-center text-slate-400 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 italic">
                <Activity className="mr-3 text-blue-400" size={20} />
                Your structure is highly optimal.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
