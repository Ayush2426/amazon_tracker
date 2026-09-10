import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Brain,
  Code2,
  Target,
  Flame,
  Play,
  CheckCircle2,
  Circle,
  Search,
  ExternalLink,
  Trophy,
  RotateCcw,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Database,
  Network,
  Cpu,
  Layers3,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  Cloud,
  CloudOff,
  LoaderCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { curriculum } from "./data";
import "./index.css"

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_STATE = {
  days: {},
  questions: {},
  eng: {},
  stories: {},
};

/* =========================================================
   CUSTOM SPIDER ICON
========================================================= */

const SpiderIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M50 28C40 28 34 36 34 48V65C34 76 40 82 50 82C60 82 66 76 66 65V48C66 36 60 28 50 28Z"
      fill="currentColor"
    />

    <circle
      cx="50"
      cy="22"
      r="10"
      fill="currentColor"
    />

    <path
      d="
        M37 42L20 30
        M35 51L14 48
        M36 61L17 68
        M63 42L80 30
        M65 51L86 48
        M64 61L83 68
      "
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

/* =========================================================
   API HELPERS
========================================================= */

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   APP
========================================================= */

function App() {
  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");

  /* -------------------------------------------------------
     APPLICATION STATE
  ------------------------------------------------------- */

  const [state, setState] = useState(EMPTY_STATE);

  const [loadingState, setLoadingState] = useState(false);

  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncing, setSyncing] = useState(false);

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const [page, setPage] = useState("dashboard");
  const [day, setDay] = useState(1);
  const [menu, setMenu] = useState(false);

  /* -------------------------------------------------------
     DSA FILTERS
  ------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  /* =======================================================
     SESSION INITIALIZATION
  ======================================================= */

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const data = await apiRequest("/api/auth/me", {
        method: "GET",
      });

      if (data.authenticated && data.user) {
        setUser(data.user);
        await loadState();
      }
    } catch (error) {
      /*
       * 401 simply means the user isn't logged in.
       * We don't treat that as an application error.
       */
      if (!String(error.message).includes("401")) {
        console.error("SESSION_ERROR:", error);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  /* =======================================================
     LOAD MONGODB STATE
  ======================================================= */

  async function loadState() {
    setLoadingState(true);

    try {
      const data = await apiRequest("/api/state/get", {
        method: "GET",
      });

      if (data.success && data.state) {
        setState({
          ...EMPTY_STATE,
          ...data.state,
        });
      }
    } catch (error) {
      console.error("LOAD_STATE_ERROR:", error);
      setSyncStatus("error");
    } finally {
      setLoadingState(false);
    }
  }

  /* =======================================================
     SAVE STATE TO MONGODB
  ======================================================= */

  async function persistState(nextState) {
    if (!user) {
      return;
    }

    setSyncing(true);
    setSyncStatus("syncing");

    try {
      await apiRequest("/api/state/update", {
        method: "PUT",
        body: JSON.stringify({
          state: nextState,
        }),
      });

      setSyncStatus("synced");
    } catch (error) {
      console.error("SAVE_STATE_ERROR:", error);
      setSyncStatus("error");
    } finally {
      setSyncing(false);
    }
  }

  /* =======================================================
     SAFE STATE UPDATE
  ======================================================= */

  function updateApplicationState(updater) {
    setState((current) => {
      const nextState =
        typeof updater === "function"
          ? updater(current)
          : updater;

      /*
       * Save asynchronously.
       * React receives the new state immediately.
       */
      persistState(nextState);

      return nextState;
    });
  }

  /* =======================================================
     DAY UPDATE
  ======================================================= */

  function updateDay(id, patch) {
    updateApplicationState((current) => ({
      ...current,

      days: {
        ...current.days,

        [id]: {
          ...current.days[id],
          ...patch,
        },
      },
    }));
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
    } finally {
      setUser(null);
      setState(EMPTY_STATE);
      setPage("dashboard");
      setSyncStatus("idle");
    }
  }

  /* =======================================================
     RESET LOCAL MISSION STATE
  ======================================================= */

  async function resetMission() {
    const confirmed = window.confirm(
      "Reset your entire 90-day mission progress?"
    );

    if (!confirmed) {
      return;
    }

    updateApplicationState(EMPTY_STATE);
  }

  /* =======================================================
     PROGRESS CALCULATIONS
  ======================================================= */

  const completedDays = Object.values(state.days || {}).filter(
    (item) => item?.status === "Completed"
  ).length;

  const completionPercentage = Math.round(
    (completedDays / 90) * 100
  );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigation = [
    ["dashboard", "Mission Control", LayoutDashboard],
    ["roadmap", "90-Day Roadmap", CalendarDays],
    ["dsa", "DSA Arsenal", Brain],
    ["engineering", "Engineering Lab", Code2],
    ["amazon", "Amazon Prep", Target],
  ];

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return <BootScreen />;
  }

  /* =======================================================
     LOGIN / REGISTER
  ======================================================= */

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onAuthenticated={async (authenticatedUser) => {
          setUser(authenticatedUser);
          await loadState();
        }}
      />
    );
  }

  /* =======================================================
     MAIN APP
  ======================================================= */

  return (
    <div className="app">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header>
        <button
          className="hamb"
          onClick={() => setMenu((current) => !current)}
          aria-label="Toggle navigation"
        >
          {menu ? <X /> : <Menu />}
        </button>

        <div className="brand">
          <span className="mark">
            <SpiderIcon size={28} />
          </span>

          <div>
            <b>SPIDER-VERSE</b>

            <small>
              AMAZON SDE MISSION CONTROL
            </small>
          </div>
        </div>

        <div className="top">

          <div className="sync">
            {syncStatus === "syncing" && (
              <>
                <LoaderCircle className="spin" />
                <span>SYNCING...</span>
              </>
            )}

            {syncStatus === "synced" && !syncing && (
              <>
                <Cloud />
                <span>SYNCED</span>
              </>
            )}

            {syncStatus === "error" && (
              <>
                <CloudOff />
                <span>SAVE FAILED</span>
              </>
            )}

            {syncStatus === "idle" && (
              <>
                <Cloud />
                <span>CONNECTED</span>
              </>
            )}
          </div>

          <div className="userBadge">
            <User size={15} />
            <span>{user.name}</span>
          </div>

          <b>JOB 10513568</b>

          <span>
            <Flame />
            {completedDays}/90 DAYS
          </span>

          <button
            className="logoutButton"
            onClick={logout}
            title="Logout"
          >
            <LogOut />
          </button>

        </div>
      </header>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className={menu ? "open" : ""}>

        <div className="label">
          MISSION
        </div>

        {navigation.map(
          ([id, name, Icon]) => (
            <button
              key={id}
              className={
                page === id
                  ? "nav active"
                  : "nav"
              }
              onClick={() => {
                setPage(id);
                setMenu(false);
              }}
            >
              <Icon />

              <span>
                {name}
              </span>

              {page === id && (
                <ChevronRight />
              )}
            </button>
          )
        )}

        <div className="label">
          PROGRESS
        </div>

        <div className="sideBar">

          <div>
            <span>
              Mission
            </span>

            <b>
              {completionPercentage}%
            </b>
          </div>

          <i
            style={{
              width: `${completionPercentage}%`,
            }}
          />

        </div>

        <button
          className="nav"
          onClick={resetMission}
        >
          <RotateCcw />
          <span>
            Reset mission
          </span>
        </button>

        <div className="sideQuote">
          WITH GREAT PREPARATION
          <br />
          COMES GREAT INTERVIEW POWER.
        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main>

        {loadingState ? (
          <LoadingPanel />
        ) : (
          <AnimatePresence mode="wait">

            {page === "dashboard" && (
              <Dash
                key="dashboard"
                done={completedDays}
                pct={completionPercentage}
                user={user}
                setPage={setPage}
                setDay={setDay}
              />
            )}

            {page === "roadmap" && (
              <Road
                key="roadmap"
                state={state}
                updateDay={updateDay}
                day={day}
                setDay={setDay}
              />
            )}

            {page === "dsa" && (
              <Dsa
                key="dsa"
                state={state}
                updateState={updateApplicationState}
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
              />
            )}

            {page === "engineering" && (
              <Eng
                key="engineering"
                state={state}
                updateState={updateApplicationState}
              />
            )}

            {page === "amazon" && (
              <Amazon
                key="amazon"
                state={state}
                updateState={updateApplicationState}
              />
            )}

          </AnimatePresence>
        )}

      </main>
    </div>
  );
}

