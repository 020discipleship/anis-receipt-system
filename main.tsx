import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowDownToLine,
  CalendarDays,
  ClipboardList,
  Copy,
  Edit,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  Printer,
  Receipt,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Share2,
  Trash2,
  User,
} from "lucide-react";
import html2canvas from "html2canvas";
import "./styles.css";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type PaymentItem = {
  id: string;
  name: string;
  defaultAmount: number;
};

type Category = {
  id: string;
  name: string;
  items: PaymentItem[];
};

type ReceiptLine = {
  id: string;
  categoryId: string;
  itemId: string;
  categoryName: string;
  itemName: string;
  amount: number;
  note?: string;
};

type ReceiptRecord = {
  id: string;
  receiptNumber: string;
  date: string;
  studentName: string;
  grade: string;
  className: string;
  studentId?: string;
  parentPhone?: string;
  sendMethod: "WhatsApp" | "SMS" | "manual";
  paymentMethod?: "Cash" | "Bank Transfer" | "Credit Card";
  sentStatus: "not sent" | "sent";
  sentDate?: string;
  note?: string;
  items: ReceiptLine[];
  total: number;
  createdBy: StaffUser;
  imageUrl?: string;
  createdAt: string;
};

type SharedAppData = {
  categories: Category[];
  receipts: ReceiptRecord[];
  counter: number;
};

type Page = "dashboard" | "create" | "receipts" | "verify" | "categories" | "detail";

const USERS: Array<StaffUser & { password: string }> = [
  {
    id: "staff-1",
    name: "Finance Department",
    email: "FD@test.com",
    password: "password123",
    role: "admin",
  },
  {
    id: "staff-2",
    name: "Front Desk Staff",
    email: "staff@school.test",
    password: "password123",
    role: "staff",
  },
];

const defaultCategories: Category[] = [
  {
    id: "cat-tuition",
    name: "Tuition",
    items: [
      { id: "item-monthly", name: "Monthly Tuition Fee", defaultAmount: 15000 },
      { id: "item-admission", name: "Admission Fee", defaultAmount: 25000 },
      { id: "item-exam", name: "Exam Fee", defaultAmount: 5000 },
    ],
  },
  {
    id: "cat-uniform",
    name: "Uniform",
    items: [
      { id: "item-shirt", name: "Shirt", defaultAmount: 3500 },
      { id: "item-skirt", name: "Skirt", defaultAmount: 4200 },
      { id: "item-tie", name: "Tie", defaultAmount: 1200 },
      { id: "item-belt", name: "Belt", defaultAmount: 1300 },
    ],
  },
  {
    id: "cat-pe",
    name: "PE Uniform",
    items: [
      { id: "item-pe-shirt", name: "PE T-shirt", defaultAmount: 3000 },
      { id: "item-pe-shorts", name: "PE Shorts", defaultAmount: 2800 },
    ],
  },
];

const GRADE_OPTIONS = [
  "Pre K",
  "LKG",
  "UKG",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "G10",
  "AS",
  "A2",
];

const CLASS_OPTIONS = ["A", "B", "C", "D"];

const STORAGE_KEYS = {
  user: "school-receipt-user",
  categories: "school-receipt-categories",
  receipts: "school-receipt-receipts",
  counter: "school-receipt-counter",
};

