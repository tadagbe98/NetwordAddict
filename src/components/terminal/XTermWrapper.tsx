import React, { useState, useEffect, useRef } from 'react';
import { NetworkDevice } from '../../types/network';
import { CliSession } from '../../types/cli';
import { getPrompt } from '../../cli/cliParser';
import { executeHuaweiCommand } from '../../cli/huaweiDriver';
import { executeCiscoCommand } from '../../cli/ciscoDriver';
import { executeOmadaCommand } from '../../cli/omadaDriver';
import { executePcCommand } from '../../cli/pcDriver';
import { getCliSuggestions, getCliHelpOutput } from '../../cli/commandTree';
import { useNetwork } from '../../context/NetworkContext';

interface XTermWrapperProps {
  device: NetworkDevice;
  session: CliSession;
  onUpdateSession: (updated: Partial<CliSession>) => void;
}

export const XTermWrapper: React.FC<XTermWrapperProps> = ({
  device,
  session,
  onUpdateSession,
}) => {
  const { injectPing } = useNetwork();
  const [inputVal, setInputVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new output lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.lines.length]);

  // Focus input when clicking anywhere in terminal body
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const currentPrompt = getPrompt(device, session);

  // Handle Command Submission & Interactive Keys (Tab, ?, History)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow Up / Down for History
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (session.history.length === 0) return;
      const nextIdx = Math.max(session.historyIndex - 1, 0);
      onUpdateSession({ historyIndex: nextIdx });
      setInputVal(session.history[nextIdx] || '');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(session.historyIndex + 1, session.history.length);
      onUpdateSession({ historyIndex: nextIdx });
      setInputVal(session.history[nextIdx] || '');
      return;
    }

    // Interactive '?' Help Trigger
    if (e.key === '?') {
      e.preventDefault();
      const lineWithQ = inputVal + '?';
      const helpOutput = getCliHelpOutput(device.vendor, session.mode, lineWithQ);

      const newLines = [
        ...session.lines,
        { text: `${currentPrompt} ${inputVal}?`, type: 'input' as const },
      ];

      helpOutput.split('\n').forEach((txt) => {
        newLines.push({ text: txt, type: 'output' });
      });

      onUpdateSession({ lines: newLines });
      return;
    }

    // Tab Auto-Completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = getCliSuggestions(device.vendor, session.mode, inputVal);

      if (suggestions.length === 1) {
        // Exact single match: auto-complete!
        setInputVal(suggestions[0] + ' ');
      } else if (suggestions.length > 1) {
        // Multiple matches: show possible options and keep prompt
        const newLines = [
          ...session.lines,
          { text: `${currentPrompt} ${inputVal}`, type: 'input' as const },
          { text: suggestions.map((s) => `  ${s}`).join('\n'), type: 'output' as const },
        ];
        onUpdateSession({ lines: newLines });
      }
      return;
    }

    // Enter Submit
    if (e.key === 'Enter') {
      e.preventDefault();
      const line = inputVal;
      setInputVal('');

      const newLines = [...session.lines, { text: `${currentPrompt} ${line}`, type: 'input' as const }];
      const newHistory = line.trim() ? [...session.history, line] : session.history;

      if (!line.trim()) {
        onUpdateSession({
          lines: newLines,
          history: newHistory,
          historyIndex: newHistory.length,
        });
        return;
      }

      // Execute based on vendor
      let result: { output: string; newMode?: CliSession['mode']; newInterface?: string; newVlan?: number };

      if (device.vendor === 'huawei') {
        result = executeHuaweiCommand(device, session, line);
      } else if (device.vendor === 'cisco') {
        result = executeCiscoCommand(device, session, line);
      } else if (device.vendor === 'omada') {
        result = executeOmadaCommand(device, session, line);
      } else {
        result = executePcCommand(device, line, (target) => injectPing(device.id, target));
      }

      if (result.output) {
        result.output.split('\n').forEach((txt) => {
          newLines.push({ text: txt, type: 'output' });
        });
      }

      onUpdateSession({
        lines: newLines,
        mode: result.newMode || session.mode,
        currentInterface: result.newInterface !== undefined ? result.newInterface : session.currentInterface,
        currentVlan: result.newVlan !== undefined ? result.newVlan : session.currentVlan,
        history: newHistory,
        historyIndex: newHistory.length,
      });
    }
  };

  return (
    <div
      onClick={handleTerminalClick}
      className="h-full bg-slate-950 text-slate-200 font-mono text-xs p-3 overflow-y-auto cursor-text select-text leading-relaxed"
    >
      {/* Output lines */}
      <div className="space-y-0.5">
        {session.lines.map((l, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap ${
              l.type === 'input'
                ? 'text-white font-semibold'
                : l.type === 'error'
                ? 'text-red-400'
                : l.type === 'system'
                ? 'text-slate-500 italic'
                : 'text-slate-300'
            }`}
          >
            {l.text}
          </div>
        ))}
      </div>

      {/* Active Input Line */}
      <div className="flex items-center space-x-1.5 mt-1">
        <span
          className={`font-bold select-none ${
            device.vendor === 'huawei'
              ? 'text-red-400'
              : device.vendor === 'cisco'
              ? 'text-sky-400'
              : 'text-teal-400'
          }`}
        >
          {currentPrompt}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent text-slate-100 outline-none border-none p-0 font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