/* =========================================================
   BOOT SCREEN
========================================================= */

function BootScreen() {
  return (
    <div className="boot">

      <motion.div
        className="bootSpider"
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <SpiderIcon size={70} />
      </motion.div>

      <h1>
        SPIDER-VERSE
      </h1>

      <p>
        INITIALIZING MISSION CONTROL...
      </p>

      <LoaderCircle className="spin" />

    </div>
  );
}

/* =========================================================
   LOADING PANEL
========================================================= */

function LoadingPanel() {
  return (
    <div className="loadingPanel">

      <LoaderCircle className="spin" />

      <h2>
        LOADING MISSION DATA
      </h2>

      <p>
        Syncing your preparation progress...
      </p>

    </div>
  );
}

/* =========================================================
   AUTH SCREEN
========================================================= */

function AuthScreen({
  mode,
  setMode,
  onAuthenticated,
}) {
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/api/auth/login"
        : "/api/auth/register";

      const payload = isLogin
        ? {
          email,
          password,
        }
        : {
          name,
          email,
          password,
        };

      const data = await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (data.success && data.user) {
        await onAuthenticated(data.user);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authScreen">

      <div className="authBackground">
        <div className="web webOne" />
        <div className="web webTwo" />
        <div className="web webThree" />
      </div>

      <motion.div
        className="authCard"
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.35,
        }}
      >

        <div className="authLogo">
          <SpiderIcon size={58} />
        </div>

        <div className="authBrand">
          <b>
            SPIDER-VERSE
          </b>

          <span>
            AMAZON SDE MISSION CONTROL
          </span>
        </div>

        <div className="authTitle">

          <div className="eyebrow">
            <ShieldCheck />
            SECURE MISSION ACCESS
          </div>

          <h1>
            {isLogin
              ? "Welcome back."
              : "Start your mission."}
          </h1>

          <p>
            {isLogin
              ? "Continue your Amazon SDE preparation."
              : "Create your account and track all 90 days."}
          </p>

        </div>

        {error && (
          <motion.div
            className="authError"
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            {error}
          </motion.div>
        )}

        <form
          className="authForm"
          onSubmit={submit}
        >

          {!isLogin && (
            <label>

              <span>
                <User size={16} />
                NAME
              </span>

              <div className="inputWrap">

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />

              </div>

            </label>
          )}

          <label>

            <span>
              <Mail size={16} />
              EMAIL
            </span>

            <div className="inputWrap">

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

            </div>

          </label>

          <label>

            <span>
              <Lock size={16} />
              PASSWORD
            </span>

            <div className="inputWrap">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                autoComplete={
                  isLogin
                    ? "current-password"
                    : "new-password"
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff />
                ) : (
                  <Eye />
                )}
              </button>

            </div>

          </label>

          <button
            className="authSubmit"
            type="submit"
            disabled={loading}
          >

            {loading ? (
              <>
                <LoaderCircle className="spin" />
                {isLogin
                  ? "AUTHENTICATING..."
                  : "CREATING ACCOUNT..."}
              </>
            ) : (
              <>
                {isLogin ? (
                  <LogIn />
                ) : (
                  <UserPlus />
                )}

                {isLogin
                  ? "ENTER MISSION CONTROL"
                  : "CREATE MISSION ACCOUNT"}
              </>
            )}

          </button>

        </form>

        <div className="authSwitch">

          <span>
            {isLogin
              ? "New to the mission?"
              : "Already have an account?"}
          </span>

          <button
            onClick={() => {
              setError("");
              setMode(
                isLogin
                  ? "register"
                  : "login"
              );
            }}
          >
            {isLogin
              ? "Create account"
              : "Sign in"}
          </button>

        </div>

        <div className="authFooter">
          <Cloud />
          Your preparation progress is stored securely
          in your account.
        </div>

      </motion.div>
    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

