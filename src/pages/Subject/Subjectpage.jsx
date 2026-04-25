import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

// ─── Subject data ─────────────────────────────────────────────────────────────

const SUBJECTS = {
  ml: {
    key: "ml",
    title: "Machine Learning",
    subtitle: "Classification",
    tagline: "Teaching machines to draw boundaries between worlds.",
    description:
      "Classification is the task of predicting which category an input belongs to. At its core, a classifier learns a decision boundary — a line, curve, or hyperplane that separates classes in feature space. You'll explore how different algorithms draw these boundaries, and what trade-offs each one makes.",
    accentColor: "#3C3489",
    lightColor: "#EEEDFE",
    midColor: "#AFA9EC",
    darkColor: "#26215C",
    cardBg: "#F5F4FE",
    headerBg: "linear-gradient(150deg, #EEEDFE 0%, #E8E6FC 60%, #DFF0FB 100%)",
    orbColors: [
      "rgba(127,119,221,0.2)",
      "rgba(55,138,221,0.12)",
      "rgba(175,169,236,0.15)",
    ],
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="10" cy="23" r="4" fill="#7F77DD" opacity="0.9" />
        <circle cx="14" cy="15" r="4" fill="#7F77DD" opacity="0.7" />
        <circle cx="7" cy="29" r="3" fill="#7F77DD" opacity="0.55" />
        <circle cx="26" cy="11" r="4" fill="#5DCAA5" opacity="0.9" />
        <circle cx="29" cy="18" r="4" fill="#5DCAA5" opacity="0.7" />
        <circle cx="24" cy="24" r="3" fill="#5DCAA5" opacity="0.55" />
        <line
          x1="18"
          y1="4"
          x2="18"
          y2="32"
          stroke="#3C3489"
          strokeWidth="1"
          strokeDasharray="2.5,2"
          opacity="0.3"
        />
      </svg>
    ),
    topics: [
      {
        key: "classification",
        title: "Binary Classification",
        duration: "~18 min",
        difficulty: "Beginner",
        description:
          "Understand how a model learns to separate two classes using labelled training data. Explore logistic regression, decision surfaces, and what happens at the boundary.",
        whatYoullLearn: [
          "Decision boundaries & feature space",
          "Logistic regression intuition",
          "Training vs. test accuracy",
          "Overfitting signals",
        ],
        visualPreview: "scatter",
        completed: true,
        progress: 100,
      },
      {
        key: "knn",
        title: "K-Nearest Neighbours",
        duration: "~22 min",
        difficulty: "Beginner",
        description:
          "A deceptively simple idea — classify a point by looking at its neighbours. Adjust K interactively and watch how the decision boundary shifts from jagged to smooth.",
        whatYoullLearn: [
          "Distance metrics (Euclidean, Manhattan)",
          "The effect of K on bias-variance",
          "Curse of dimensionality",
          "When KNN fails",
        ],
        visualPreview: "voronoi",
        completed: true,
        progress: 100,
      },
      {
        key: "decision-trees",
        title: "Decision Trees",
        duration: "~25 min",
        difficulty: "Intermediate",
        description:
          "Build a tree that recursively partitions the feature space by asking yes/no questions. See how depth, pruning, and impurity measures shape the resulting model.",
        whatYoullLearn: [
          "Information gain & Gini impurity",
          "Recursive partitioning",
          "Pruning to reduce overfitting",
          "Tree depth trade-offs",
        ],
        visualPreview: "tree",
        completed: false,
        progress: 0,
      },
    ],
  },

  dsa: {
    key: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Graph Traversal",
    tagline: "Finding your way through a maze of connected nodes.",
    description:
      "Graphs appear everywhere — maps, social networks, dependency trees, the web itself. BFS and DFS are the two fundamental strategies for exploring them. Each makes different guarantees about what it finds and in what order, making each better suited to different problems.",
    accentColor: "#0F6E56",
    lightColor: "#E1F5EE",
    midColor: "#5DCAA5",
    darkColor: "#04342C",
    cardBg: "#F0FBF6",
    headerBg: "linear-gradient(150deg, #E1F5EE 0%, #D8F2E8 60%, #E0F7FA 100%)",
    orbColors: [
      "rgba(29,158,117,0.18)",
      "rgba(93,202,165,0.14)",
      "rgba(0,200,180,0.1)",
    ],
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="7" r="4" fill="#1D9E75" opacity="0.9" />
        <circle cx="8" cy="20" r="4" fill="#1D9E75" opacity="0.8" />
        <circle cx="28" cy="20" r="4" fill="#1D9E75" opacity="0.8" />
        <circle cx="4" cy="31" r="3" fill="#5DCAA5" opacity="0.7" />
        <circle cx="13" cy="31" r="3" fill="#5DCAA5" opacity="0.7" />
        <circle cx="28" cy="31" r="3" fill="#5DCAA5" opacity="0.7" />
        <line
          x1="18"
          y1="11"
          x2="8"
          y2="16"
          stroke="#1D9E75"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <line
          x1="18"
          y1="11"
          x2="28"
          y2="16"
          stroke="#1D9E75"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <line
          x1="8"
          y1="24"
          x2="4"
          y2="28"
          stroke="#5DCAA5"
          strokeWidth="1.2"
          opacity="0.45"
        />
        <line
          x1="8"
          y1="24"
          x2="13"
          y2="28"
          stroke="#5DCAA5"
          strokeWidth="1.2"
          opacity="0.45"
        />
      </svg>
    ),
    topics: [
      {
        key: "bfs",
        title: "Breadth-First Search",
        duration: "~20 min",
        difficulty: "Beginner",
        description:
          "BFS explores a graph level by level, visiting all neighbours of a node before moving deeper. It's guaranteed to find the shortest path in an unweighted graph.",
        whatYoullLearn: [
          "Queue-based traversal mechanics",
          "Level-order exploration",
          "Shortest path guarantee",
          "Visited set to avoid cycles",
        ],
        visualPreview: "bfs",
        completed: true,
        progress: 100,
      },
      {
        key: "dfs",
        title: "Depth-First Search",
        duration: "~20 min",
        difficulty: "Beginner",
        description:
          "DFS dives as deep as possible along each branch before backtracking. It uses a stack (or recursion) and excels at problems like cycle detection and topological sort.",
        whatYoullLearn: [
          "Stack-based & recursive DFS",
          "Pre-, in-, post-order traversal",
          "Cycle detection",
          "Connected components",
        ],
        visualPreview: "dfs",
        completed: false,
        progress: 40,
      },
    ],
  },

  os: {
    key: "os",
    title: "Operating Systems",
    subtitle: "CPU Scheduling",
    tagline: "Deciding who gets the CPU — and for how long.",
    description:
      "The CPU can only run one process at a time (per core), so the OS scheduler decides the order. Different algorithms optimise for different goals — turnaround time, waiting time, responsiveness — and each involves trade-offs. You'll build intuition by watching processes compete for the CPU in real time.",
    accentColor: "#854F0B",
    lightColor: "#FAEEDA",
    midColor: "#EF9F27",
    darkColor: "#412402",
    cardBg: "#FEF8EE",
    headerBg: "linear-gradient(150deg, #FAEEDA 0%, #FDF0D5 60%, #FFF8E8 100%)",
    orbColors: [
      "rgba(239,159,39,0.2)",
      "rgba(186,117,23,0.12)",
      "rgba(250,206,117,0.18)",
    ],
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect
          x="3"
          y="9"
          width="9"
          height="6"
          rx="2.5"
          fill="#EF9F27"
          opacity="0.9"
        />
        <rect
          x="3"
          y="18"
          width="6"
          height="6"
          rx="2.5"
          fill="#EF9F27"
          opacity="0.65"
        />
        <rect
          x="14"
          y="12"
          width="13"
          height="6"
          rx="2.5"
          fill="#BA7517"
          opacity="0.9"
        />
        <rect
          x="14"
          y="21"
          width="8"
          height="6"
          rx="2.5"
          fill="#BA7517"
          opacity="0.65"
        />
        <rect
          x="29"
          y="10"
          width="3"
          height="18"
          rx="1.5"
          fill="#1A1917"
          opacity="0.1"
        />
        <rect
          x="3"
          y="28"
          width="24"
          height="2"
          rx="1"
          fill="#1A1917"
          opacity="0.07"
        />
      </svg>
    ),
    topics: [
      {
        key: "fifo",
        title: "First In, First Out (FIFO)",
        duration: "~15 min",
        difficulty: "Beginner",
        description:
          "The simplest scheduling policy — processes run in arrival order, each to completion. Simple to implement and fair in intent, but prone to the convoy effect.",
        whatYoullLearn: [
          "Turnaround & waiting time",
          "The convoy effect",
          "When FIFO works well",
          "Gantt chart reading",
        ],
        visualPreview: "fifo",
        completed: false,
        progress: 0,
      },
      {
        key: "sjf",
        title: "Shortest Job First (SJF)",
        duration: "~18 min",
        difficulty: "Beginner",
        description:
          "SJF minimises average waiting time by always running the shortest available job next. Optimal in theory, but requires knowing burst times in advance.",
        whatYoullLearn: [
          "Optimal average wait-time proof",
          "Preemptive vs non-preemptive",
          "Starvation of long jobs",
          "Burst-time estimation",
        ],
        visualPreview: "sjf",
        completed: false,
        progress: 0,
      },
      {
        key: "round-robin",
        title: "Round Robin",
        duration: "~20 min",
        difficulty: "Intermediate",
        description:
          "Each process gets a fixed time quantum. When its quantum expires, it's preempted and added to the back of the queue. Tune the quantum interactively and watch responsiveness shift.",
        whatYoullLearn: [
          "Time quantum trade-offs",
          "Context switch overhead",
          "Response time vs throughput",
          "Comparing with FIFO & SJF",
        ],
        visualPreview: "rr",
        completed: false,
        progress: 0,
      },
    ],
  },
};

