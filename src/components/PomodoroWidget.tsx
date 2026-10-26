import React, { useEffect } from 'react';
import { PomodoroState, Task } from '../types/task';
import { soundManager } from '../utils/audio';
import { Play, Pause, RotateCcw, Target, Coffee } from 'lucide-react';
import { motion } from 'motion/react';

interface PomodoroWidgetProps {
  pomodoro: PomodoroState;
  setPomodoro: React.Dispatch<React.SetStateAction<PomodoroState>>;
  activeTask?: Task;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  pomodoro,
  setPomodoro,
  activeTask
}) => {
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (pomodoro.isActive && !pomodoro.isPaused) {
      interval = setInterval(() => {
        setPomodoro(prev => {
          if (prev.timeLeft <= 1) {
            soundManager.playBell();
            if (prev.mode === 'work') {
              return {
                ...prev,
                isActive: false,
                isPaused: true,
                mode: 'short_break',
                duration: 5 * 60,
                timeLeft: 5 * 60
              };
            } else {
              return {
                ...prev,
                isActive: false,
                isPaused: true,
                mode: 'work',
                duration: 25 * 60,
                timeLeft: 25 * 60
              };
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.isActive, pomodoro.isPaused, setPomodoro]);

  const toggleTimer = () => {
    soundManager.playKeypress();
    setPomodoro(prev => ({
      ...prev,
      isActive: true,
      isPaused: !prev.isPaused
    }));
  };

  const resetTimer = () => {
    soundManager.playKeypress();
    setPomodoro(prev => ({
      ...prev,
      isActive: false,
      isPaused: true,
      timeLeft: prev.duration
    }));
  };

  const switchMode = (mode: 'work' | 'short_break') => {
    soundManager.playKeypress();
    const durations = {
      work: 25 * 60,
      short_break: 5 * 60
    };
    setPomodoro({
      isActive: false,
      isPaused: true,
      mode,
      duration: durations[mode],
      timeLeft: durations[mode]
    });
  };

  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPct = ((pomodoro.duration - pomodoro.timeLeft) / pomodoro.duration) * 100;
  const isRunning = pomodoro.isActive && !pomodoro.isPaused;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#0c1017] text-xs font-mono select-none">
      {/* Icon & Mode */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          {pomodoro.mode === 'work' ? (
            <Target className={`w-3.5 h-3.5 transition-colors ${isRunning ? 'text-emerald-400' : 'text-slate-400'}`} />
          ) : (
            <Coffee className="w-3.5 h-3.5 text-sky-400" />
          )}
          {isRunning && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
          )}
        </div>

        {/* Tabular countdown */}
        <span className="font-semibold text-slate-100 tabular-nums tracking-wider text-xs">
          {formatted}
        </span>
      </div>

      {/* Mini Progress Track */}
      <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${pomodoro.mode === 'work' ? 'bg-emerald-500' : 'bg-sky-400'}`}
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Mode switches */}
      <div className="hidden xl:flex items-center gap-0.5 p-0.5 rounded bg-black/40 border border-white/[0.05] text-[10px]">
        <button
          onClick={() => switchMode('work')}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            pomodoro.mode === 'work' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          25m
        </button>
        <button
          onClick={() => switchMode('short_break')}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            pomodoro.mode === 'short_break' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          5m
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
            isRunning
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
          title={isRunning ? 'Pause' : 'Démarrer'}
        >
          {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        </button>

        <button
          onClick={resetTimer}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Réinitialiser"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {activeTask && (
        <span className="hidden 2xl:inline text-[11px] text-slate-400 max-w-[130px] truncate border-l border-white/[0.08] pl-2">
          #{activeTask.id}
        </span>
      )}
    </div>
  );
};
