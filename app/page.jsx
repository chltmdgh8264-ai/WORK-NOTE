"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Gauge,
  Rocket,
  Award,
  Users,
  Plus,
  Trash2,
  Clock,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Eye,
  Wrench,
  CalendarClock,
  FileText,
  Copy,
  Check,
  Sparkles,
  LogOut,
  Lock,
} from "lucide-react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { loadAll, saveField } from "../lib/store";

const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- company / 인재상 tag definitions ----------
const COMPANIES = [
  { id: "하이닉스", color: "#E4002B", bg: "#3A1218", border: "#5A1F27" },
  { id: "한화", color: "#F5A623", bg: "#3A2A12", border: "#5A4520" },
];
const TRAITS_BY_COMPANY = {
  하이닉스: ["VWBE", "SUPEX", "패기"],
  한화: ["주인의식", "월등한 차별성", "변화 수용성"],
};
function companyMeta(id) {
  return COMPANIES.find((c) => c.id === id);
}

// ---------- 키워드 기반 자동 분류 ----------
const KEYWORD_RULES = [
  { company: "하이닉스", trait: "VWBE", keywords: ["스스로", "자발", "먼저 발견", "누가 시키지", "자청", "제가 판단"] },
  { company: "하이닉스", trait: "SUPEX", keywords: ["새로운 방법", "기존 방식", "한계", "돌파", "재정의", "다르게", "혁신", "자동", "도구를 만들"] },
  { company: "하이닉스", trait: "패기", keywords: ["도전", "제안", "실행", "틀을 깨", "밀어붙", "끝까지", "목표"] },
  { company: "한화", trait: "주인의식", keywords: ["책임", "내 일", "주인", "끝까지 챙", "미루지 않", "직접 결정"] },
  { company: "한화", trait: "월등한 차별성", keywords: ["차별", "새로운 아이디어", "발전시켜", "개선했", "디벨롭", "처음엔"] },
  { company: "한화", trait: "변화 수용성", keywords: ["변화", "적응", "새로운 환경", "낯선", "받아들", "이직", "전환"] },
];
function suggestTags(text) {
  if (!text || text.trim().length < 4) return null;
  const scores = {};
  KEYWORD_RULES.forEach((rule) => {
    if (rule.keywords.some((k) => text.includes(k))) {
      scores[rule.company] = scores[rule.company] || new Set();
      scores[rule.company].add(rule.trait);
    }
  });
  const companies = Object.keys(scores);
  if (companies.length === 0) return null;
  companies.sort((a, b) => scores[b].size - scores[a].size);
  const company = companies[0];
  return { company, traits: Array.from(scores[company]) };
}
function relevantText(form) {
  if (form.type === "설비 이상")
    return `${form.symptom} ${form.cause} ${form.offManual ? "매뉴얼 외 새로운 방법 돌파" : ""}`;
  if (form.type === "일반 관찰") return `${form.content} ${form.lesson}`;
  if (form.type === "약점·개선") return `${form.weakness} ${form.improvement}`;
  return "";
}

const TABS = [
  { id: "log", label: "오늘의 기록", icon: ClipboardList },
  { id: "reflection", label: "주간 회고", icon: CalendarClock },
  { id: "dashboard", label: "대시보드", icon: Gauge },
  { id: "export", label: "자소서 자료 모음", icon: FileText },
  { id: "project", label: "프로젝트", icon: Rocket },
  { id: "cert", label: "자격증", icon: Award },
  { id: "reputation", label: "평판 메모", icon: Users },
];

// 기록 유형 정의 — 태도/관찰/고치기를 하나의 로그 구조 안에서 다루기 위함
const LOG_TYPES = [
  { id: "설비 이상", icon: Wrench, desc: "설비 트러블슈팅 기록" },
  { id: "일반 관찰", icon: Eye, desc: "협업·프로세스·의사결정 등 설비 밖 관찰" },
  { id: "약점·개선", icon: AlertTriangle, desc: "몰랐던 것, 실수한 것과 고친 과정" },
];