const THEME_CONFIGS = {
  light: {
    label: "Light",
    bg: "#F9F8F6",
    panel: "#FFFFFF",
    text: "#1A1917",
    subtext: "#6B6963",
    accent: "#3C3489", // Deep Purple
    border: "#E4E2DC",
    cardBg: "#EEEDFE",
  },
  dark: {
    label: "Dark",
    bg: "#121211", // Slightly deeper black
    panel: "#1E1E1C", // Subtle elevation
    text: "#777777", // Soft off-white for readability
    subtext: "#aba156", // Muted grey-gold
    accent: "#5d50ed", // Lavender (easier on eyes than hot pink)
    border: "#33322E",
    cardBg: "#252429",
  },
  "cb-light": {
    label: "CB Light",
    bg: "#FFF9E8",
    panel: "#FFFFFF",
    text: "#1A1400",
    subtext: "#5A5030",
    accent: "#005AB5", // Changed to "Blue" (Safe for most colorblindness)
    border: "#DBCBA0",
    cardBg: "#FFF0C0",
  },
  "cb-dark": {
    label: "CB Dark",
    bg: "#00121F",
    panel: "#001E33",
    text: "#FFFFFF", // Pure white for max contrast
    subtext: "#B8C9D6",
    accent: "#FFC20A", // High-contrast Yellow
    border: "#1A3040",
    cardBg: "#002A47",
  },
};

