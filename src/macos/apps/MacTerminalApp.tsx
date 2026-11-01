import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useGameStore } from '@core/stores/gameStore';

const PROMPT = 'bagas@MacBook-Bagas ~ %';
const FONT_FAMILY = '"SF Mono", SFMono-Regular, Menlo, Monaco, "Courier New", monospace';
const BAGAS_LAST_COMMAND = 'sudo kill 0340';

interface TerminalLine {
  id: number;
  prompt: boolean;
  text: string;
}

const PS_OUTPUT: readonly string[] = [
  'USER      PID  %CPU %MEM      VSZ    RSS   TT  STAT STARTED      TIME COMMAND',
  'bagas.p   0340   0.0  0.0  4296732   1204   ??  Ss   3:00AM   0:00.00 /usr/local/bin/proses_0300',
  'bagas    41872   0.0  0.0  4268320    808 s000  S+   3:41AM   0:00.00 grep 03',
];

const HELP_OUTPUT: readonly string[] = [
  'help: tidak ada manual untuk perintah ini.',
  'Riwayat terakhir bagas:',
  `  ${BAGAS_LAST_COMMAND}`,
];

const HISTORY_COMMANDS: readonly string[] = [
  'ls',
  'cd Documents',
  'ls -la',
  'cat laporan_akses.rtf',
  'ps aux | grep 03',
  'kill 0340',
  'kill -9 0340',
  'sudo kill 0340',
  'ps aux | grep 03',
  'kill 0340',
  'kill -15 0340',
  'sudo kill -9 0340',
  'killall proses_0300',
  'who',
  'sudo kill 0340',
  'kill -9 0340',
  'ps aux | grep 03',
  'cd jangan',
  'ls',
  'sudo killall -9 proses_0300',
  'kill 0340',
  'sudo kill 0340',
  'ps aux | grep 03',
  'kill -STOP 0340',
  'sudo kill -9 0340',
  'who',
  'ls /Users',
  'ps aux | grep 03',
  'cd ~',
  'history',
];

function normalize(raw: string): string {
  return raw.trim().replace(/\s*\|\s*/g, ' | ').replace(/\s+/g, ' ');
}

export function MacTerminalApp() {
  const setFlag = useGameStore((s) => s.setFlag);
  const playerName = useGameStore((s) => s.playerName);
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [past, setPast] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const makeLine = (text: string, prompt = false): TerminalLine => ({
    id: nextId.current++,
    prompt,
    text,
  });

  const runCommand = (raw: string): string[] | 'clear' => {
    switch (normalize(raw)) {
      case '':
        return [];
      case 'clear':
        return 'clear';
      case 'help':
        return [...HELP_OUTPUT];
      case 'ps aux | grep 03':
        setFlag('mac.psAuxRun', true);
        return [...PS_OUTPUT];
      case 'history':
        setFlag('mac.historyRead', true);
        return HISTORY_COMMANDS.map(
          (cmd, i) => `${String(i + 1).padStart(5, ' ')}  ${cmd}`,
        );
      case 'who':
        setFlag('mac.whoRun', true);
        return [
          'bagas.p  console   Nov  2 03:00',
          `${playerName}  ttys000   Nov  2 ${timeCurrent} (Screen Sharing)`,
        ];
      case 'sudo kill 0340':
        return ['kill: 0340: Operation not permitted'];
      default: {
        const name = normalize(raw).split(' ')[0];
        return [`zsh: command not found: ${name}`];
      }
    }
  };

  const submit = () => {
    const raw = input;
    const output = runCommand(raw);
    if (output === 'clear') {
      setLines([]);
    } else {
      setLines((prev) => [
        ...prev,
        makeLine(`${PROMPT} ${raw}`, true),
        ...output.map((text) => makeLine(text)),
      ]);
    }
    if (raw.trim() !== '') setPast((prev) => [...prev, raw]);
    setInput('');
    setCursor(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const history = [BAGAS_LAST_COMMAND, ...past];
    if (e.key === 'ArrowUp') {
      const idx = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(idx);
      setInput(history[idx] ?? '');
      return;
    }
    if (cursor === null) return;
    const idx = cursor + 1;
    if (idx >= history.length) {
      setCursor(null);
      setInput('');
    } else {
      setCursor(idx);
      setInput(history[idx] ?? '');
    }
  };

  return (
    <div
      className="h-full min-h-0 cursor-text overflow-auto bg-black px-3 py-2 text-[13px] leading-[1.35] text-[#E5E5E5]"
      style={{ fontFamily: FONT_FAMILY }}
      onClick={() => inputRef.current?.focus()}
    >
      <p className="mb-1 text-neutral-500">Last login: Sun Nov  2 03:00:00 on console</p>
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap break-all">
          {line.text}
        </div>
      ))}
      <div className="flex items-center whitespace-pre">
        <span>{PROMPT}&nbsp;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          aria-label="Terminal"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit caret-[#E5E5E5] outline-none"
          style={{ fontFamily: 'inherit' }}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}