const Head = ({
  icon: Icon,
  title,
  sub,
}) => (
  <div className="head">

    <Icon />

    <div>

      <h1>
        {title}
      </h1>

      <p>
        {sub}
      </p>

    </div>

  </div>
);

/* =========================================================
   SECTION TITLE
========================================================= */

const Title = ({
  icon: Icon,
  title,
}) => (
  <div className="pt">

    <span>
      <Icon />
      {title}
    </span>

  </div>
);

/* =========================================================
   DASHBOARD
========================================================= */

function Dash({
  done,
  pct,
  user,
  setPage,
  setDay,
}) {
  const rows = [
    "DSA",
    "Engineering",
    "Project + LP",
    "Revision",
  ];

  const rules = [
    ["01", "Solve, don't memorize"],
    ["02", "Think aloud"],
    ["03", "Own your mistakes"],
    ["04", "Tell the real story"],
  ];

  return (
    <Section>

      {/* HERO */}

      <div className="hero">

        <div>

          <div className="eyebrow">

            <SpiderIcon />

            90-DAY MISSION

          </div>

          <h1>

            Welcome,
            <br />

            <em>
              {user?.name || "Spider-Man"}.
            </em>

          </h1>

          <p>
            Amazon SDE • Java-first • 300 DSA •
            Backend • System Design • Leadership
            Principles.
          </p>

          <button
            className="primary"
            onClick={() => {
              setPage("roadmap");
              setDay(
                Math.min(
                  done + 1,
                  90
                )
              );
            }}
          >

            <Play />

            {done === 0
              ? "START MISSION"
              : "CONTINUE MISSION"}

          </button>

        </div>

        <div className="orb">

          <div />
          <div />

          <SpiderIcon size={100} />

        </div>

      </div>

      {/* STATS */}

      <div className="stats">

        <Stat
          icon={CalendarDays}
          value={`${done}/90`}
          title="Days completed"
        />

        <Stat
          icon={Brain}
          value={`${pct}%`}
          title="Mission progress"
        />

        <Stat
          icon={Code2}
          value="300"
          title="DSA target"
        />

        <Stat
          icon={Trophy}
          value="SDE"
          title="Target role"
        />

      </div>

      {/* TWO COLUMNS */}

      <div className="twocol">

        <div className="panel">

          <Title
            icon={Flame}
            title="Mission Pulse"
          />

          <div className="big">

            {pct}

            <small>
              %
            </small>

          </div>

          <div className="bar">

            <i
              style={{
                width: `${pct}%`,
              }}
            />

          </div>

          <div className="rows">

            {rows.map((item) => (
              <div key={item}>

                <span>
                  {item}
                </span>

                <b>
                  {item === "DSA"
                    ? "300"
                    : "90"}
                </b>

              </div>
            ))}

          </div>

        </div>

        <div className="panel">

          <Title
            icon={Sparkles}
            title="The rules"
          />

          {rules.map(
            ([number, text]) => (
              <div
                className="rule"
                key={number}
              >

                <b>
                  {number}
                </b>

                <span>
                  {text}
                </span>

              </div>
            )
          )}

        </div>

      </div>

    </Section>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  icon: Icon,
  value,
  title,
}) {
  return (
    <div className="stat">

      <Icon />

      <b>
        {value}
      </b>

      <span>
        {title}
      </span>

    </div>
  );
}