const FONT_CONFIGS = [
  {
    key: "neutral",
    label: "Neutral",
    desc: "Clean, modern, easy to read",
    sample: "The quick brown fox",
    family: "'DM Sans', sans-serif",
  },
  {
    key: "academic",
    label: "Academic",
    desc: "Scholarly serif — classic feel",
    sample: "The quick brown fox",
    family: "'Lora', serif",
  },
  {
    key: "dyslexic",
    label: "Accessible",
    desc: "High-legibility typeface",
    sample: "The quick brown fox",
    family: "'Atkinson Hyperlegible', sans-serif",
  },
];

const FONT_SIZE_CONFIGS = [
  { key: "sm", label: "Small", size: "0.82rem", desc: "More content visible" },
  { key: "md", label: "Default", size: "0.95rem", desc: "Balanced" },
  { key: "lg", label: "Large", size: "1.08rem", desc: "Easier to read" },
  {
    key: "xl",
    label: "Extra large",
    size: "1.2rem",
    desc: "Maximum readability",
  },
];

// ─── Mini visual previews ─────────────────────────────────────────────────────

function MiniPreview({ type, accent, light, mid }) {
  if (type === "scatter" || type === "voronoi") {
    const pts = [
      { x: 18, y: 30, c: 0 },
      { x: 22, y: 20, c: 0 },
      { x: 14, y: 24, c: 0 },
      { x: 38, y: 18, c: 1 },
      { x: 42, y: 28, c: 1 },
      { x: 36, y: 24, c: 1 },
    ];
    return (
      <svg viewBox="0 0 60 50" width="60" height="50">
        <line
          x1="30"
          y1="5"
          x2="30"
          y2="45"
          stroke={mid}
          strokeWidth="0.8"
          strokeDasharray="2,2"
          opacity="0.5"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={p.c === 0 ? accent : mid}
            opacity="0.75"
          />
        ))}
      </svg>
    );
  }
  if (type === "tree") {
    return (
      <svg viewBox="0 0 60 50" width="60" height="50">
        <rect
          x="22"
          y="4"
          width="16"
          height="10"
          rx="3"
          fill={accent}
          opacity="0.8"
        />
        <rect
          x="8"
          y="22"
          width="16"
          height="10"
          rx="3"
          fill={mid}
          opacity="0.75"
        />
        <rect
          x="36"
          y="22"
          width="16"
          height="10"
          rx="3"
          fill={mid}
          opacity="0.75"
        />
        <rect
          x="2"
          y="38"
          width="12"
          height="8"
          rx="2"
          fill={light}
          style={{ stroke: mid, strokeWidth: 0.8 }}
        />
        <rect
          x="17"
          y="38"
          width="12"
          height="8"
          rx="2"
          fill={light}
          style={{ stroke: mid, strokeWidth: 0.8 }}
        />
        <rect
          x="36"
          y="38"
          width="12"
          height="8"
          rx="2"
          fill={light}
          style={{ stroke: mid, strokeWidth: 0.8 }}
        />
        <line
          x1="30"
          y1="14"
          x2="16"
          y2="22"
          stroke={accent}
          strokeWidth="0.8"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="14"
          x2="44"
          y2="22"
          stroke={accent}
          strokeWidth="0.8"
          opacity="0.5"
        />
        <line
          x1="16"
          y1="32"
          x2="8"
          y2="38"
          stroke={mid}
          strokeWidth="0.8"
          opacity="0.5"
        />
        <line
          x1="16"
          y1="32"
          x2="23"
          y2="38"
          stroke={mid}
          strokeWidth="0.8"
          opacity="0.5"
        />
      </svg>
    );
  }
  if (type === "bfs") {
    const nodes = [
      { x: 30, y: 8, v: true },
      { x: 14, y: 24, v: true },
      { x: 46, y: 24, v: true },
      { x: 6, y: 40, v: false },
      { x: 22, y: 40, v: false },
      { x: 46, y: 40, v: false },
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
    ];
    return (
      <svg viewBox="0 0 60 50" width="60" height="50">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={mid}
            strokeWidth="0.9"
            opacity="0.4"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="5"
            fill={n.v ? accent : light}
            stroke={mid}
            strokeWidth="0.8"
          />
        ))}
      </svg>
    );
  }
  if (type === "dfs") {
    const nodes = [
      { x: 30, y: 8, v: 2 },
      { x: 14, y: 24, v: 1 },
      { x: 46, y: 24, v: 0 },
      { x: 6, y: 40, v: 0 },
      { x: 22, y: 40, v: 0 },
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
    ];
    return (
      <svg viewBox="0 0 60 50" width="60" height="50">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={mid}
            strokeWidth="0.9"
            opacity="0.4"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="5"
            fill={n.v === 2 ? accent : n.v === 1 ? mid : light}
            stroke={mid}
            strokeWidth="0.8"
          />
        ))}
      </svg>
    );
  }
  // Scheduling previews (fifo / sjf / rr)
  const bars =
    type === "fifo"
      ? [
          { w: 20, c: accent },
          { w: 14, c: mid },
          { w: 26, c: accent },
          { w: 10, c: mid },
        ]
      : type === "sjf"
        ? [
            { w: 10, c: mid },
            { w: 14, c: accent },
            { w: 20, c: mid },
            { w: 26, c: accent },
          ]
        : [
            { w: 10, c: accent },
            { w: 10, c: mid },
            { w: 10, c: accent },
            { w: 10, c: mid },
          ];
  let x = 2;
  return (
    <svg viewBox="0 0 60 50" width="60" height="50">
      {["P1", "P2", "P3", "P4"].map((p, i) => (
        <text
          key={i}
          x="2"
          y={10 + i * 10}
          fontSize="5"
          fill={accent}
          opacity="0.7"
        >
          {p}
        </text>
      ))}
      {bars.map((b, i) => {
        const rx = x + 10;
        x += b.w;
        return (
          <rect
            key={i}
            x={rx}
            y={5 + i * 10}
            width={b.w}
            height="7"
            rx="1.5"
            fill={b.c}
            opacity="0.75"
          />
        );
      })}
    </svg>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ level, accent, light, mid }) {
  const colors = {
    Beginner: { bg: light, text: accent, border: mid + "60" },
    Intermediate: { bg: "#FEF8EE", text: "#854F0B", border: "#EF9F2760" },
    Advanced: { bg: "#FCEBEB", text: "#A32D2D", border: "#F7C1C160" },
  };
  const c = colors[level] ?? colors.Beginner;
  return (
    <span
      style={{
        fontSize: "0.72em",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: "2px 8px",
        borderRadius: "100px",
      }}
    >
      {level}
    </span>
  );
}