const SHARED_STATE_ID = "default";
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const USE_SHARED_STORAGE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const money = {
  format(amount: number) {
    return `LKR ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};

const SMALL_NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function wordsUnderThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds) parts.push(`${SMALL_NUMBER_WORDS[hundreds]} hundred`);
  if (remainder) {
    if (remainder < 20) {
      parts.push(SMALL_NUMBER_WORDS[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones ? `${TENS_WORDS[tens]} ${SMALL_NUMBER_WORDS[ones]}` : TENS_WORDS[tens]);
    }
  }

  return parts.join(" ");
}

function numberToWords(value: number): string {
  if (value === 0) return "zero";

  const groups = [
    { value: 1_000_000_000, label: "billion" },
    { value: 1_000_000, label: "million" },
    { value: 1_000, label: "thousand" },
  ];
  const parts: string[] = [];
  let remainder = Math.floor(value);

  groups.forEach((group) => {
    const count = Math.floor(remainder / group.value);
    if (count) {
      parts.push(`${wordsUnderThousand(count)} ${group.label}`);
      remainder %= group.value;
    }
  });

  if (remainder) parts.push(wordsUnderThousand(remainder));
  return parts.join(" ");
}

function amountInWords(amount: number): string {
  const totalCents = Math.round(amount * 100);
  const rupees = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  const rupeeWords = numberToWords(rupees);
  const centWords = cents ? ` and ${numberToWords(cents)} cents` : "";
  const text = `${rupeeWords} LKR${centWords} only`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();

function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

function readStorage<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalAppData(): SharedAppData {
  return {
    categories: readStorage<Category[]>(STORAGE_KEYS.categories, defaultCategories),
    receipts: readStorage<ReceiptRecord[]>(STORAGE_KEYS.receipts, []),
    counter: Number(localStorage.getItem(STORAGE_KEYS.counter) || "0"),
  };
}

function writeLocalAppData(data: SharedAppData) {
  writeStorage(STORAGE_KEYS.categories, data.categories);
  writeStorage(STORAGE_KEYS.receipts, data.receipts);
  localStorage.setItem(STORAGE_KEYS.counter, String(data.counter));
}

function getNextReceiptNumber(counter: number) {
  const year = new Date().getFullYear();
  const nextCounter = counter + 1;
  return `REC-${year}-${String(nextCounter).padStart(5, "0")}`;
}

function normalizeSharedData(value: Partial<SharedAppData> | null | undefined): SharedAppData {
  return {
    categories: value?.categories?.length ? value.categories : defaultCategories,
    receipts: Array.isArray(value?.receipts) ? value.receipts : [],
    counter: Number.isFinite(value?.counter) ? Number(value?.counter) : 0,
  };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }
  return response;
}

async function loadSharedAppData() {
  const response = await supabaseRequest(
    `shared_app_state?id=eq.${SHARED_STATE_ID}&select=state&limit=1`,
  );
  const rows = (await response.json()) as Array<{ state: SharedAppData }>;
  if (rows[0]?.state) return normalizeSharedData(rows[0].state);

  const initialState = getLocalAppData();
  await saveSharedAppData(initialState);
  return initialState;
}

async function saveSharedAppData(data: SharedAppData) {
  await supabaseRequest("shared_app_state?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: SHARED_STATE_ID,
      state: data,
      updated_at: new Date().toISOString(),
    }),
  });
}

function normalizeStaffUser(user: StaffUser | null) {
  if (!user) return null;
  const currentUser = USERS.find((staff) => staff.id === user.id || staff.email === user.email);
  if (!currentUser) return user;
  return {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };
}

function App() {
  const [user, setUser] = React.useState<StaffUser | null>(() =>
    normalizeStaffUser(readStorage<StaffUser | null>(STORAGE_KEYS.user, null)),
  );
  const [page, setPage] = React.useState<Page>("dashboard");
  const [categories, setCategories] = React.useState<Category[]>(() => getLocalAppData().categories);
  const [receipts, setReceipts] = React.useState<ReceiptRecord[]>(() => getLocalAppData().receipts);
  const [counter, setCounter] = React.useState(() => getLocalAppData().counter);
  const [isDataReady, setIsDataReady] = React.useState(!USE_SHARED_STORAGE);
  const [syncStatus, setSyncStatus] = React.useState(
    USE_SHARED_STORAGE ? "Connecting shared data..." : "Local demo data",
  );
  const [selectedReceiptId, setSelectedReceiptId] = React.useState<string | null>(null);
  const lastSavedSharedState = React.useRef("");

  React.useEffect(() => {
    writeLocalAppData({ categories, receipts, counter });
  }, [categories, receipts, counter]);

  React.useEffect(() => {
    if (user) writeStorage(STORAGE_KEYS.user, user);
  }, [user]);

  React.useEffect(() => {
    if (!USE_SHARED_STORAGE) return;
    let isActive = true;

    async function hydrateSharedData() {
      try {
        const remoteData = await loadSharedAppData();
        if (!isActive) return;
        setCategories(remoteData.categories);
        setReceipts(remoteData.receipts);
        setCounter(remoteData.counter);
        lastSavedSharedState.current = JSON.stringify(remoteData);
        setSyncStatus("Shared data connected");
      } catch {
        if (isActive) setSyncStatus("Shared data unavailable. Using this browser only.");
      } finally {
        if (isActive) setIsDataReady(true);
      }
    }

    hydrateSharedData();
    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!USE_SHARED_STORAGE || !isDataReady) return;
    const data = { categories, receipts, counter };
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedSharedState.current) return;

    const timer = window.setTimeout(async () => {
      try {
        await saveSharedAppData(data);
        lastSavedSharedState.current = serialized;
        setSyncStatus("Shared data saved");
      } catch {
        setSyncStatus("Shared save failed. Check Supabase settings.");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [categories, receipts, counter, isDataReady]);

  React.useEffect(() => {
    if (!USE_SHARED_STORAGE || !isDataReady) return;

    const interval = window.setInterval(async () => {
      try {
        const remoteData = await loadSharedAppData();
        const serialized = JSON.stringify(remoteData);
        if (serialized === lastSavedSharedState.current) return;
        lastSavedSharedState.current = serialized;
        setCategories(remoteData.categories);
        setReceipts(remoteData.receipts);
        setCounter(remoteData.counter);
        setSyncStatus("Shared data refreshed");
      } catch {
        setSyncStatus("Shared refresh failed");
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isDataReady]);

  function login(email: string, password: string) {
    const found = USERS.find((staff) => staff.email === email && staff.password === password);
    if (!found) return false;
    const { password: _password, ...safeUser } = found;
    setUser(safeUser);
    writeStorage(STORAGE_KEYS.user, safeUser);
    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
    setPage("dashboard");
  }

  function saveReceipt(receipt: ReceiptRecord) {
    const isNewReceipt = !receipts.some((item) => item.id === receipt.id);
    if (isNewReceipt) setCounter((value) => value + 1);
    setReceipts((current) => {
      const exists = current.some((item) => item.id === receipt.id);
      return exists
        ? current.map((item) => (item.id === receipt.id ? receipt : item))
        : [receipt, ...current];
    });
    setSelectedReceiptId(receipt.id);
    setPage("detail");
  }

  function updateReceipt(receipt: ReceiptRecord) {
    setReceipts((current) => current.map((item) => (item.id === receipt.id ? receipt : item)));
  }

  if (!user) return <LoginPage onLogin={login} />;

  if (!isDataReady) {
    return (
      <div className="login-page">
        <section className="login-panel">
          <div className="login-logo-wrap">
            <img src="/anis-logo.png" alt="All Nations International School logo" />
          </div>
          <div className="login-content">
            <h1>Loading Shared Data</h1>
            <p>{syncStatus}</p>
          </div>
        </section>
      </div>
    );
  }

  const selectedReceipt = receipts.find((receipt) => receipt.id === selectedReceiptId) || receipts[0];
  const nextReceiptNumber = getNextReceiptNumber(counter);

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} logout={logout} user={user} syncStatus={syncStatus} />
      <main className="main">
        {page === "dashboard" && (
          <Dashboard
            receipts={receipts}
            setPage={setPage}
            openReceipt={(id) => {
              setSelectedReceiptId(id);
              setPage("detail");
            }}
          />
        )}
        {page === "create" && (
          <CreateReceiptPage
            user={user}
            categories={categories}
            receiptNumber={nextReceiptNumber}
            saveReceipt={saveReceipt}
          />
        )}
        {page === "receipts" && (
          <ReceiptListPage
            receipts={receipts}
            openReceipt={(id) => {
              setSelectedReceiptId(id);
              setPage("detail");
            }}
            updateReceipt={updateReceipt}
          />
        )}
        {page === "verify" && (
          <VerifyReceiptPage
            receipts={receipts}
            openReceipt={(id) => {
              setSelectedReceiptId(id);
              setPage("detail");
            }}
          />
        )}
        {page === "categories" && (
          <CategoryPage categories={categories} setCategories={setCategories} />
        )}
        {page === "detail" && selectedReceipt && (
          <ReceiptDetailPage receipt={selectedReceipt} updateReceipt={updateReceipt} />
        )}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => boolean }) {
  const [email, setEmail] = React.useState("FD@test.com");
  const [password, setPassword] = React.useState("password123");
  const [error, setError] = React.useState("");
  const loginTitleStyle: React.CSSProperties = {
    width: "100%",
    margin: "18px 0 0",
    color: "var(--ink)",
    fontSize: "34px",
    fontWeight: 900,
    lineHeight: 1.08,
    textAlign: "center",
    letterSpacing: "0",
  };
  const loginCopyStyle: React.CSSProperties = {
    maxWidth: "330px",
    margin: "10px auto 0",
    color: "var(--muted)",
    fontSize: "16px",
    lineHeight: 1.45,
    textAlign: "center",
  };

  return (
    <div className="login-page">
      <section className="login-panel">
        <div className="login-logo-wrap">
          <img src="/anis-logo.png" alt="All Nations International School logo" />
        </div>
        <div className="login-content">
          <img
            className="login-wordmark"
            src="/anis-text-oneline.png"
            alt="All Nations International School"
          />
          <h1 style={loginTitleStyle}>Receipt System</h1>
          <p style={loginCopyStyle}>Issue, save, and prepare student receipts.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              if (!onLogin(email, password)) setError("Invalid email or password.");
            }}
          >
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary-button" type="submit">
              <User size={18} /> Login
            </button>
          </form>
          <div className="hint">Demo: FD@test.com / password123</div>
        </div>
      </section>
    </div>
  );
}

function Sidebar({
  page,
  setPage,
  logout,
  user,
  syncStatus,
}: {
  page: Page;
  setPage: (page: Page) => void;
  logout: () => void;
  user: StaffUser;
  syncStatus: string;
}) {
  const links: Array<{ page: Page; label: string; icon: React.ReactNode }> = [
    { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { page: "create", label: "Create Receipt", icon: <Plus size={18} /> },
    { page: "receipts", label: "Receipt List", icon: <ClipboardList size={18} /> },
    { page: "verify", label: "Verify Receipt", icon: <ShieldCheck size={18} /> },
    { page: "categories", label: "Categories", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-title">
          <img src="/anis-logo.png" alt="ANIS logo" />
          <span>ANIS Receipts</span>
        </div>
        <nav>
          {links.map((link) => (
            <button
              key={link.page}
              className={page === link.page ? "nav-button active" : "nav-button"}
              onClick={() => setPage(link.page)}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="sidebar-user">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <span>{syncStatus}</span>
        <button className="ghost-button" onClick={logout}>
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
}

function Dashboard({
  receipts,
  setPage,
  openReceipt,
}: {
  receipts: ReceiptRecord[];
  setPage: (page: Page) => void;
  openReceipt: (id: string) => void;
}) {
  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const currentPeriodReceipts = filterReceiptsForCurrentPeriod(receipts, period);
  const sent = currentPeriodReceipts.filter((receipt) => receipt.sentStatus === "sent").length;
  const total = currentPeriodReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const groupedReceipts = groupReceiptsByPeriod(receipts, period);
  const statPrefix = period === "daily" ? "Today" : period === "weekly" ? "This week" : "This month";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of receipt activity.</p>
        </div>
        <button className="primary-button" onClick={() => setPage("create")}>
          <Plus size={18} /> New Receipt
        </button>
      </div>
      <div className="stat-grid">
        <Stat label={`${statPrefix} receipts`} value={String(currentPeriodReceipts.length)} />
        <Stat label={`${statPrefix} sent`} value={String(sent)} />
        <Stat label={`${statPrefix} not sent`} value={String(currentPeriodReceipts.length - sent)} />
        <Stat label={`${statPrefix} collected`} value={money.format(total)} />
      </div>
      <section className="panel">
        <div className="dashboard-list-header">
          <div>
            <h3>Receipts by Period</h3>
            <p>List saved receipts by day, week, or month.</p>
          </div>
          <div className="segmented-control" aria-label="Receipt period">
            {(["daily", "weekly", "monthly"] as const).map((item) => (
              <button
                key={item}
                className={period === item ? "active" : ""}
                type="button"
                onClick={() => setPeriod(item)}
              >
                {item === "daily" ? "Daily" : item === "weekly" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
        <div className="period-list">
          {groupedReceipts.length ? (
            groupedReceipts.map((group) => (
              <section className="period-group" key={group.key}>
                <div className="period-group-header">
                  <div>
                    <h4>{group.label}</h4>
                    <span>{group.receipts.length} receipt{group.receipts.length === 1 ? "" : "s"}</span>
                  </div>
                  <strong>{money.format(group.total)}</strong>
                </div>
                <ReceiptTable
                  receipts={group.receipts}
                  openReceipt={openReceipt}
                  tableClassName="period-data-table"
                />
              </section>
            ))
          ) : (
            <div className="empty-state">No receipts found.</div>
          )}
        </div>
      </section>
    </section>
  );
}

function filterReceiptsForCurrentPeriod(
  receipts: ReceiptRecord[],
  period: "daily" | "weekly" | "monthly",
) {
  const currentKey = getPeriodKey(today(), period);
  return receipts.filter((receipt) => getPeriodKey(receipt.date, period) === currentKey);
}

function groupReceiptsByPeriod(receipts: ReceiptRecord[], period: "daily" | "weekly" | "monthly") {
  const groups = new Map<string, { key: string; label: string; receipts: ReceiptRecord[]; total: number }>();
  const sorted = [...receipts].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((receipt) => {
    const key = getPeriodKey(receipt.date, period);
    const label = getPeriodLabel(receipt.date, period);
    const existing = groups.get(key) || { key, label, receipts: [], total: 0 };
    existing.receipts.push(receipt);
    existing.total += receipt.total;
    groups.set(key, existing);
  });

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

function getPeriodKey(value: string, period: "daily" | "weekly" | "monthly") {
  const date = dateFromIso(value);
  if (period === "daily") return value;
  if (period === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const weekStart = getWeekStart(date);
  return toIsoDate(weekStart);
}

function getPeriodLabel(value: string, period: "daily" | "weekly" | "monthly") {
  const date = dateFromIso(value);
  if (period === "daily") {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(date);
  }
  if (period === "monthly") {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  }
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    weekStart,
  )} - ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(weekEnd)}`;
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CreateReceiptPage({
  user,
  categories,
  receiptNumber,
  saveReceipt,
}: {
  user: StaffUser;
  categories: Category[];
  receiptNumber: string;
  saveReceipt: (receipt: ReceiptRecord) => void;
}) {
  const [date, setDate] = React.useState(today());
  const [studentName, setStudentName] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [className, setClassName] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [sendMethod, setSendMethod] = React.useState<"WhatsApp" | "SMS" | "manual">("WhatsApp");
  const [paymentMethod, setPaymentMethod] = React.useState<"Cash" | "Bank Transfer" | "Credit Card">("Cash");
  const [note, setNote] = React.useState("");
  const [items, setItems] = React.useState<ReceiptLine[]>([
    makeLine(categories[0], categories[0]?.items[0]),
  ]);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const draft: ReceiptRecord = {
    id: uid(),
    receiptNumber,
    date,
    studentName,
    grade,
    className,
    studentId,
    parentPhone,
    sendMethod,
    paymentMethod,
    sentStatus: "not sent",
    note,
    items,
    total,
    createdBy: user,
    createdAt: new Date().toISOString(),
  };

  function addLine() {
    setItems((current) => [...current, makeLine(categories[0], categories[0]?.items[0])]);
  }

  function updateLine(lineId: string, patch: Partial<ReceiptLine>) {
    setItems((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function selectCategory(lineId: string, categoryId: string) {
    const line = items.find((item) => item.id === lineId);
    const category = categories.find((item) => item.id === categoryId);
    const subItem = category?.items[0];
    updateLine(lineId, makeLine(category, subItem, lineId, line?.note));
  }

  function selectItem(lineId: string, itemId: string) {
    const line = items.find((item) => item.id === lineId);
    const category = categories.find((item) => item.id === line?.categoryId);
    const subItem = category?.items.find((item) => item.id === itemId);
    updateLine(lineId, makeLine(category, subItem, lineId, line?.note));
  }

  async function downloadDraftImage() {
    if (!previewRef.current) return;
    await downloadReceiptImage(previewRef.current, receiptImageFileName(draft));
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Create Receipt</h2>
          <p>Build a receipt with multiple payment items.</p>
        </div>
      </div>
      <div className="two-column">
        <div className="panel">
          <div className="form-grid">
            <label>
              Student name
              <input value={studentName} onChange={(event) => setStudentName(event.target.value)} />
            </label>
            <label>
              Grade
              <select value={grade} onChange={(event) => setGrade(event.target.value)}>
                <option value="">Select grade</option>
                {GRADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class
              <select value={className} onChange={(event) => setClassName(event.target.value)}>
                <option value="">Select class</option>
                {CLASS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Student ID
              <input value={studentId} onChange={(event) => setStudentId(event.target.value)} />
            </label>
            <label>
              Date
              <EnglishDatePicker value={date} onChange={setDate} />
            </label>
            <label>
              Receipt number
              <input value={receiptNumber} readOnly />
            </label>
            <label>
              Staff
              <input value={user.name} readOnly />
            </label>
            <label>
              Parent phone
              <input value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} />
            </label>
            <label>
              Send method
              <select
                value={sendMethod}
                onChange={(event) => setSendMethod(event.target.value as "WhatsApp" | "SMS" | "manual")}
              >
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>manual</option>
              </select>
            </label>
            <label>
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as "Cash" | "Bank Transfer" | "Credit Card")
                }
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
              </select>
            </label>
          </div>
          <div className="items-header">
            <h3>Payment Items</h3>
            <button className="secondary-button" onClick={addLine}>
              <Plus size={17} /> Add Item
            </button>
          </div>
          <div className="item-list">
            {items.map((line) => {
              const category = categories.find((item) => item.id === line.categoryId);
              return (
                <div className="item-row" key={line.id}>
                  <select value={line.categoryId} onChange={(event) => selectCategory(line.id, event.target.value)}>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select value={line.itemId} onChange={(event) => selectItem(line.id, event.target.value)}>
                    {category?.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={line.amount}
                    onChange={(event) => updateLine(line.id, { amount: Number(event.target.value) })}
                  />
                  <input
                    placeholder="Item note"
                    value={line.note || ""}
                    onChange={(event) => updateLine(line.id, { note: event.target.value })}
                  />
                  <button
                    className="icon-button"
                    title="Remove item"
                    onClick={() => setItems((current) => current.filter((item) => item.id !== line.id))}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
          <label>
            Payment note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="total-bar">
            <span>Total</span>
            <strong>{money.format(total)}</strong>
          </div>
          <div className="action-row">
            <button className="secondary-button" onClick={downloadDraftImage}>
              <ArrowDownToLine size={18} /> Generate Image
            </button>
            <button
              className="primary-button"
              onClick={() => {
                saveReceipt({ ...draft, id: uid(), createdAt: new Date().toISOString() });
              }}
              disabled={!studentName || !grade || !className || items.length === 0}
            >
              <Save size={18} /> Save Receipt
            </button>
          </div>
        </div>
        <div className="preview-column">
          <ReceiptPreview receipt={draft} ref={previewRef} />
        </div>
      </div>
    </section>
  );
}

function makeLine(category?: Category, item?: PaymentItem, id: string = uid(), note = ""): ReceiptLine {
  return {
    id,
    categoryId: category?.id || "",
    itemId: item?.id || "",
    categoryName: category?.name || "",
    itemName: item?.name || "",
    amount: item?.defaultAmount || 0,
    note,
  };
}

function EnglishDatePicker({
  value,
  onChange,
  allowClear = false,
}: {
  value: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
}) {
  const selectedDate = value ? dateFromIso(value) : new Date();
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => selectedDate);
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  React.useEffect(() => {
    setViewDate(selectedDate);
  }, [value]);

  function moveMonth(offset: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDay(day: number) {
    onChange(toIsoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)));
    setOpen(false);
  }

  return (
    <div className="date-picker">
      <button className="date-button" type="button" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={17} />
        {value ? formatDisplayDate(value) : "Select date"}
      </button>
      {open && (
        <div className="calendar-popover">
          <div className="calendar-header">
            <button type="button" onClick={() => moveMonth(-1)}>
              Previous
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => moveMonth(1)}>
              Next
            </button>
          </div>
          <div className="calendar-grid weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) =>
              day ? (
                <button
                  className={value === toIsoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ? "selected" : ""}
                  key={`${viewDate.getMonth()}-${day}`}
                  type="button"
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              ),
            )}
          </div>
          {allowClear && value && (
            <button
              className="calendar-clear"
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function dateFromIso(value: string) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dateFromIso(value));
}

function formatReceiptDateTime(dateValue: string, issuedAt: string) {
  const issuedDate = new Date(issuedAt);
  if (Number.isNaN(issuedDate.getTime())) return dateValue;

  const issuedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(issuedDate);

  return `${dateValue}, ${issuedTime}`;
}

const ReceiptPreview = React.forwardRef<HTMLDivElement, { receipt: ReceiptRecord }>(
  ({ receipt }, ref) => (
    <div className="receipt-paper" ref={ref}>
      <div className="receipt-top">
        <img className="receipt-logo" src="/anis-logo.png" alt="ANIS logo" />
        <div>
          <h2>All Nations International School</h2>
          <p>Official Payment Receipt</p>
        </div>
      </div>
      <div className="receipt-meta">
        <span>Receipt No: {receipt.receiptNumber}</span>
        <span>Date: {formatReceiptDateTime(receipt.date, receipt.createdAt)}</span>
      </div>
      <div className="receipt-student">
        <div>
          <small>Student</small>
          <strong>{receipt.studentName || "Student Name"}</strong>
        </div>
        <div>
          <small>Grade</small>
          <strong>{receipt.grade || "-"}</strong>
        </div>
        <div>
          <small>Class</small>
          <strong>{receipt.className || "-"}</strong>
        </div>
        <div>
          <small>Student ID</small>
          <strong>{receipt.studentId || "-"}</strong>
        </div>
        <div>
          <small>Payment Method</small>
          <strong>{receipt.paymentMethod || "Cash"}</strong>
        </div>
      </div>
      <table className="receipt-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={item.id}>
              <td>{item.categoryName}</td>
              <td>{item.itemName}</td>
              <td>
                <div className="amount-with-note">
                  <strong>{money.format(item.amount)}</strong>
                  {item.note && <small>{item.note}</small>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="receipt-total">
        <span>Total Amount</span>
        <div className="receipt-total-amount">
          <strong>{money.format(receipt.total)}</strong>
          <small>{amountInWords(receipt.total)}</small>
        </div>
      </div>
      <img className="receipt-stamp" src="/payment-received-stamp.png" alt="Payment received stamp" />
      <div className="receipt-note">
        <small>Payment note</small>
        <p>{receipt.note || "Thank you for your payment."}</p>
      </div>
      <div className="receipt-footer">
        <span>Created by: {receipt.createdBy.name}</span>
        <div className="receipt-disclaimer">
          <p>
            This receipt is electronically generated. Any alteration or unauthorized reproduction will invalidate this
            receipt. Verification is available through the official verification system.
          </p>
        </div>
      </div>
    </div>
  ),
);

function CategoryPage({
  categories,
  setCategories,
}: {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const [newCategory, setNewCategory] = React.useState("");
  const [saveMessage, setSaveMessage] = React.useState("");

  function addCategory() {
    if (!newCategory.trim()) return;
    setCategories((current) => [...current, { id: uid(), name: newCategory.trim(), items: [] }]);
    setNewCategory("");
    setSaveMessage("");
  }

  function saveCategories() {
    writeStorage(STORAGE_KEYS.categories, categories);
    setSaveMessage("Categories saved.");
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Category / Item Management</h2>
          <p>Manage payment categories, sub-items, and default amounts.</p>
        </div>
        <button className="primary-button" onClick={saveCategories}>
          <Save size={18} /> Save Changes
        </button>
      </div>
      {saveMessage && <p className="save-message">{saveMessage}</p>}
      <section className="panel">
        <div className="inline-form">
          <input
            placeholder="New category"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
          <button className="primary-button" onClick={addCategory}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </section>
      <div className="category-grid">
        {categories.map((category) => (
          <CategoryEditor
            key={category.id}
            category={category}
            updateCategory={(next) =>
              setCategories((current) => current.map((item) => (item.id === category.id ? next : item)))
            }
            deleteCategory={() =>
              setCategories((current) => current.filter((item) => item.id !== category.id))
            }
          />
        ))}
      </div>
    </section>
  );
}

function CategoryEditor({
  category,
  updateCategory,
  deleteCategory,
}: {
  category: Category;
  updateCategory: (category: Category) => void;
  deleteCategory: () => void;
}) {
  const [itemName, setItemName] = React.useState("");
  const [itemAmount, setItemAmount] = React.useState(0);

  return (
    <section className="panel category-card">
      <div className="category-title">
        <input
          value={category.name}
          onChange={(event) => updateCategory({ ...category, name: event.target.value })}
        />
        <button className="icon-button danger" title="Delete category" onClick={deleteCategory}>
          <Trash2 size={17} />
        </button>
      </div>
      <div className="subitem-list">
        {category.items.map((item) => (
          <div className="subitem-row" key={item.id}>
            <input
              value={item.name}
              onChange={(event) =>
                updateCategory({
                  ...category,
                  items: category.items.map((current) =>
                    current.id === item.id ? { ...current, name: event.target.value } : current,
                  ),
                })
              }
            />
            <input
              type="number"
              value={item.defaultAmount}
              onChange={(event) =>
                updateCategory({
                  ...category,
                  items: category.items.map((current) =>
                    current.id === item.id
                      ? { ...current, defaultAmount: Number(event.target.value) }
                      : current,
                  ),
                })
              }
            />
            <button
              className="icon-button"
              title="Delete sub-item"
              onClick={() =>
                updateCategory({
                  ...category,
                  items: category.items.filter((current) => current.id !== item.id),
                })
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="subitem-add">
        <input placeholder="Sub-item" value={itemName} onChange={(event) => setItemName(event.target.value)} />
        <input
          type="number"
          placeholder="Amount"
          value={itemAmount}
          onChange={(event) => setItemAmount(Number(event.target.value))}
        />
        <button
          className="secondary-button"
          onClick={() => {
            if (!itemName.trim()) return;
            updateCategory({
              ...category,
              items: [...category.items, { id: uid(), name: itemName.trim(), defaultAmount: itemAmount }],
            });
            setItemName("");
            setItemAmount(0);
          }}
        >
          <Plus size={17} /> Add
        </button>
      </div>
    </section>
  );
}

function ReceiptListPage({
  receipts,
  openReceipt,
  updateReceipt,
}: {
  receipts: ReceiptRecord[];
  openReceipt: (id: string) => void;
  updateReceipt: (receipt: ReceiptRecord) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [date, setDate] = React.useState("");

  const filtered = receipts.filter((receipt) => {
    const text = `${receipt.receiptNumber} ${receipt.studentName}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (!grade || receipt.grade.toLowerCase().includes(grade.toLowerCase())) &&
      (!date || receipt.date === date)
    );
  });

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Receipt List</h2>
          <p>Search, view, and download saved receipts.</p>
        </div>
      </div>
      <section className="panel filters">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Student name or receipt number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <input placeholder="Grade" value={grade} onChange={(event) => setGrade(event.target.value)} />
        <EnglishDatePicker value={date} onChange={setDate} allowClear />
      </section>
      <section className="panel">
        <ReceiptTable
          receipts={filtered}
          openReceipt={openReceipt}
          updateReceipt={updateReceipt}
          showActions
        />
      </section>
    </section>
  );
}

function VerifyReceiptPage({
  receipts,
  openReceipt,
}: {
  receipts: ReceiptRecord[];
  openReceipt: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const search = query.trim().toLowerCase();
  const matches = search
    ? receipts.filter((receipt) =>
        [
          receipt.receiptNumber,
          receipt.studentName,
          receipt.studentId || "",
          receipt.grade,
          receipt.className,
          receipt.parentPhone || "",
          receipt.paymentMethod || "Cash",
          receipt.createdBy.name,
          money.format(receipt.total),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : [];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Verify Receipt</h2>
          <p>Search all saved receipt records and confirm whether a receipt exists.</p>
        </div>
      </div>
      <section className="panel verify-panel">
        <label>
          Receipt verification search
          <div className="search-box verify-search">
            <Search size={18} />
            <input
              placeholder="Receipt number, student name, student ID, phone, grade, class"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
        <div className={search && matches.length ? "verify-banner found" : "verify-banner"}>
          <ShieldCheck size={20} />
          {search
            ? matches.length
              ? `${matches.length} verified record${matches.length === 1 ? "" : "s"} found`
              : "No matching receipt record found"
            : "Enter receipt details to verify a record"}
        </div>
      </section>
      <div className="verify-results">
        {matches.map((receipt) => (
          <section className="panel verify-card" key={receipt.id}>
            <div className="verify-card-header">
              <div>
                <span className="verify-badge">Verified Record</span>
                <h3>{receipt.receiptNumber}</h3>
              </div>
              <button className="secondary-button" onClick={() => openReceipt(receipt.id)}>
                <Eye size={17} /> View Receipt
              </button>
            </div>
            <div className="verify-meta-grid">
              <VerifyField label="Student" value={receipt.studentName} />
              <VerifyField label="Date" value={receipt.date} />
              <VerifyField label="Grade" value={receipt.grade} />
              <VerifyField label="Class" value={receipt.className} />
              <VerifyField label="Student ID" value={receipt.studentId || "-"} />
              <VerifyField label="Payment Method" value={receipt.paymentMethod || "Cash"} />
              <VerifyField label="Total" value={money.format(receipt.total)} />
              <VerifyField label="Created By" value={receipt.createdBy.name} />
              <VerifyField label="Sent Status" value={receipt.sentStatus} />
              <VerifyField label="Created At" value={formatDateTime(receipt.createdAt)} />
            </div>
            <table className="receipt-table verify-items">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.categoryName}</td>
                    <td>{item.itemName}</td>
                    <td>
                      <div className="amount-with-note">
                        <strong>{money.format(item.amount)}</strong>
                        {item.note && <small>{item.note}</small>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </section>
  );
}

function VerifyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="verify-field">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ReceiptTable({
  receipts,
  openReceipt,
  updateReceipt,
  showActions = false,
  tableClassName = "",
}: {
  receipts: ReceiptRecord[];
  openReceipt: (id: string) => void;
  updateReceipt?: (receipt: ReceiptRecord) => void;
  showActions?: boolean;
  tableClassName?: string;
}) {
  if (!receipts.length) return <div className="empty-state">No receipts found.</div>;
  const firstColumnStyle: React.CSSProperties | undefined = tableClassName
    ? { paddingLeft: "22px" }
    : undefined;
  return (
    <div className="table-wrap">
      <table className={tableClassName ? `data-table ${tableClassName}` : "data-table"}>
        <thead>
          <tr>
            <th style={firstColumnStyle}>Receipt No</th>
            <th>Date</th>
            <th>Student</th>
            <th>Grade</th>
            <th>Class</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td style={firstColumnStyle}>{receipt.receiptNumber}</td>
              <td>{receipt.date}</td>
              <td>{receipt.studentName}</td>
              <td>{receipt.grade}</td>
              <td>{receipt.className}</td>
              <td>{money.format(receipt.total)}</td>
              <td>
                <span className={receipt.sentStatus === "sent" ? "status sent" : "status"}>
                  {receipt.sentStatus}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button className="icon-button" title="View" onClick={() => openReceipt(receipt.id)}>
                    <Eye size={17} />
                  </button>
                  {showActions && updateReceipt && (
                    <button
                      className="icon-button"
                      title="Mark as sent"
                      onClick={() =>
                        updateReceipt({
                          ...receipt,
                          sentStatus: "sent",
                          sentDate: new Date().toISOString(),
                        })
                      }
                    >
                      <Send size={17} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptDetailPage({
  receipt,
  updateReceipt,
}: {
  receipt: ReceiptRecord;
  updateReceipt: (receipt: ReceiptRecord) => void;
}) {
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [phone, setPhone] = React.useState(receipt.parentPhone || "");
  const [method, setMethod] = React.useState<"WhatsApp" | "SMS" | "manual">(receipt.sendMethod);
  const [imageStatus, setImageStatus] = React.useState("");
  const [isPrinting, setIsPrinting] = React.useState(false);
  const receiptStageStyle: React.CSSProperties = isPrinting
    ? {
        width: "100%",
        maxWidth: "none",
        display: "block",
        padding: 0,
        border: 0,
        borderRadius: 0,
        background: "transparent",
        boxShadow: "none",
      }
    : {
        width: "100%",
        maxWidth: "560px",
        display: "grid",
        justifyItems: "center",
        padding: "36px",
        border: "1px solid #d3c5d4",
        borderRadius: "8px",
        background: "#ece4ee",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75), 0 18px 45px rgba(33,28,36,0.12)",
      };
  const sendActionsStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "14px",
  };
  const sendButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "42px",
    justifyContent: "flex-start",
    paddingLeft: "18px",
    paddingRight: "18px",
    whiteSpace: "nowrap",
  };

  React.useEffect(() => {
    const beforePrint = () => setIsPrinting(true);
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  function printReceipt() {
    setIsPrinting(true);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setIsPrinting(false), 500);
    }, 0);
  }

  async function generateImage() {
    if (!previewRef.current) return;
    const imageUrl = await downloadReceiptImage(previewRef.current, receiptImageFileName(receipt));
    updateReceipt({ ...receipt, imageUrl });
    setImageStatus("Receipt image downloaded.");
  }

  async function copyImage() {
    if (!previewRef.current) return;
    setImageStatus("Preparing receipt image...");
    try {
      const { blob, imageUrl } = await createReceiptImage(previewRef.current);
      updateReceipt({ ...receipt, imageUrl });
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        downloadImageUrl(imageUrl, receiptImageFileName(receipt));
        setImageStatus("Image copy is not supported here. The receipt image was downloaded instead.");
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setImageStatus("Receipt image copied. Paste it into WhatsApp Web.");
    } catch {
      setImageStatus("Image copy was blocked by the browser. Use Generate Image, then attach the PNG in WhatsApp.");
    }
  }

  async function shareImage() {
    if (!previewRef.current) return;
    setImageStatus("Preparing receipt image...");
    try {
      const { blob, imageUrl } = await createReceiptImage(previewRef.current);
      updateReceipt({ ...receipt, imageUrl });
      const file = new File([blob], `${receiptImageFileName(receipt)}.png`, { type: "image/png" });
      const shareData = {
        title: receipt.receiptNumber,
        text: `Hello, here is your receipt from the school. Receipt No: ${receipt.receiptNumber}. Total: ${money.format(receipt.total)}.`,
        files: [file],
      };
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData);
        setImageStatus("Receipt image shared.");
        return;
      }
      downloadImageUrl(imageUrl, receiptImageFileName(receipt));
      if (whatsappPhone) window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setImageStatus("Direct image sharing is not supported here. The image was downloaded for manual attachment.");
    } catch {
      setImageStatus("Image sharing was cancelled or blocked. Use Generate Image, then attach the PNG in WhatsApp.");
    }
  }

  const message = encodeURIComponent(
    `Hello, here is your receipt from the school. Receipt No: ${receipt.receiptNumber}. Total: ${money.format(receipt.total)}.`,
  );
  const whatsappPhone = normalizeWhatsAppPhone(phone);
  const whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappPhone}&text=${message}`;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Receipt Detail</h2>
          <p>{receipt.receiptNumber}</p>
        </div>
        <div className="action-row">
          <button className="secondary-button" onClick={generateImage}>
            <ArrowDownToLine size={18} /> Generate Image
          </button>
          <button className="secondary-button" onClick={printReceipt}>
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
      <div className="two-column">
        <div className="preview-column">
          <div className="receipt-stage" style={receiptStageStyle}>
            <ReceiptPreview receipt={{ ...receipt, parentPhone: phone, sendMethod: method }} ref={previewRef} />
          </div>
        </div>
        <section className="panel sending-panel">
          <h3>Sending Preparation</h3>
          <div className="form-grid single">
            <label>
              Parent phone number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
              <span className="field-hint">Use country code. Local numbers starting with 0 are sent as Sri Lanka +94.</span>
            </label>
            <label>
              Send method
              <select value={method} onChange={(event) => setMethod(event.target.value as "WhatsApp" | "SMS" | "manual")}>
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>manual</option>
              </select>
            </label>
            <label>
              Sent status
              <select
                value={receipt.sentStatus}
                onChange={(event) =>
                  updateReceipt({
                    ...receipt,
                    parentPhone: phone,
                    sendMethod: method,
                    sentStatus: event.target.value as "not sent" | "sent",
                    sentDate: event.target.value === "sent" ? new Date().toISOString() : undefined,
                  })
                }
              >
                <option>not sent</option>
                <option>sent</option>
              </select>
            </label>
          </div>
          <div className="send-actions" style={sendActionsStyle}>
            <button className="secondary-button" style={sendButtonStyle} onClick={copyImage}>
              <Copy size={18} /> Copy Image
            </button>
            <button className="secondary-button" style={sendButtonStyle} onClick={shareImage}>
              <Share2 size={18} /> Share Image
            </button>
            <a
              className={whatsappPhone ? "primary-button link-button" : "primary-button link-button disabled"}
              style={sendButtonStyle}
              href={whatsappPhone ? whatsappUrl : undefined}
              target="_blank"
              rel="noreferrer"
            >
              <Send size={18} /> Open WhatsApp
            </a>
            <button
              className="secondary-button"
              style={sendButtonStyle}
              onClick={() =>
                updateReceipt({
                  ...receipt,
                  parentPhone: phone,
                  sendMethod: method,
                  sentStatus: "sent",
                  sentDate: new Date().toISOString(),
                })
              }
            >
              <Save size={18} /> Mark as Sent
            </button>
          </div>
          {imageStatus && <p className="share-status">{imageStatus}</p>}
          {receipt.imageUrl && (
            <a className="download-link" href={receipt.imageUrl} download={`${receiptImageFileName(receipt)}.png`}>
              Download last generated image
            </a>
          )}
        </section>
      </div>
    </section>
  );
}

function safeFileNamePart(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, "")
    .replace(/-+/g, "-");
  return cleaned || fallback;
}

function receiptImageFileName(receipt: Pick<ReceiptRecord, "studentName" | "date" | "receiptNumber">) {
  const studentName = safeFileNamePart(receipt.studentName, "Student");
  const date = safeFileNamePart(receipt.date, today());
  const receiptNumber = safeFileNamePart(receipt.receiptNumber, "Receipt");
  return `${studentName}_${date}_${receiptNumber}`;
}

async function downloadReceiptImage(element: HTMLElement, fileName: string) {
  const { imageUrl } = await createReceiptImage(element);
  downloadImageUrl(imageUrl, fileName);
  return imageUrl;
}

async function createReceiptImage(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
  });
  const imageUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("Could not create receipt image."));
    }, "image/png");
  });
  return { blob, imageUrl };
}

function downloadImageUrl(imageUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = imageUrl;
  anchor.download = `${fileName}.png`;
  anchor.click();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