/* =========================================================
   ROADMAP
========================================================= */

function Road({
  state,
  updateDay,
  day,
  setDay,
}) {
  const currentDay =
    curriculum.days[day - 1];

  const dayState =
    state.days?.[day] || {};

  if (!currentDay) {
    return (
      <Section>

        <Head
          icon={CalendarDays}
          title="90-Day Roadmap"
          sub="The requested day could not be found."
        />

      </Section>
    );
  }

  return (
    <Section>

      <Head
        icon={CalendarDays}
        title="90-Day Roadmap"
        sub="Pick any day. Every mission is executable and checkable."
      />

      <div className="road">

        {/* DAY SELECTOR */}

        <div className="days">

          {curriculum.days.map(
            (item) => (
              <button
                key={item.day}
                className={
                  item.day === day
                    ? "sel"
                    : ""
                }
                onClick={() =>
                  setDay(item.day)
                }
                aria-label={`Day ${item.day}`}
              >

                <b>
                  {String(
                    item.day
                  ).padStart(2, "0")}
                </b>

                {item.mock && (
                  <small>
                    ⚡
                  </small>
                )}

                {state.days?.[
                  item.day
                ]?.status ===
                  "Completed" && (
                    <span className="dayCheck">
                      ✓
                    </span>
                  )}

              </button>
            )
          )}

        </div>

        {/* DAY DETAILS */}

        <div className="detail">

          <div className="dayHead">

            <div>

              <div className="eyebrow">

                WEEK {currentDay.week}
                {" • "}
                DAY {currentDay.day}

              </div>

              <h2>
                {currentDay.pattern}
              </h2>

              <p>
                Execute → explain → revise.
              </p>

            </div>

            <strong>
              {String(
                currentDay.day
              ).padStart(2, "0")}
            </strong>

          </div>

          <div className="tasks">

            <Task
              title="DSA MISSION"
              icon={Brain}
              done={dayState.dsa}
              click={() =>
                updateDay(day, {
                  dsa: !dayState.dsa,
                })
              }
            >
              {currentDay.questions?.length
                ? currentDay.questions
                  .map(
                    (q) =>
                      q.title
                  )
                  .join(" • ")
                : "2 unseen mixed problems + mistake review"}
            </Task>

            <Task
              title="ENGINEERING LAB"
              icon={Code2}
              done={dayState.eng}
              click={() =>
                updateDay(day, {
                  eng: !dayState.eng,
                })
              }
            >
              {currentDay.engineering}
            </Task>

            <Task
              title="PROJECT / AMAZON"
              icon={Target}
              done={dayState.project}
              click={() =>
                updateDay(day, {
                  project:
                    !dayState.project,
                })
              }
            >
              {currentDay.project}
            </Task>

            <Task
              title="REVISION"
              icon={RotateCcw}
              done={dayState.revision}
              click={() =>
                updateDay(day, {
                  revision:
                    !dayState.revision,
                })
              }
            >
              Review Day −1 / −7 / −21 mistakes
            </Task>

          </div>

          {currentDay.mock && (
            <div className="mock">

              <Flame />

              <b>
                MOCK CHECKPOINT
              </b>

              <span>
                Timed coding / behavioral /
                system-design simulation.
              </span>

            </div>
          )}

          <div className="complete">

            <span>

              DAY STATUS

              <br />

              <b>
                {dayState.status ===
                  "Completed"
                  ? "MISSION COMPLETE"
                  : "IN PROGRESS"}
              </b>

            </span>

            <button
              onClick={() =>
                updateDay(day, {
                  status:
                    dayState.status ===
                      "Completed"
                      ? ""
                      : "Completed",
                })
              }
            >

              {dayState.status ===
                "Completed" ? (
                <CheckCircle2 />
              ) : (
                <Circle />
              )}

              {dayState.status ===
                "Completed"
                ? "Completed"
                : "Mark complete"}

            </button>

          </div>

        </div>

      </div>

    </Section>
  );
}