function AvatarNavBubble({ user }) {
  const [failed, setFailed] = useState(false);
  const hasImage = user?.avatarImage && !failed;
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "var(--accent-light)",
        border: "1px solid var(--accent-mid)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontSize: "1em",
      }}
    >
      {hasImage ? (
        <img
          src={user.avatarImage}
          alt={user.avatarName ?? "avatar"}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        (user?.avatar?.emoji ?? "🦉")
      )}
    </div>
  );
}

// ─── Topic row ────────────────────────────────────────────────────────────────

function TopicRow({ topic, subject, index, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { accentColor: accent, lightColor: light, midColor: mid } = subject;

  const statusColor = topic.completed
    ? "#3B6D11"
    : topic.progress > 0
      ? accent
      : "var(--text-faint)";
  const statusBg = topic.completed
    ? "#EAF3DE"
    : topic.progress > 0
      ? light
      : "var(--surface-alt)";
  const statusBorder = topic.completed
    ? "#C0DD97"
    : topic.progress > 0
      ? mid
      : "var(--border)";
  const statusLabel = topic.completed
    ? "Complete"
    : topic.progress > 0
      ? `${topic.progress}% done`
      : "Not started";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${expanded ? mid : hovered ? mid + "80" : "var(--border)"}`,
        borderRadius: "16px",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: expanded
          ? `0 4px 24px ${light}CC`
          : hovered
            ? `0 2px 12px ${light}80`
            : "0 1px 4px var(--shadow)",
        animation: `fadeUp 0.45s ease ${0.1 + index * 0.08}s both`,
      }}
    >
      {/* ── Row header (always visible) ── */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
        }}
      >
        {/* Index / check — clicks navigate */}
        <div
          onClick={() => onClick(topic.key)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            flexShrink: 0,
            background: expanded ? accent : statusBg,
            border: `1px solid ${expanded ? accent : statusBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s, border-color 0.2s",
            cursor: "pointer",
          }}
        >
          {topic.completed ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline
                points="2,7 5.5,10.5 12,3.5"
                stroke={expanded ? "#fff" : "#3B6D11"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span
              style={{
                fontSize: "0.84em",
                fontWeight: 600,
                color: expanded ? "#fff" : accent,
                fontFamily: "var(--font-body)",
              }}
            >
              {index + 1}
            </span>
          )}
        </div>

        {/* Title + meta — clicks navigate */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          onClick={() => onClick(topic.key)}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              flexWrap: "wrap",
              marginBottom: "0.3rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.1em",
                fontWeight: 400,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {topic.title}
            </h3>
            <DifficultyBadge
              level={topic.difficulty}
              accent={accent}
              light={light}
              mid={mid}
            />
          </div>
          <p
            style={{
              fontSize: "0.86em",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: "0.4rem",
            }}
          >
            {topic.description}
          </p>
          {topic.progress > 0 && !topic.completed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              <div
                style={{
                  flex: 1,
                  maxWidth: "140px",
                  height: "3px",
                  borderRadius: "2px",
                  background: "var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${topic.progress}%`,
                    background: accent,
                    borderRadius: "2px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span
                style={{ fontSize: "0.74em", color: accent, fontWeight: 500 }}
              >
                {topic.progress}%
              </span>
            </div>
          )}
        </div>

        {/* Status pill + duration */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.4rem",
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => onClick(topic.key)}
        >
          <span
            style={{
              fontSize: "0.76em",
              fontWeight: 500,
              color: statusColor,
              background: statusBg,
              border: `1px solid ${statusBorder}`,
              padding: "2px 9px",
              borderRadius: "100px",
            }}
          >
            {statusLabel}
          </span>
          <span style={{ fontSize: "0.76em", color: "var(--text-faint)" }}>
            {topic.duration}
          </span>
        </div>

        {/* Expand chevron */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          title="Preview details"
          style={{
            color: expanded ? accent : "var(--border)",
            transition: "color 0.2s, transform 0.25s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            cursor: "pointer",
            padding: "4px",
            borderRadius: "6px",
            background: expanded ? light : "transparent",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${light}`,
            background: `${light}40`,
            padding: "1.25rem 1.5rem",
            animation: "fadeUp 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2rem",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* What you'll learn */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p
                style={{
                  fontSize: "0.74em",
                  fontWeight: 500,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: accent,
                  marginBottom: "0.7rem",
                }}
              >
                What you'll learn
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                }}
              >
                {topic.whatYoullLearn.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: mid,
                        marginTop: "6px",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.86em",
                        color: "var(--text)",
                        lineHeight: 1.55,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini visual + CTA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${light}`,
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  boxShadow: `0 2px 8px ${light}`,
                }}
              >
                <MiniPreview
                  type={topic.visualPreview}
                  accent={accent}
                  light={light}
                  mid={mid}
                />
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {topic.progress > 0 && !topic.completed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(topic.key);
                    }}
                    style={{
                      padding: "0.55rem 1rem",
                      background: "var(--surface)",
                      border: `1px solid ${mid}`,
                      borderRadius: "9px",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.86em",
                      fontWeight: 500,
                      color: accent,
                      cursor: "pointer",
                    }}
                  >
                    Try it out
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(topic.key);
                  }}
                  style={{
                    padding: "0.55rem 1.2rem",
                    background: accent,
                    border: "none",
                    borderRadius: "9px",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.86em",
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {topic.completed
                    ? "Review"
                    : topic.progress > 0
                      ? "Continue"
                      : "Start"}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6h8M6 2l4 4-4 4"
                      stroke="#fff"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SubjectPage() {
  const { subjectKey } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const theme = user?.theme ?? "light";

  const subject = SUBJECTS[subjectKey];

  // 404 fallback
  if (!subject) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-body)",
          background: "var(--surface-alt)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "2.1em",
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            Subject not found.
          </p>
          <button
            onClick={() => navigate("/landing")}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalTopics = subject.topics.length;
  const completedTopics = subject.topics.filter((t) => t.completed).length;
  const inProgress = subject.topics.filter(
    (t) => t.progress > 0 && !t.completed,
  ).length;
  const totalMins = subject.topics.reduce(
    (s, t) => s + parseInt(t.duration),
    0,
  );
  const overallProgress = Math.round(
    subject.topics.reduce((s, t) => s + t.progress, 0) / totalTopics,
  );

  function handleTopicClick(topicKey) {
    navigate(`/subject/${subjectKey}/${topicKey}`);
  }

  // ── Focus / fullscreen ────────────────────────────────────────────────────
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const handler = () => setFocusMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function enterFocus() {
    document.documentElement.requestFullscreen().catch(() => {});
    setFocusMode(true);
  }

  function exitFocus() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setFocusMode(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes drift  { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-12px) scale(1.03); } }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:var(--accent-mid); border-radius:3px; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "var(--font-body)",
          fontSize: "var(--font-size-base)",
          background: "subject.headerBg,",
        }}
      >
        {/* ── Navbar ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2.5rem",
            height: "60px",
            isolation: "isolate",
            backdropFilter: "none",
            borderBottom: `1px solid ${subject.lightColor}80`,
            position: "sticky",
            background:
              theme === "light" || theme === "cb-light" ? "#ffffff" : "#121211",
            top: 0,
            zIndex: 1000,
            background:
              theme === "light" || theme === "cb-light" ? "#ffffff" : "#1E1E1C",
            boxShadow:
              theme === "light" || theme === "cb-light"
                ? "0 2px 10px rgba(0,0,0,0.06)"
                : "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => navigate("/landing")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "0.86em",
                fontFamily: "var(--font-body)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10 7H4M6 4l-3 3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </button>
            <span style={{ color: "var(--border)" }}>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "5px",
                  background: subject.accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1em",
                  color: "var(--text)",
                }}
              >
                {subject.title}
              </span>
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
          >
            <button
              onClick={focusMode ? exitFocus : enterFocus}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: focusMode
                  ? subject.accentColor
                  : "rgba(255,255,255,0.7)",
                border: `1px solid ${subject.lightColor}`,
                borderRadius: "100px",
                padding: "5px 12px",
                fontSize: "0.82em",
                color: focusMode ? "#fff" : subject.accentColor,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {focusMode ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="2" fill={subject.accentColor} />
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke={subject.accentColor}
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              )}
              {focusMode ? "Exit Focus" : "Focus"}
            </button>
            <button
              onClick={() => navigate("/settings")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <AvatarNavBubble user={user} />
            <button
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.82em",
                color: "var(--text-faint)",
                fontFamily: "var(--font-body)",
              }}
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════
            HERO HEADER — subject identity + stats
        ══════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            background: subject.headerBg,
            overflow: "hidden",
          }}
        >
          {/* Drifting orbs */}
          {[
            {
              w: 300,
              h: 300,
              top: "-80px",
              left: "-50px",
              bg: subject.orbColors[0],
              dur: "13s",
              delay: "0s",
            },
            {
              w: 200,
              h: 200,
              top: "10px",
              right: "-30px",
              bg: subject.orbColors[1],
              dur: "17s",
              delay: "2s",
            },
            {
              w: 140,
              h: 140,
              bottom: "0px",
              left: "45%",
              bg: subject.orbColors[2],
              dur: "10s",
              delay: "1s",
            },
          ].map((orb, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: orb.w,
                height: orb.h,
                borderRadius: "50%",
                background: orb.bg,
                top: orb.top,
                left: orb.left,
                right: orb.right,
                bottom: orb.bottom,
                animation: `drift ${orb.dur} ease-in-out infinite`,
                animationDelay: orb.delay,
                pointerEvents: "none",
              }}
            />
          ))}

          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "3rem 2rem",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              {/* Left — subject identity */}
              <div style={{ animation: "fadeUp 0.4s ease both" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "15px",
                      background: "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 16px ${subject.lightColor}`,
                    }}
                  >
                    {subject.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.72em",
                        fontWeight: 500,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: subject.accentColor,
                        opacity: 0.8,
                        marginBottom: "2px",
                      }}
                    >
                      {subject.subtitle}
                    </p>
                    <h1
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(1.6rem,3.5vw,2.2rem)",
                        color: subject.darkColor,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.1,
                      }}
                    >
                      {subject.title}
                    </h1>
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "1.05em",
                    fontStyle: "italic",
                    color: subject.accentColor,
                    opacity: 0.75,
                    marginBottom: "0.75rem",
                    maxWidth: "480px",
                  }}
                >
                  {subject.tagline}
                </p>

                <p
                  style={{
                    fontSize: "0.93em",
                    color: subject.darkColor,
                    opacity: 0.75,
                    lineHeight: 1.7,
                    maxWidth: "520px",
                  }}
                >
                  {subject.description}
                </p>
              </div>

              {/* Right — stat cluster */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  minWidth: "180px",
                  animation: "fadeUp 0.4s ease 0.1s both",
                }}
              >
                {[
                  {
                    label: "Topics",
                    value: `${completedTopics} / ${totalTopics}`,
                    sub: "completed",
                  },
                  {
                    label: "In progress",
                    value: 1,
                    sub: inProgress === 1 ? "topic" : "topics",
                  },
                  {
                    label: "Total time",
                    value: `~${600} min`,
                    sub: "to complete all",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      borderRadius: "12px",
                      padding: "0.8rem 1.1rem",
                      boxShadow: `0 2px 10px ${subject.lightColor}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68em",
                        color: subject.accentColor,
                        fontWeight: 500,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                        opacity: 0.8,
                      }}
                    >
                      {stat.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1.37em",
                        color: subject.darkColor,
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      style={{
                        fontSize: "0.74em",
                        color: subject.darkColor,
                        opacity: 0.55,
                        marginTop: "2px",
                      }}
                    >
                      {stat.sub}
                    </p>
                  </div>
                ))}

                {/* Overall progress bar */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: "12px",
                    padding: "0.8rem 1.1rem",
                    boxShadow: `0 2px 10px ${subject.lightColor}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68em",
                        color: subject.accentColor,
                        fontWeight: 500,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        opacity: 0.8,
                      }}
                    >
                      Overall
                    </p>
                    <p
                      style={{
                        fontSize: "0.76em",
                        fontWeight: 500,
                        color: subject.accentColor,
                      }}
                    >
                      {overallProgress}%
                    </p>
                  </div>
                  <div
                    style={{
                      height: "5px",
                      borderRadius: "3px",
                      background: `${subject.lightColor}CC`,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${overallProgress}%`,
                        background: `linear-gradient(90deg, ${subject.accentColor}, ${subject.midColor})`,
                        borderRadius: "3px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            TOPICS ZONE
        ══════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--bg)",
            borderTop: `1px solid ${subject.lightColor}60`,
          }}
        >
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "2.5rem 2rem 4rem",
            }}
          >
            {/* Section heading */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "1.3em",
                    fontWeight: 400,
                    color: "var(--text)",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Topics
                </h2>
                <p
                  style={{
                    fontSize: "0.84em",
                    color: "var(--text-faint)",
                    marginTop: "2px",
                  }}
                >
                  Click any topic to expand details — then jump straight in
                </p>
              </div>
              <span style={{ fontSize: "0.82em", color: "var(--text-faint)" }}>
                {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
              </span>
            </div>

            {/* Topic list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {subject.topics.map((topic, i) => (
                <TopicRow
                  key={topic.key}
                  topic={topic}
                  subject={subject}
                  index={i}
                  onClick={handleTopicClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}