import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  Circle,
  HelpCircle,
  RefreshCw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { DEFAULT_LABS } from '../../constants/defaultLabs';

export const GuidedLabsDrawer: React.FC = () => {
  const {
    vendor,
    isLabsOpen,
    setIsLabsOpen,
    activeLab,
    loadLab,
    verifyLab,
    labProgress,
    resetCurrentLab,
  } = useNetwork();
  const { t } = useI18n();

  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  if (!isLabsOpen) return null;

  // Labs relevant to current vendor
  const availableLabs = DEFAULT_LABS;

  const handleVerify = () => {
    const res = verifyLab();
    setVerificationFeedback(res.message);
  };

  return (
    <div className="fixed top-14 right-0 bottom-0 z-40 w-[440px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-slideLeft select-none">
      {/* Title Bar */}
      <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
          <GraduationCap className="w-4 h-4" />
          <span className="uppercase tracking-wider">{t.labs.title}</span>
        </div>
        <button
          onClick={() => setIsLabsOpen(false)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lab Selector Dropdown */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Sélectionner un Atelier Pratique :
        </label>
        <select
          value={activeLab?.id || ''}
          onChange={(e) => loadLab(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-medium outline-none focus:border-amber-500 transition"
        >
          <option value="" disabled>
            -- Choisissez un laboratoire guidé --
          </option>
          {availableLabs.map((lab) => (
            <option key={lab.id} value={lab.id}>
              [{lab.vendor.toUpperCase()}] {lab.title} ({lab.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Active Lab Details */}
      {activeLab ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeLab.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ~{activeLab.timeEstimateMinutes} min
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-2 leading-tight">{activeLab.title}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{activeLab.description}</p>
          </div>

          {/* Scenario Story */}
          <div className="bg-blue-950/20 p-3 rounded-xl border border-blue-900/40 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-blue-400 block mb-1">Mise en situation :</span>
            {activeLab.backgroundStory}
          </div>

          {/* Score & Progress Bar */}
          {labProgress && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Progression :</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {labProgress.score} / {labProgress.totalPoints} pts
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.round((labProgress.score / Math.max(labProgress.totalPoints, 1)) * 100)}%`,
                  }}
                />
              </div>

              {labProgress.isFullyCompleted && (
                <div className="mt-3 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{t.labs.congratulations}</span>
                </div>
              )}
            </div>
          )}

          {/* Objectives Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {t.labs.objectives} :
            </h4>
            <div className="space-y-2">
              {activeLab.objectives.map((obj) => {
                const isCompleted = labProgress?.completedObjectives.includes(obj.id);
                const isHintExpanded = expandedHintId === obj.id;

                return (
                  <div
                    key={obj.id}
                    className={`p-3 rounded-xl border transition ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isCompleted ? 'line-through text-emerald-400/80' : 'text-white'}`}>
                            {obj.title}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">
                            +{obj.points} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{obj.description}</p>

                        {/* Hint Accordion */}
                        <button
                          onClick={() => setExpandedHintId(isHintExpanded ? null : obj.id)}
                          className="mt-2 flex items-center space-x-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>{isHintExpanded ? 'Masquer l\'indice' : 'Afficher l\'indice (commandes)'}</span>
                          {isHintExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isHintExpanded && (
                          <div className="mt-1.5 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-amber-300 whitespace-pre-wrap">
                            {obj.hint}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Feedback Notice */}
          {verificationFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 animate-fadeIn">
              {verificationFeedback}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <GraduationCap className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Aucun laboratoire sélectionné</p>
          <p className="text-xs mt-1">Sélectionnez un atelier dans la liste déroulante ci-dessus pour charger la topologie d'apprentissage.</p>
        </div>
      )}

      {/* Footer Actions: Verify & Reset */}
      {activeLab && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
          <button
            onClick={handleVerify}
            className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.labs.verify}</span>
          </button>

          <button
            onClick={resetCurrentLab}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t.labs.resetLab}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