export default function Page() {
  const [user, setUser] = useState(undefined); // undefined=확인중, null=로그아웃, obj=로그인됨

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#1C2024] flex items-center justify-center text-[#E8E6E1]">
        <Loader2 className="animate-spin mr-2" size={20} />
        확인 중…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <CareerLogApp uid={user.uid} email={user.email} />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pw);
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1C2024] flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-[#20242A] border border-[#2B3136] rounded-lg p-6"
      >
        <div className="flex items-center gap-2 text-[#F5A623] mb-1">
          <Lock size={16} />
          <span className="font-mono text-xs tracking-wide">PRIVATE</span>
        </div>
        <h1 className="text-lg font-semibold text-[#E8E6E1] mb-4">
          현장 기록장 로그인
        </h1>
        <div className="space-y-3">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1C2024] border border-[#2B3136] rounded-md px-3 py-2 text-sm text-[#E8E6E1] focus:outline-none focus:border-[#F5A623]"
          />
          <input
            type="password"
            required
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full bg-[#1C2024] border border-[#2B3136] rounded-md px-3 py-2 text-sm text-[#E8E6E1] focus:outline-none focus:border-[#F5A623]"
          />
        </div>
        {error && (
          <div className="text-[#E5484D] text-xs mt-3">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full mt-4 bg-[#F5A623] text-[#1C2024] font-medium text-sm py-2 rounded-md hover:bg-[#FFB84D] transition-colors disabled:opacity-50"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <p className="text-[10px] text-[#5A6169] mt-3">
          이 계정은 본인만 사용합니다. 가입 화면은 따로 없고, Firebase 콘솔에서 본인 이메일 하나만 계정으로 등록해 둔 상태입니다.
        </p>
      </form>
    </div>
  );
}

function CareerLogApp({ uid, email }) {
  const [tab, setTab] = useState("log");
  const [loaded, setLoaded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [reputations, setReputations] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      const data = await loadAll(uid);
      setLogs(data.logs);
      setProjects(data.projects);
      setCerts(data.certs);
      setReputations(data.reputations);
      setReflections(data.reflections);
      setLoaded(true);
    })();
  }, [uid]);

  async function persist(key, setter, value) {
    setter(value);
    const ok = await saveField(uid, key, value);
    if (!ok) {
      setSaveError("저장에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.");
      setTimeout(() => setSaveError(""), 3000);
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#1C2024] flex items-center justify-center text-[#E8E6E1]">
        <Loader2 className="animate-spin mr-2" size={20} />
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C2024] text-[#E8E6E1] flex flex-col md:flex-row">
      {/* Sidebar / top nav */}
      <nav className="md:w-56 shrink-0 bg-[#15181B] border-b md:border-b-0 md:border-r border-[#2B3136] flex md:flex-col">
        <div className="px-5 py-5 border-b border-[#2B3136] hidden md:block">
          <div className="text-[#F5A623] font-mono text-xs tracking-wide">
            SHIFT LOG
          </div>
          <div className="text-lg font-semibold mt-0.5">현장 기록장</div>
          <div className="text-[10px] text-[#5A6169] mt-1 truncate">{email}</div>
        </div>
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible flex-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-5 py-3 text-sm shrink-0 border-b-2 md:border-b-0 md:border-l-2 transition-colors ${
                  active
                    ? "border-[#F5A623] bg-[#1C2024] text-[#F5A623]"
                    : "border-transparent text-[#9BA3AB] hover:text-[#E8E6E1]"
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 px-5 py-3 text-xs text-[#5A6169] hover:text-[#E5484D] border-t border-[#2B3136] shrink-0"
        >
          <LogOut size={14} /> 로그아웃
        </button>
      </nav>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {saveError && (
          <div className="bg-[#E5484D] text-white text-sm px-5 py-2 flex items-center gap-2">
            <AlertTriangle size={14} /> {saveError}
          </div>
        )}
        {tab === "log" && (
          <LogTab logs={logs} onChange={(v) => persist("logs", setLogs, v)} />
        )}
        {tab === "reflection" && (
          <ReflectionTab
            logs={logs}
            reflections={reflections}
            onChange={(v) => persist("reflections", setReflections, v)}
          />
        )}
        {tab === "dashboard" && <DashboardTab logs={logs} />}
        {tab === "export" && <ExportTab logs={logs} />}
        {tab === "project" && (
          <ProjectTab
            projects={projects}
            onChange={(v) => persist("projects", setProjects, v)}
          />
        )}
        {tab === "cert" && (
          <CertTab certs={certs} onChange={(v) => persist("certs", setCerts, v)} />
        )}
        {tab === "reputation" && (
          <ReputationTab
            items={reputations}
            onChange={(v) => persist("reputations", setReputations, v)}
          />
        )}
      </main>
    </div>
  );
}

// ---------- shared bits ----------
function PageHeader({ eyebrow, title, desc }) {
  return (
    <div className="px-5 md:px-8 pt-8 pb-5 border-b border-[#2B3136]">
      <div className="text-[#F5A623] font-mono text-xs tracking-wide mb-1">
        {eyebrow}
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {desc && <p className="text-[#9BA3AB] text-sm mt-1.5 max-w-xl">{desc}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-[#9BA3AB] mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-[#20242A] border border-[#2B3136] rounded-md px-3 py-2 text-sm text-[#E8E6E1] focus:outline-none focus:border-[#F5A623] placeholder-[#5A6169]";

// ---------- Tab 1: 오늘의 기록 (관찰 + 기록 습관) ----------
function LogTab({ logs, onChange }) {
  const empty = {
    id: "",
    type: "설비 이상",
    date: todayStr(),
    // 설비 이상
    equipment: "",
    symptom: "",
    foundTime: "",
    doneTime: "",
    cause: "",
    action: "1차조치",
    repeatCount: "",
    offManual: false,
    // 일반 관찰
    observeArea: "협업",
    content: "",
    lesson: "",
    // 약점·개선
    weakness: "",
    improvement: "",
    result: "",
    // 공통 태그
    company: "",
    traits: [],
  };
  const [form, setForm] = useState(empty);
  const [filterCompany, setFilterCompany] = useState("전체");
  const [filterTrait, setFilterTrait] = useState("전체");
  const [filterType, setFilterType] = useState("전체");
  const [manualCompany, setManualCompany] = useState(false);

  const suggestion = useMemo(
    () => suggestTags(relevantText(form)),
    [form.type, form.symptom, form.cause, form.offManual, form.content, form.lesson, form.weakness, form.improvement]
  );

  useEffect(() => {
    if (manualCompany) return;
    if (!suggestion) return;
    setForm((f) => ({ ...f, company: suggestion.company, traits: suggestion.traits }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion, manualCompany]);

  function pickCompany(cid) {
    setManualCompany(true);
    setForm((f) => ({ ...f, company: cid, traits: [] }));
  }

  function toggleTrait(t) {
    setManualCompany(true);
    setForm((f) =>
      f.traits.includes(t)
        ? { ...f, traits: f.traits.filter((x) => x !== t) }
        : { ...f, traits: [...f.traits, t] }
    );
  }

  function minutesBetween(a, b) {
    if (!a || !b) return null;
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    let diff = bh * 60 + bm - (ah * 60 + am);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  function canAdd() {
    if (form.type === "설비 이상") return form.equipment && form.symptom;
    if (form.type === "일반 관찰") return form.content;
    if (form.type === "약점·개선") return form.weakness;
    return false;
  }

  function addLog() {
    if (!canAdd()) return;
    const entry = { ...form, id: uid() };
    onChange([entry, ...logs]);
    setForm({ ...empty, type: form.type }); // 유형은 유지, 나머지 초기화
    setManualCompany(false);
  }

  function removeLog(id) {
    onChange(logs.filter((l) => l.id !== id));
  }

  const duration = minutesBetween(form.foundTime, form.doneTime);

  const filteredLogs = logs
    .filter((l) => (filterType === "전체" ? true : (l.type || "설비 이상") === filterType))
    .filter((l) => (filterCompany === "전체" ? true : l.company === filterCompany))
    .filter((l) =>
      filterTrait === "전체" || filterCompany === "전체"
        ? true
        : (l.traits || []).includes(filterTrait)
    );

  return (
    <div>
      <PageHeader
        eyebrow="OBSERVATION LOG"
        title="오늘의 기록"
        desc="설비 이상뿐 아니라 협업·프로세스에서 본 것, 스스로의 약점과 개선 과정까지 세 가지 유형으로 남길 수 있어요. 회사·인재상 태그를 달아두면 나중에 필터로 바로 모아볼 수 있습니다."
      />
      <div className="px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          {/* 유형 선택 */}
          <div className="flex gap-2">
            {LOG_TYPES.map((lt) => {
              const Icon = lt.icon;
              const active = form.type === lt.id;
              return (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, type: lt.id });
                    setManualCompany(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-md border text-xs transition-colors ${
                    active
                      ? "border-[#F5A623] bg-[#3A2A12] text-[#F5A623]"
                      : "border-[#2B3136] text-[#9BA3AB] hover:text-[#E8E6E1]"
                  }`}
                >
                  <Icon size={16} />
                  {lt.id}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#5A6169]">
            {LOG_TYPES.find((lt) => lt.id === form.type)?.desc}
          </p>

          <Field label="날짜">
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>

          {/* ---- 설비 이상 필드 ---- */}
          {form.type === "설비 이상" && (
            <>
              <Field label="설비명">
                <input
                  className={inputCls}
                  placeholder="예: RO 3호기"
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                />
              </Field>
              <Field label="증상">
                <input
                  className={inputCls}
                  placeholder="예: 압축기 오일압 트립"
                  value={form.symptom}
                  onChange={(e) => setForm({ ...form, symptom: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="발견 시각">
                  <input
                    type="time"
                    className={inputCls}
                    value={form.foundTime}
                    onChange={(e) => setForm({ ...form, foundTime: e.target.value })}
                  />
                </Field>
                <Field label="조치 완료 시각">
                  <input
                    type="time"
                    className={inputCls}
                    value={form.doneTime}
                    onChange={(e) => setForm({ ...form, doneTime: e.target.value })}
                  />
                </Field>
              </div>
              {duration !== null && (
                <div className="text-xs text-[#F5A623] font-mono flex items-center gap-1">
                  <Clock size={12} /> 소요시간 자동계산: {duration}분
                </div>
              )}
              <Field label="원인 추정 과정 (어떤 가설을 배제해나갔는지)">
                <textarea
                  className={inputCls + " min-h-[70px] resize-none"}
                  placeholder="예: 센서 오작동 vs 실제 기계결함 순차 배제"
                  value={form.cause}
                  onChange={(e) => setForm({ ...form, cause: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="처리 방식">
                  <select
                    className={inputCls}
                    value={form.action}
                    onChange={(e) => setForm({ ...form, action: e.target.value })}
                  >
                    <option>1차조치</option>
                    <option>정비팀 에스컬레이션</option>
                  </select>
                </Field>
                <Field label="이번이 몇 번째 반복인지 (선택)">
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    placeholder="예: 3"
                    value={form.repeatCount}
                    onChange={(e) => setForm({ ...form, repeatCount: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#9BA3AB] pt-1">
                <input
                  type="checkbox"
                  checked={form.offManual}
                  onChange={(e) => setForm({ ...form, offManual: e.target.checked })}
                  className="accent-[#F5A623]"
                />
                매뉴얼에 없는 상황이었다 (패기·차별성 소재 후보)
              </label>
            </>
          )}

          {/* ---- 일반 관찰 필드 ---- */}
          {form.type === "일반 관찰" && (
            <>
              <Field label="관찰 대상">
                <select
                  className={inputCls}
                  value={form.observeArea}
                  onChange={(e) => setForm({ ...form, observeArea: e.target.value })}
                >
                  <option>협업</option>
                  <option>프로세스</option>
                  <option>의사결정</option>
                  <option>기타</option>
                </select>
              </Field>
              <Field label="관찰 내용">
                <textarea
                  className={inputCls + " min-h-[70px] resize-none"}
                  placeholder="예: 인수인계가 구두로만 이뤄져 반복 이슈 추적이 안 됨을 발견"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </Field>
              <Field label="배운 점 / 느낀 점 (선택)">
                <textarea
                  className={inputCls + " min-h-[60px] resize-none"}
                  placeholder="이 관찰에서 얻은 인사이트"
                  value={form.lesson}
                  onChange={(e) => setForm({ ...form, lesson: e.target.value })}
                />
              </Field>
            </>
          )}

          {/* ---- 약점·개선 필드 ---- */}
          {form.type === "약점·개선" && (
            <>
              <Field label="몰랐거나 실수한 것">
                <textarea
                  className={inputCls + " min-h-[70px] resize-none"}
                  placeholder="예: 밸브 시퀀스 이해가 부족해 초동 대응이 늦었음"
                  value={form.weakness}
                  onChange={(e) => setForm({ ...form, weakness: e.target.value })}
                />
              </Field>
              <Field label="어떻게 개선했는지 (선택)">
                <textarea
                  className={inputCls + " min-h-[60px] resize-none"}
                  placeholder="예: 매뉴얼 재학습 후 체크리스트 직접 제작"
                  value={form.improvement}
                  onChange={(e) => setForm({ ...form, improvement: e.target.value })}
                />
              </Field>
              <Field label="결과 (선택)">
                <input
                  className={inputCls}
                  placeholder="예: 다음 유사 상황에서 대응시간 단축"
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                />
              </Field>
            </>
          )}

          {/* ---- 공통: 회사/인재상 태그 ---- */}
          <div className="pt-2 border-t border-[#2B3136]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs text-[#9BA3AB]">
                이 소재는 어느 회사에 쓸까요?
              </span>
              {!manualCompany && suggestion && (
                <span className="text-[10px] text-[#F5A623] flex items-center gap-0.5">
                  <Sparkles size={10} /> 내용을 보고 자동 분류했어요
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-2">
              {["", ...COMPANIES.map((c) => c.id)].map((cid) => {
                const meta = companyMeta(cid);
                const active = form.company === cid;
                return (
                  <button
                    key={cid || "none"}
                    type="button"
                    onClick={() => pickCompany(cid)}
                    className="text-xs px-3 py-1.5 rounded border transition-colors"
                    style={{
                      color: active ? (meta ? meta.color : "#E8E6E1") : "#9BA3AB",
                      background: active ? (meta ? meta.bg : "#20242A") : "transparent",
                      borderColor: active ? (meta ? meta.border : "#2B3136") : "#2B3136",
                    }}
                  >
                    {cid || "미지정"}
                  </button>
                );
              })}
            </div>
            {form.company && (
              <div className="flex flex-wrap gap-1.5">
                {TRAITS_BY_COMPANY[form.company].map((t) => {
                  const meta = companyMeta(form.company);
                  const active = form.traits.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTrait(t)}
                      className="text-xs px-2.5 py-1 rounded border transition-colors"
                      style={{
                        color: active ? meta.color : "#9BA3AB",
                        background: active ? meta.bg : "transparent",
                        borderColor: active ? meta.border : "#2B3136",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-[#5A6169] mt-1.5">
              자동 분류가 마음에 안 들면 위 버튼을 직접 눌러 바꿀 수 있어요.
            </p>
          </div>

          <button
            onClick={addLog}
            disabled={!canAdd()}
            className="mt-2 inline-flex items-center gap-1.5 bg-[#F5A623] text-[#1C2024] font-medium text-sm px-4 py-2 rounded-md hover:bg-[#FFB84D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> 기록 추가
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <div className="text-xs text-[#9BA3AB]">
              누적 {logs.length}건
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <select
                className="bg-[#20242A] border border-[#2B3136] rounded text-xs px-2 py-1 text-[#E8E6E1]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option>전체</option>
                {LOG_TYPES.map((lt) => (
                  <option key={lt.id}>{lt.id}</option>
                ))}
              </select>
              <select
                className="bg-[#20242A] border border-[#2B3136] rounded text-xs px-2 py-1 text-[#E8E6E1]"
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany(e.target.value);
                  setFilterTrait("전체");
                }}
              >
                <option>전체</option>
                {COMPANIES.map((c) => (
                  <option key={c.id}>{c.id}</option>
                ))}
              </select>
              {filterCompany !== "전체" && (
                <select
                  className="bg-[#20242A] border border-[#2B3136] rounded text-xs px-2 py-1 text-[#E8E6E1]"
                  value={filterTrait}
                  onChange={(e) => setFilterTrait(e.target.value)}
                >
                  <option>전체</option>
                  {TRAITS_BY_COMPANY[filterCompany].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {logs.length === 0 && (
              <div className="text-sm text-[#5A6169] border border-dashed border-[#2B3136] rounded-md p-6 text-center">
                아직 기록이 없어요. 오늘 있었던 일부터 남겨보세요.
              </div>
            )}
            {filteredLogs.map((l) => {
              const ltype = l.type || "설비 이상";
              const LtIcon = LOG_TYPES.find((t) => t.id === ltype)?.icon || Wrench;
              return (
                <div
                  key={l.id}
                  className="bg-[#20242A] border border-[#2B3136] rounded-md p-3 text-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <LtIcon size={11} className="text-[#5A6169] shrink-0" />
                        <div className="font-mono text-xs text-[#F5A623]">
                          {l.date}
                        </div>
                        <span className="text-[10px] text-[#5A6169]">
                          {ltype}
                        </span>
                      </div>
                      {ltype === "설비 이상" && (
                        <div className="font-medium mt-0.5">
                          {l.equipment} · {l.symptom}
                        </div>
                      )}
                      {ltype === "일반 관찰" && (
                        <div className="font-medium mt-0.5">
                          [{l.observeArea}] {l.content}
                        </div>
                      )}
                      {ltype === "약점·개선" && (
                        <div className="font-medium mt-0.5">{l.weakness}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeLog(l.id)}
                      className="text-[#5A6169] hover:text-[#E5484D] shrink-0"
                      aria-label="삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {ltype === "설비 이상" && l.cause && (
                    <div className="text-[#9BA3AB] text-xs mt-1.5">{l.cause}</div>
                  )}
                  {ltype === "일반 관찰" && l.lesson && (
                    <div className="text-[#9BA3AB] text-xs mt-1.5">
                      배운 점: {l.lesson}
                    </div>
                  )}
                  {ltype === "약점·개선" && l.improvement && (
                    <div className="text-[#9BA3AB] text-xs mt-1.5">
                      개선: {l.improvement}
                      {l.result && ` → ${l.result}`}
                    </div>
                  )}

                  {ltype === "설비 이상" && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {l.foundTime && l.doneTime && (
                        <span className="text-[10px] font-mono bg-[#1C2024] px-2 py-0.5 rounded border border-[#2B3136]">
                          {minutesBetween(l.foundTime, l.doneTime)}분 소요
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-[#1C2024] px-2 py-0.5 rounded border border-[#2B3136]">
                        {l.action}
                      </span>
                      {l.repeatCount && (
                        <span className="text-[10px] font-mono bg-[#1C2024] px-2 py-0.5 rounded border border-[#2B3136]">
                          {l.repeatCount}번째 반복
                        </span>
                      )}
                      {l.offManual && (
                        <span className="text-[10px] font-mono bg-[#3A2A12] text-[#F5A623] px-2 py-0.5 rounded border border-[#5A4520]">
                          매뉴얼 외
                        </span>
                      )}
                    </div>
                  )}

                  {(l.company || (l.traits || []).length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#2B3136]">
                      {l.company &&
                        (() => {
                          const meta = companyMeta(l.company);
                          return (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded border font-medium"
                              style={{
                                color: "#1C2024",
                                background: meta.color,
                                borderColor: meta.color,
                              }}
                            >
                              {meta.id}
                            </span>
                          );
                        })()}
                      {(l.traits || []).map((t) => {
                        const meta = companyMeta(l.company);
                        return (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded border bg-[#1C2024]"
                            style={{
                              color: meta ? meta.color : "#9BA3AB",
                              borderColor: meta ? meta.color : "#2B3136",
                            }}
                          >
                            #{t}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 1-5: 주간 회고 (태도 점검) ----------
function ReflectionTab({ logs, reflections, onChange }) {
  function mondayOf(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().slice(0, 10);
  }

  const empty = {
    id: "",
    weekStart: mondayOf(new Date()),
    selfFound: "",
    postponed: "",
    mistakeFixed: "",
  };
  const [form, setForm] = useState(empty);

  function add() {
    if (!form.selfFound && !form.postponed && !form.mistakeFixed) return;
    onChange([{ ...form, id: uid() }, ...reflections]);
    setForm({ ...empty, weekStart: mondayOf(new Date()) });
  }
  function remove(id) {
    onChange(reflections.filter((r) => r.id !== id));
  }

  function weekSummary(weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const weekLogs = logs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d < end;
    });
    const byTrait = {};
    weekLogs.forEach((l) => {
      (l.traits || []).forEach((t) => {
        byTrait[t] = (byTrait[t] || 0) + 1;
      });
    });
    return { total: weekLogs.length, byTrait };
  }

  return (
    <div>
      <PageHeader
        eyebrow="WEEKLY SELF-CHECK"
        title="주간 회고"
        desc="숫자보다 태도를 점검하는 시간입니다. 매주 한 번, 이번 주 어떤 사람으로 일했는지 되짚어 보세요."
      />
      <div className="px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Field label="주 시작일 (월요일)">
            <input
              type="date"
              className={inputCls}
              value={form.weekStart}
              onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
            />
          </Field>
          <Field label="이번 주, 시켜서 한 일이 아니라 스스로 발견해서 한 일이 있었나?">
            <textarea
              className={inputCls + " min-h-[70px] resize-none"}
              placeholder="없었다면 없었다고 솔직히 적어도 괜찮습니다"
              value={form.selfFound}
              onChange={(e) => setForm({ ...form, selfFound: e.target.value })}
            />
          </Field>
          <Field label="이번 주 내가 미룬 일이 있었나? 왜 미뤘나?">
            <textarea
              className={inputCls + " min-h-[70px] resize-none"}
              value={form.postponed}
              onChange={(e) => setForm({ ...form, postponed: e.target.value })}
            />
          </Field>
          <Field label="이번 주 실수하고, 그걸 어떻게 바꿨나?">
            <textarea
              className={inputCls + " min-h-[70px] resize-none"}
              value={form.mistakeFixed}
              onChange={(e) => setForm({ ...form, mistakeFixed: e.target.value })}
            />
          </Field>
          <button
            onClick={add}
            className="mt-1 inline-flex items-center gap-1.5 bg-[#F5A623] text-[#1C2024] font-medium text-sm px-4 py-2 rounded-md hover:bg-[#FFB84D] transition-colors"
          >
            <Plus size={15} /> 이번 주 회고 저장
          </button>
        </div>

        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {reflections.length === 0 && (
            <div className="text-sm text-[#5A6169] border border-dashed border-[#2B3136] rounded-md p-6 text-center">
              아직 회고가 없어요. 이번 주부터 시작해 보세요.
            </div>
          )}
          {reflections.map((r) => {
            const summary = weekSummary(r.weekStart);
            return (
              <div
                key={r.id}
                className="bg-[#20242A] border border-[#2B3136] rounded-md p-3 text-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-mono text-xs text-[#F5A623]">
                    {r.weekStart} 주
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-[#5A6169] hover:text-[#E5484D] shrink-0"
                    aria-label="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {r.selfFound && (
                  <div className="text-xs mt-2">
                    <span className="text-[#9BA3AB]">자발적으로 한 일 — </span>
                    {r.selfFound}
                  </div>
                )}
                {r.postponed && (
                  <div className="text-xs mt-1.5">
                    <span className="text-[#9BA3AB]">미룬 일 — </span>
                    {r.postponed}
                  </div>
                )}
                {r.mistakeFixed && (
                  <div className="text-xs mt-1.5">
                    <span className="text-[#9BA3AB]">실수·개선 — </span>
                    {r.mistakeFixed}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-[#2B3136] text-[10px] text-[#9BA3AB]">
                  이 주 기록 {summary.total}건
                  {Object.entries(summary.byTrait).length > 0 && (
                    <span>
                      {" · "}
                      {Object.entries(summary.byTrait)
                        .map(([t, c]) => `${t} ${c}`)
                        .join(", ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 2: 대시보드 (수치화) ----------
function DashboardTab({ logs }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = logs.filter((l) => {
      const d = new Date(l.date);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });
    const durations = thisMonth
      .map((l) => {
        if (!l.foundTime || !l.doneTime) return null;
        const [ah, am] = l.foundTime.split(":").map(Number);
        const [bh, bm] = l.doneTime.split(":").map(Number);
        let diff = bh * 60 + bm - (ah * 60 + am);
        if (diff < 0) diff += 24 * 60;
        return diff;
      })
      .filter((v) => v !== null);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;
    const firstFix = thisMonth.filter((l) => l.action === "1차조치").length;
    const firstFixRate = thisMonth.length
      ? Math.round((firstFix / thisMonth.length) * 100)
      : null;
    const offManual = thisMonth.filter((l) => l.offManual).length;

    const byEquip = {};
    logs.forEach((l) => {
      if (!l.equipment) return;
      byEquip[l.equipment] = (byEquip[l.equipment] || 0) + 1;
    });
    const topRepeats = Object.entries(byEquip)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const byCompanyTrait = {};
    COMPANIES.forEach((c) => {
      byCompanyTrait[c.id] = {};
      TRAITS_BY_COMPANY[c.id].forEach((t) => (byCompanyTrait[c.id][t] = 0));
    });
    logs.forEach((l) => {
      if (!l.company || !byCompanyTrait[l.company]) return;
      (l.traits || []).forEach((t) => {
        if (byCompanyTrait[l.company][t] !== undefined)
          byCompanyTrait[l.company][t] += 1;
      });
    });

    return {
      count: thisMonth.length,
      avgDuration,
      firstFixRate,
      offManual,
      topRepeats,
      byCompanyTrait,
    };
  }, [logs]);

  const cards = [
    { label: "이번 달 처리 건수", value: stats.count, unit: "건" },
    {
      label: "평균 대응시간",
      value: stats.avgDuration ?? "—",
      unit: stats.avgDuration !== null ? "분" : "",
    },
    {
      label: "1차 조치 처리율",
      value: stats.firstFixRate ?? "—",
      unit: stats.firstFixRate !== null ? "%" : "",
    },
    { label: "매뉴얼 외 대응", value: stats.offManual, unit: "건" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="THIS MONTH IN NUMBERS"
        title="대시보드"
        desc="기록한 내용을 바탕으로 자동 집계됩니다. 자소서와 면접에서 그대로 쓸 수 있는 숫자들이에요."
      />
      <div className="px-5 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-[#20242A] border border-[#2B3136] rounded-md p-4"
            >
              <div className="text-[#9BA3AB] text-xs mb-1">{c.label}</div>
              <div className="text-2xl font-mono text-[#F5A623]">
                {c.value}
                <span className="text-sm text-[#9BA3AB] ml-1">{c.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-1.5 text-sm text-[#9BA3AB] mb-3">
            <TrendingDown size={14} /> 설비별 누적 발생 빈도 (반복 이슈 후보)
          </div>
          {stats.topRepeats.length === 0 ? (
            <div className="text-sm text-[#5A6169]">
              기록이 쌓이면 여기에 자동으로 나타납니다.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topRepeats.map(([name, count]) => {
                const max = stats.topRepeats[0][1];
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-28 text-sm shrink-0 truncate">
                      {name}
                    </div>
                    <div className="flex-1 bg-[#20242A] rounded h-5 overflow-hidden">
                      <div
                        className="h-full bg-[#F5A623]/70"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <div className="w-10 text-right font-mono text-xs text-[#9BA3AB]">
                      {count}건
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="text-sm text-[#9BA3AB] mb-3">
            회사별 인재상 소재 현황 (로그에 태그된 개수)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPANIES.map((c) => (
              <div
                key={c.id}
                className="rounded-md p-4 bg-[#20242A] border-t-4"
                style={{ borderTopColor: c.color }}
              >
                <div
                  className="text-sm font-semibold mb-3"
                  style={{ color: c.color }}
                >
                  {c.id}
                </div>
                <div className="space-y-2.5">
                  {TRAITS_BY_COMPANY[c.id].map((t) => (
                    <div key={t} className="flex justify-between items-center text-sm">
                      <span className="text-[#E8E6E1]">{t}</span>
                      <span
                        className="font-mono font-semibold text-base"
                        style={{ color: c.color }}
                      >
                        {stats.byCompanyTrait[c.id][t]}건
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab: 자소서 자료 모음 (내보내기) ----------
function ExportTab({ logs }) {
  const [company, setCompany] = useState(COMPANIES[0].id);
  const [copied, setCopied] = useState(false);

  function minutesBetween(a, b) {
    if (!a || !b) return null;
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    let diff = bh * 60 + bm - (ah * 60 + am);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  function entryLine(l) {
    const ltype = l.type || "설비 이상";
    if (ltype === "설비 이상") {
      const dur = minutesBetween(l.foundTime, l.doneTime);
      return `${l.date} · [설비이상] ${l.equipment} - ${l.symptom}${
        l.cause ? ` · 원인: ${l.cause}` : ""
      }${dur !== null ? ` · ${dur}분 소요` : ""} · ${l.action}${
        l.repeatCount ? ` · ${l.repeatCount}번째 반복` : ""
      }${l.offManual ? " · 매뉴얼 외" : ""}`;
    }
    if (ltype === "일반 관찰") {
      return `${l.date} · [일반관찰:${l.observeArea}] ${l.content}${
        l.lesson ? ` · 배운점: ${l.lesson}` : ""
      }`;
    }
    return `${l.date} · [약점개선] ${l.weakness}${
      l.improvement ? ` · 개선: ${l.improvement}` : ""
    }${l.result ? ` → ${l.result}` : ""}`;
  }

  const grouped = useMemo(() => {
    const traits = TRAITS_BY_COMPANY[company];
    const byTrait = {};
    traits.forEach((t) => (byTrait[t] = []));
    const unclassified = [];
    logs
      .filter((l) => l.company === company)
      .forEach((l) => {
        if (!l.traits || l.traits.length === 0) {
          unclassified.push(l);
        } else {
          l.traits.forEach((t) => {
            if (byTrait[t]) byTrait[t].push(l);
          });
        }
      });
    return { byTrait, unclassified };
  }, [logs, company]);

  const fullText = useMemo(() => {
    const traits = TRAITS_BY_COMPANY[company];
    let text = `■ ${company} 자소서 소재 정리\n\n`;
    traits.forEach((t) => {
      const items = grouped.byTrait[t];
      text += `[${t}] (${items.length}건)\n`;
      if (items.length === 0) text += `- 아직 기록 없음\n`;
      items.forEach((l) => (text += `- ${entryLine(l)}\n`));
      text += `\n`;
    });
    if (grouped.unclassified.length > 0) {
      text += `[태그 미지정] (${grouped.unclassified.length}건)\n`;
      grouped.unclassified.forEach((l) => (text += `- ${entryLine(l)}\n`));
    }
    return text;
  }, [grouped, company]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  }

  const meta = companyMeta(company);

  return (
    <div>
      <PageHeader
        eyebrow="ESSAY MATERIAL EXPORT"
        title="자소서 자료 모음"
        desc="자소서를 쓰는 시점에 이 화면 하나로 지금까지 태그해둔 소재를 인재상별로 모아서 볼 수 있어요."
      />
      <div className="px-5 md:px-8 py-6">
        <div className="flex gap-2 mb-5">
          {COMPANIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCompany(c.id)}
              className="text-sm px-4 py-2 rounded-md border transition-colors"
              style={{
                color: company === c.id ? "#1C2024" : c.color,
                background: company === c.id ? c.color : "transparent",
                borderColor: c.color,
              }}
            >
              {c.id}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {TRAITS_BY_COMPANY[company].map((t) => (
              <div key={t}>
                <div
                  className="text-sm font-semibold mb-1.5 flex items-center gap-2"
                  style={{ color: meta.color }}
                >
                  {t}
                  <span className="text-[#5A6169] font-normal text-xs">
                    {grouped.byTrait[t].length}건
                  </span>
                </div>
                {grouped.byTrait[t].length === 0 ? (
                  <div className="text-xs text-[#5A6169] pl-1">
                    아직 이 소재로 태그된 기록이 없어요.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {grouped.byTrait[t].map((l) => (
                      <div
                        key={l.id}
                        className="text-xs bg-[#20242A] border border-[#2B3136] rounded px-3 py-2 text-[#E8E6E1]"
                      >
                        {entryLine(l)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-[#9BA3AB]">
                전체 텍스트 (복사해서 자소서 초안에 붙여넣기)
              </span>
              <button
                onClick={copyAll}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#F5A623] text-[#1C2024] font-medium hover:bg-[#FFB84D] transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "복사됨" : "전체 복사"}
              </button>
            </div>
            <textarea
              readOnly
              value={fullText}
              onFocus={(e) => e.target.select()}
              className="w-full h-[520px] bg-[#20242A] border border-[#2B3136] rounded-md px-3 py-3 text-xs text-[#E8E6E1] font-mono resize-none focus:outline-none focus:border-[#F5A623]"
            />
            <p className="text-[10px] text-[#5A6169] mt-1.5">
              복사 버튼이 안 되면 이 상자를 한 번 눌러 전체 선택된 상태에서 직접 복사(⌘/Ctrl+C)하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 3: 프로젝트화 ----------
function ProjectTab({ projects, onChange }) {
  const empty = {
    id: "",
    name: "인수인계 앱",
    date: todayStr(),
    metric: "",
    before: "",
    after: "",
    feedback: "",
  };
  const [form, setForm] = useState(empty);

  function add() {
    if (!form.metric) return;
    onChange([{ ...form, id: uid() }, ...projects]);
    setForm(empty);
  }
  function remove(id) {
    onChange(projects.filter((p) => p.id !== id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="PROJECT EVIDENCE"
        title="프로젝트"
        desc="지금 만든 도구가 실제로 성과를 냈다는 걸 비교 수치와 동료 피드백으로 남겨두세요."
      />
      <div className="px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Field label="프로젝트명">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="기록 날짜">
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="지표명">
              <input
                className={inputCls}
                placeholder="예: 반복 이슈 재발 간격"
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="도입 전 수치">
              <input
                className={inputCls}
                placeholder="예: 평균 7일"
                value={form.before}
                onChange={(e) => setForm({ ...form, before: e.target.value })}
              />
            </Field>
            <Field label="도입 후 수치">
              <input
                className={inputCls}
                placeholder="예: 평균 15일"
                value={form.after}
                onChange={(e) => setForm({ ...form, after: e.target.value })}
              />
            </Field>
          </div>
          <Field label="동료·팀장 피드백 메모">
            <textarea
              className={inputCls + " min-h-[70px] resize-none"}
              placeholder="누가, 언제, 뭐라고 했는지 짧게"
              value={form.feedback}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
            />
          </Field>
          <button
            onClick={add}
            className="mt-2 inline-flex items-center gap-1.5 bg-[#F5A623] text-[#1C2024] font-medium text-sm px-4 py-2 rounded-md hover:bg-[#FFB84D] transition-colors"
          >
            <Plus size={15} /> 기록 추가
          </button>
        </div>
        <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {projects.length === 0 && (
            <div className="text-sm text-[#5A6169] border border-dashed border-[#2B3136] rounded-md p-6 text-center">
              아직 기록이 없어요.
            </div>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-[#20242A] border border-[#2B3136] rounded-md p-3 text-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs text-[#F5A623]">
                    {p.date}
                  </div>
                  <div className="font-medium">
                    {p.name} · {p.metric}
                  </div>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="text-[#5A6169] hover:text-[#E5484D]"
                  aria-label="삭제"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {(p.before || p.after) && (
                <div className="text-xs text-[#9BA3AB] mt-1.5">
                  {p.before} → {p.after}
                </div>
              )}
              {p.feedback && (
                <div className="text-xs text-[#E8E6E1] mt-1.5 border-l-2 border-[#2B3136] pl-2">
                  {p.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 4: 자격증 로드맵 ----------
function CertTab({ certs, onChange }) {
  const empty = { id: "", name: "", target: "", status: "준비중" };
  const [form, setForm] = useState(empty);

  function add() {
    if (!form.name) return;
    onChange([{ ...form, id: uid() }, ...certs]);
    setForm(empty);
  }
  function remove(id) {
    onChange(certs.filter((c) => c.id !== id));
  }
  function cycleStatus(id) {
    const order = ["준비중", "응시예정", "취득완료"];
    onChange(
      certs.map((c) =>
        c.id === id
          ? { ...c, status: order[(order.indexOf(c.status) + 1) % order.length] }
          : c
      )
    );
  }

  const statusColor = {
    준비중: "text-[#9BA3AB] border-[#2B3136]",
    응시예정: "text-[#F5A623] border-[#5A4520]",
    취득완료: "text-[#4ADE80] border-[#245A34]",
  };

  return (
    <div>
      <PageHeader
        eyebrow="CERTIFICATION ROADMAP"
        title="자격증"
        desc="빈틈으로 확인된 영역부터 목표일을 박아두세요. 상태 배지를 눌러 진행 상황을 바꿀 수 있어요."
      />
      <div className="px-5 md:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            className={inputCls + " max-w-[220px]"}
            placeholder="자격증명 (예: 전기기능사)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            className={inputCls + " max-w-[160px]"}
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          />
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 bg-[#F5A623] text-[#1C2024] font-medium text-sm px-4 py-2 rounded-md hover:bg-[#FFB84D] transition-colors"
          >
            <Plus size={15} /> 추가
          </button>
        </div>
        <div className="space-y-2">
          {certs.length === 0 && (
            <div className="text-sm text-[#5A6169] border border-dashed border-[#2B3136] rounded-md p-6 text-center">
              목표 자격증을 추가해 보세요.
            </div>
          )}
          {certs.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-[#20242A] border border-[#2B3136] rounded-md px-4 py-3"
            >
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                {c.target && (
                  <div className="text-xs text-[#9BA3AB] font-mono mt-0.5">
                    목표일 {c.target}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cycleStatus(c.id)}
                  className={`text-xs font-mono px-2.5 py-1 rounded border ${statusColor[c.status]}`}
                >
                  {c.status}
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="text-[#5A6169] hover:text-[#E5484D]"
                  aria-label="삭제"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 5: 관계/평판 메모 ----------
function ReputationTab({ items, onChange }) {
  const empty = { id: "", date: todayStr(), note: "" };
  const [form, setForm] = useState(empty);

  function add() {
    if (!form.note) return;
    onChange([{ ...form, id: uid() }, ...items]);
    setForm(empty);
  }
  function remove(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="REPUTATION NOTES"
        title="평판 메모"
        desc="사소해 보여도 팀에 제안한 개선사항, 받은 인정 한마디를 날짜와 함께 남겨두세요."
      />
      <div className="px-5 md:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="date"
            className={inputCls + " max-w-[160px]"}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className={inputCls + " flex-1 min-w-[200px]"}
            placeholder="예: 팀장님이 인수인계 앱 덕분에 정확도 좋아졌다고 언급"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 bg-[#F5A623] text-[#1C2024] font-medium text-sm px-4 py-2 rounded-md hover:bg-[#FFB84D] transition-colors"
          >
            <Plus size={15} /> 추가
          </button>
        </div>
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-sm text-[#5A6169] border border-dashed border-[#2B3136] rounded-md p-6 text-center">
              아직 메모가 없어요.
            </div>
          )}
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-start justify-between gap-3 bg-[#20242A] border border-[#2B3136] rounded-md px-4 py-3"
            >
              <div>
                <div className="font-mono text-xs text-[#F5A623]">
                  {i.date}
                </div>
                <div className="text-sm mt-0.5">{i.note}</div>
              </div>
              <button
                onClick={() => remove(i.id)}
                className="text-[#5A6169] hover:text-[#E5484D] shrink-0"
                aria-label="삭제"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