/* =========================================================
   TASK
========================================================= */

function Task({
  title,
  icon: Icon,
  done,
  click,
  children,
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className={
        done
          ? "task done"
          : "task"
      }
    >

      <div>

        <span>

          <Icon />

          {title}

        </span>

        <button
          onClick={click}
          aria-label={`Toggle ${title}`}
        >

          {done ? (
            <CheckCircle2 />
          ) : (
            <Circle />
          )}

        </button>

      </div>

      <b>
        {children}
      </b>

      <small>
        Complete the task, then mark the check.
      </small>

    </motion.div>
  );
}

/* =========================================================
   DSA
========================================================= */

function Dsa({
  state,
  updateState,
  search,
  setSearch,
  filter,
  setFilter,
}) {
  const questions =
    useMemo(
      () =>
        curriculum.questions.filter(
          (question) =>
            (filter === "All" ||
              question.pattern ===
              filter) &&
            question.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )
        ),
      [filter, search]
    );

  const completed =
    curriculum.questions.filter(
      (question) =>
        state.questions?.[
        question.id
        ]
    ).length;

  function toggleQuestion(id) {
    updateState(
      (current) => ({
        ...current,

        questions: {
          ...current.questions,

          [id]:
            !current.questions?.[id],
        },
      })
    );
  }

  return (
    <Section>

      <Head
        icon={Brain}
        title="DSA Arsenal"
        sub={`${completed}/300 completed • pattern-first Java preparation.`}
      />

      <div className="toolbar">

        <div>

          <Search />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search 300 problems…"
          />

        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(
              event.target.value
            )
          }
        >

          <option value="All">
            All
          </option>

          {curriculum.patterns.map(
            (pattern) => (
              <option
                key={pattern}
                value={pattern}
              >
                {pattern}
              </option>
            )
          )}

        </select>

      </div>

      <div className="progressline">

        <b>
          {completed}/300
        </b>

        <div className="bar">

          <i
            style={{
              width: `${Math.min(
                completed / 3,
                100
              )}%`,
            }}
          />

        </div>

        <span>
          Understand + revise,
          don't just count.
        </span>

      </div>

      <div className="questions">

        {questions.map(
          (question) => (
            <motion.article
              layout
              key={question.id}
              className={
                state.questions?.[
                  question.id
                ]
                  ? "q done"
                  : "q"
              }
            >

              <b>
                #
                {String(
                  question.id
                ).padStart(3, "0")}
              </b>

              <div>

                <small>
                  {question.pattern}
                </small>

                <h3>
                  {question.title}
                </h3>

                <a
                  href={question.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open LeetCode
                  <ExternalLink />
                </a>

              </div>

              <button
                onClick={() =>
                  toggleQuestion(
                    question.id
                  )
                }
                aria-label={`Mark ${question.title}`}
              >

                {state.questions?.[
                  question.id
                ] ? (
                  <CheckCircle2 />
                ) : (
                  <Circle />
                )}

              </button>

            </motion.article>
          )
        )}

        {questions.length === 0 && (
          <div className="empty">

            <Search />

            <h3>
              No problems found.
            </h3>

            <p>
              Try another search
              or pattern.
            </p>

          </div>
        )}

      </div>

    </Section>
  );
}

