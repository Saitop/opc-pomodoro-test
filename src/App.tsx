import { useEffect, useMemo, useState } from "react";

type Mode = "focus" | "short" | "long";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

const MODES: Record<Mode, { label: string; minutes: number; accent: string }> = {
  focus: { label: "Focus", minutes: 25, accent: "#256f61" },
  short: { label: "Short break", minutes: 5, accent: "#3b6ea8" },
  long: { label: "Long break", minutes: 15, accent: "#9b5c1e" },
};

const initialTasks: Task[] = [
  { id: 1, title: "Define one outcome", done: false },
  { id: 2, title: "Silence notifications", done: false },
  { id: 3, title: "Review at the bell", done: false },
];

function secondsFor(mode: Mode) {
  return MODES[mode].minutes * 60;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function App() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(secondsFor("focus"));
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const totalSeconds = secondsFor(mode);
  const progress = 1 - secondsLeft / totalSeconds;
  const activeMode = MODES[mode];

  const taskSummary = useMemo(() => {
    const done = tasks.filter((task) => task.done).length;
    return `${done}/${tasks.length} ready`;
  }, [tasks]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setCompletedSessions((count) => count + 1);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setSecondsLeft(secondsFor(nextMode));
    setRunning(false);
  }

  function resetTimer() {
    setSecondsLeft(totalSeconds);
    setRunning(false);
  }

  function addTask() {
    const title = taskInput.trim();
    if (!title) return;
    setTasks((current) => [
      ...current,
      { id: Date.now(), title, done: false },
    ]);
    setTaskInput("");
  }

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  return (
    <main className="app-shell" style={{ "--accent": activeMode.accent }}>
      <section className="timer-panel" aria-label="Pomodoro timer">
        <div className="timer-copy">
          <p className="eyebrow">Pomodoro Studio</p>
          <h1>Plan one session. Finish one thing.</h1>
        </div>

        <div className="mode-switch" aria-label="Timer mode">
          {(Object.keys(MODES) as Mode[]).map((key) => (
            <button
              key={key}
              type="button"
              className={mode === key ? "active" : ""}
              onClick={() => chooseMode(key)}
            >
              {MODES[key].label}
            </button>
          ))}
        </div>

        <div
          className="timer-ring"
          style={{
            background: `conic-gradient(var(--accent) ${progress * 360}deg, #e3e8e5 0deg)`,
          }}
          aria-label={`${formatTime(secondsLeft)} remaining`}
        >
          <div className="timer-core">
            <span>{activeMode.label}</span>
            <strong>{formatTime(secondsLeft)}</strong>
          </div>
        </div>

        <div className="timer-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => setRunning((current) => !current)}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button type="button" className="secondary-action" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </section>

      <aside className="work-panel" aria-label="Session plan">
        <div className="metric-row">
          <div>
            <span>Sessions</span>
            <strong>{completedSessions}</strong>
          </div>
          <div>
            <span>Tasks</span>
            <strong>{taskSummary}</strong>
          </div>
        </div>

        <div className="task-box">
          <div className="section-heading">
            <h2>Session plan</h2>
            <span>{tasks.length} items</span>
          </div>

          <div className="task-input">
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addTask();
              }}
              placeholder="Add a focus task"
              aria-label="Add a focus task"
            />
            <button type="button" onClick={addTask}>
              Add
            </button>
          </div>

          <div className="task-list">
            {tasks.map((task) => (
              <label key={task.id} className={task.done ? "task done" : "task"}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span>{task.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rhythm-card">
          <div className="rhythm-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p>25 minutes of focus, then a deliberate reset.</p>
        </div>
      </aside>
    </main>
  );
}