/* =========================================================
   ENGINEERING
========================================================= */

function Eng({
  state,
  updateState,
}) {
  const groups = {
    "JAVA CORE": [
      "OOP + SOLID",
      "Collections",
      "HashMap internals",
      "Streams / Lambdas",
      "JVM memory + GC",
      "Threads + ExecutorService",
      "synchronized / volatile",
    ],

    "SPRING BOOT": [
      "IoC / DI",
      "Beans",
      "REST",
      "Validation",
      "Exceptions",
      "JPA / Hibernate",
      "Transactions",
      "Testing",
    ],

    "CS FUNDAMENTALS": [
      "DBMS / ACID",
      "Isolation",
      "Indexes",
      "SQL joins",
      "Processes / threads",
      "Virtual memory",
      "Deadlocks",
      "HTTP / HTTPS",
      "DNS",
      "TCP / UDP",
    ],

    "SYSTEM DESIGN": [
      "Load balancer",
      "Cache",
      "CDN",
      "Replication",
      "Sharding",
      "Queues",
      "Rate limiting",
      "URL shortener",
      "Notification system",
      "File upload",
    ],

    "AEM / SLING": [
      "Request resolution",
      "Sling Models",
      "OSGi",
      "JCR",
      "HTL",
      "Components",
      "Dispatcher",
      "Author vs Publish",
    ],
  };

  function toggleTopic(
    storageKey
  ) {
    updateState(
      (current) => ({
        ...current,

        eng: {
          ...current.eng,

          [storageKey]:
            !current.eng?.[
            storageKey
            ],
        },
      })
    );
  }

  return (
    <Section>

      <Head
        icon={Code2}
        title="Engineering Lab"
        sub="Java-first fundamentals + backend + systems + AEM depth."
      />

      <div className="engGrid">

        {Object.entries(
          groups
        ).map(
          ([name, topics]) => (
            <div
              className="panel"
              key={name}
            >

              <Title
                icon={Code2}
                title={name}
              />

              {topics.map(
                (topic) => {
                  const storageKey =
                    `${name}::${topic}`;

                  const completed =
                    Boolean(
                      state.eng?.[
                      storageKey
                      ]
                    );

                  return (
                    <button
                      className={
                        completed
                          ? "engrow checked"
                          : "engrow"
                      }
                      key={storageKey}
                      onClick={() =>
                        toggleTopic(
                          storageKey
                        )
                      }
                    >

                      {completed ? (
                        <CheckCircle2 />
                      ) : (
                        <Circle />
                      )}

                      {topic}

                    </button>
                  );
                }
              )}

            </div>
          )
        )}

      </div>

    </Section>
  );
}

/* =========================================================
   AMAZON PREP
========================================================= */

function Amazon({
  state,
  updateState,
}) {
  const leadershipPrinciples = [
    "Customer Obsession",
    "Ownership",
    "Invent and Simplify",
    "Are Right, A Lot",
    "Learn and Be Curious",
    "Hire and Develop the Best",
    "Insist on the Highest Standards",
    "Think Big",
    "Bias for Action",
    "Frugality",
    "Earn Trust",
    "Dive Deep",
    "Have Backbone; Disagree and Commit",
    "Deliver Results",
    "Strive to be Earth's Best Employer",
    "Success and Scale Bring Broad Responsibility",
  ];

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const activePrinciple =
    leadershipPrinciples[
    activeIndex
    ];

  const currentStory =
    state.stories?.[
    activePrinciple
    ] || {};

  function updateStory(
    field,
    value
  ) {
    updateState(
      (current) => ({
        ...current,

        stories: {
          ...current.stories,

          [activePrinciple]: {
            ...current.stories?.[
            activePrinciple
            ],

            [field]: value,
          },
        },
      })
    );
  }

  const fields = [
    [
      "Situation",
      "f0",
    ],

    [
      "Task",
      "f1",
    ],

    [
      "Action — what I personally did",
      "f2",
    ],

    [
      "Result / evidence",
      "f3",
    ],

    [
      "Lesson / what I would change",
      "f4",
    ],
  ];

  return (
    <Section>

      <Head
        icon={Target}
        title="Amazon Interview Vault"
        sub="Leadership Principles + project evidence. Never invent metrics."
      />

      <div className="amazon">

        {/* LP LIST */}

        <div className="lp">

          {leadershipPrinciples.map(
            (
              principle,
              index
            ) => (
              <button
                key={principle}
                className={
                  index ===
                    activeIndex
                    ? "on"
                    : ""
                }
                onClick={() =>
                  setActiveIndex(
                    index
                  )
                }
              >

                <b>
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </b>

                {principle}

              </button>
            )
          )}

        </div>

        {/* STORY EDITOR */}

        <div className="story">

          <div className="eyebrow">
            LEADERSHIP PRINCIPLE
          </div>

          <h2>
            {activePrinciple}
          </h2>

          <div className="fields">

            {fields.map(
              ([field, key]) => (
                <label
                  key={key}
                >

                  {field}

                  <textarea
                    value={
                      currentStory[
                      key
                      ] || ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateStory(
                        key,
                        event.target
                          .value
                      )
                    }
                    placeholder="Write your real TCS/project evidence…"
                  />

                </label>
              )
            )}

          </div>

          <div className="tip">

            <Sparkles />

            <span>

              <b>
                Interview rule:
              </b>

              {" "}
              most of the answer
              should be your personal
              actions, decisions,
              trade-offs and result.

            </span>

          </div>

        </div>

      </div>

      {/* PREP CARDS */}

      <div className="prep">

        <Card
          icon={Database}
          title="DBMS + SQL"
          description="ACID • indexes • joins • transactions"
        />

        <Card
          icon={Network}
          title="Networking"
          description="HTTP • DNS • TCP • REST"
        />

        <Card
          icon={Cpu}
          title="OS"
          description="processes • threads • memory"
        />

        <Card
          icon={Layers3}
          title="System Design"
          description="cache • queues • scaling"
        />

      </div>

    </Section>
  );
}

/* =========================================================
   PREP CARD
========================================================= */

function Card({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div>

      <Icon />

      <b>
        {title}
      </b>

      <small>
        {description}
      </small>

    </div>
  );
}

/* =========================================================
   SECTION ANIMATION
========================================================= */

function Section({
  children,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      {children}
    </motion.section>
  );
}

export default App;