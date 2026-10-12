"use client";

import {
  ArrowDownLeft, ArrowRight, Atom, BookOpen, Bookmark, Check, CheckCircle2,
  ChevronDown, GraduationCap, Home,
  Lightbulb, Menu, MessageCircle, MoreHorizontal, Plus, Send, Sparkles,
  Target, TrendingUp, X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Page = "home" | "workspace" | "chat" | "dashboard" | "subjects";
type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };

const subjects = [
  { name: "Mathematics", icon: Target, description: "Make sense of the patterns behind every problem.", topics: "Algebra · Geometry · Statistics", color: "blue" },
  { name: "Science", icon: Atom, description: "Get curious about how our world works.", topics: "Biology · Chemistry · Physics", color: "green" },
  { name: "English", icon: BookOpen, description: "Find your voice and read between the lines.", topics: "Writing · Literature · Grammar", color: "pink" },
];

const starterQuestions = ["How do I solve a two-step equation?", "Why do we inherit traits from our parents?", "How can I make my essay argument clearer?"];

export default function StudentPlatform() {
  const [page, setPage] = useState<Page>("home");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [level, setLevel] = useState("Year 8");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"checking" | "unconfigured" | "ai">("checking");
  const [chatOpen, setChatOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const homeInput = useRef<HTMLTextAreaElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agsgpt-conversations") || localStorage.getItem("learnwell-conversations");
      if (saved) {
        const parsed = JSON.parse(saved) as Conversation[];
        if (Array.isArray(parsed)) {
          setConversations(parsed);
          setActiveId(parsed[0]?.id ?? "");
        }
      }
    } catch {
      localStorage.removeItem("agsgpt-conversations");
      localStorage.removeItem("learnwell-conversations");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    fetch("/api/tutor")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check AI setup");
        const result = await response.json();
        setMode(result.configured ? "ai" : "unconfigured");
      })
      .catch(() => setMode("unconfigured"));
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("agsgpt-conversations", JSON.stringify(conversations));
  }, [conversations, ready]);

  const activeConversation = conversations.find((item) => item.id === activeId);
  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, chatOpen]);

  function createConversation(title: string) {
    const id = crypto.randomUUID();
    const conversation: Conversation = { id, title: title.slice(0, 54) || "New learning session", messages: [], updatedAt: Date.now() };
    setConversations((current) => [conversation, ...current]);
    setActiveId(id);
    setHintCount(0);
    return id;
  }

  async function sendMessage(text: string, options?: { target?: Page; conversationId?: string }) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const id = options?.conversationId || activeId || createConversation(trimmed);
    const previous = conversations.find((item) => item.id === id)?.messages ?? [];
    const nextMessages = [...previous, { role: "user" as const, content: trimmed }];
    setConversations((current) => current.map((item) => item.id === id
      ? { ...item, messages: nextMessages, updatedAt: Date.now(), title: item.messages.length ? item.title : trimmed.slice(0, 54) }
      : item));
    setActiveId(id);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12), subject, level }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The tutor couldn't respond. Please try again.");
      setMode("ai");
      setConversations((current) => current.map((item) => item.id === id
        ? { ...item, messages: [...item.messages, { role: "assistant", content: result.reply }], updatedAt: Date.now() }
        : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>, target: Page) {
    event.preventDefault();
    if (!question.trim()) return;
    const submitted = question;
    setQuestion("");
    setPage(target);
    void sendMessage(submitted, { target });
  }

  function askTutor(text: string) {
    void sendMessage(text);
  }

  const navItems: { id: Page; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "workspace", label: "Study space", icon: Target },
    { id: "chat", label: "AGSgpt", icon: MessageCircle },
    { id: "dashboard", label: "My learning", icon: TrendingUp },
    { id: "subjects", label: "Subjects", icon: BookOpen },
  ];

  const titles: Record<Page, { title: string; subtitle: string }> = {
    home: { title: "A little less stuck.", subtitle: "A little more sure of yourself." },
    workspace: { title: "Study space", subtitle: "Take it one thoughtful step at a time." },
    chat: { title: "AGSgpt", subtitle: "Clear, detailed explanations for the parts that feel confusing." },
    dashboard: { title: "Your learning", subtitle: "Small steps add up. Here's yours so far." },
    subjects: { title: "Find your subject", subtitle: "Curiosity is a good place to start." },
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPage("home"); }}>
          <span className="brand-mark"><Sparkles size={18} strokeWidth={1.8} /></span>
          <span>AGSgpt<span className="brand-period">.</span></span>
        </a>
        <div className="side-label">YOUR SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? "nav-active" : ""}`} onClick={() => { setPage(id); setMobileNavOpen(false); }} aria-current={page === id ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} /> <span>{label}</span>
              {id === "chat" && conversations.length > 0 && <span className="nav-count">{conversations.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><div className="note-icon"><Lightbulb size={15} /></div><p>Curiosity is a skill. You&apos;re building it.</p></div>
          <button className="profile-button" onClick={() => setSignInOpen(true)}>
            <span className="avatar">M</span><span className="profile-copy"><strong>Student profile</strong><small>Local profile</small></span><ChevronDown size={15} className="profile-chevron" />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>AGSgpt</span><span className="crumb-slash">/</span><strong>{titles[page].title}</strong></div>
          <div className="topbar-right"><span className={`service-status ${mode === "ai" ? "status-live" : ""}`}><span />{mode === "ai" ? "AGSgpt ready" : mode === "checking" ? "Checking AI setup" : "AI setup required"}</span><button className="top-signin" onClick={() => setSignInOpen(true)}>Sign in <ArrowRight size={14} /></button></div>
        </header>

        <div className={`page-content ${page === "chat" ? "chat-page" : ""}`}>
          {mode === "unconfigured" && <div className="setup-notice" role="status"><strong>AI connection required.</strong> Add <code>OPENAI_API_KEY</code> to <code>.env.local</code> and restart the app to use AGSgpt.</div>}
          {page === "home" && <HomePage onSubmit={(event) => handleSubmit(event, "workspace")} question={question} setQuestion={setQuestion} subject={subject} setSubject={setSubject} inputRef={homeInput} onOpenSubjects={() => setPage("subjects")} onQuickAsk={(text) => { setQuestion(text); setPage("workspace"); void sendMessage(text); }} />}
          {page === "workspace" && <WorkspacePage question={question} setQuestion={setQuestion} subject={subject} setSubject={setSubject} level={level} setLevel={setLevel} mode={mode} onSubmit={(event) => handleSubmit(event, "workspace")} messages={messages} busy={busy} error={error} onAsk={askTutor} hintCount={hintCount} setHintCount={setHintCount} />}
          {page === "chat" && <ChatPage conversations={conversations} activeId={activeId} messages={messages} busy={busy} error={error} onSend={askTutor} onNew={() => { createConversation("New learning session"); setError(""); }} onSelect={(id) => { setActiveId(id); setError(""); }} chatEnd={chatEnd} />}
          {page === "dashboard" && <DashboardPage conversations={conversations} onNavigate={setPage} onSelect={(id) => { setActiveId(id); setPage("chat"); }} />}
          {page === "subjects" && <SubjectsPage onChoose={(name) => { setSubject(name); setPage("workspace"); }} />}
          <footer className="footer"><span>© 2026 AGSgpt</span><div><a href="#about" onClick={(event) => event.preventDefault()}>About</a><a href="mailto:hello@agsgpt.example">Contact</a><a href="#privacy" onClick={(event) => event.preventDefault()}>Privacy</a><a href="#terms" onClick={(event) => event.preventDefault()}>Terms</a></div><span className="footer-signoff">Made for the moment it clicks <span>✳</span></span></footer>
        </div>
      </main>

      <button className={`floating-chat ${chatOpen ? "floating-chat-open" : ""}`} aria-label={chatOpen ? "Close AGSgpt" : "Open AGSgpt"} onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? <X size={21} /> : <MessageCircle size={21} />}<span>{chatOpen ? "" : "Ask AGSgpt"}</span></button>
      {chatOpen && <div className="chat-popover" role="dialog" aria-label="AGSgpt"><div className="popover-head"><div><span className="tutor-avatar"><Sparkles size={17} /></span><span><strong>AGSgpt</strong><small><i /> Detailed, step-by-step help</small></span></div><button className="icon-button" aria-label="Close chat" onClick={() => setChatOpen(false)}><X size={18} /></button></div><div className="popover-messages">{messages.length === 0 ? <div className="popover-welcome"><span className="welcome-spark"><Sparkles size={19} /></span><strong>What are you working on?</strong><p>Share a question or tell me which part feels confusing. We'll go through it step by step.</p><button onClick={() => { setChatOpen(false); setPage("chat"); }}>Open full AGSgpt <ArrowRight size={14} /></button></div> : messages.slice(-8).map((message, index) => <MessageBubble key={index} message={message} />)}{error && <div className="error-message" role="alert">{error}</div>}{busy && <Typing />}<div ref={chatEnd} /></div><form className="popover-form" onSubmit={(event) => { event.preventDefault(); const value = (event.currentTarget.elements.namedItem("popover-input") as HTMLInputElement).value; if (value.trim()) { askTutor(value); event.currentTarget.reset(); } }}><input name="popover-input" aria-label="Message AGSgpt" placeholder="Describe what's confusing..." /><button aria-label="Send message" disabled={busy}><ArrowRight size={17} /></button></form></div>}

      {signInOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSignInOpen(false); }}><section className="signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-title"><button className="modal-close icon-button" aria-label="Close" onClick={() => setSignInOpen(false)}><X size={19} /></button><span className="modal-symbol"><GraduationCap size={22} /></span><span className="eyebrow">A NOTE ABOUT YOUR PROFILE</span><h2 id="signin-title">Your learning stays yours.</h2><p>This preview saves your study sessions on this device only. Sign-in and cloud sync aren&apos;t configured yet, so no account or server-side history is being created.</p><button className="primary-button modal-done" onClick={() => setSignInOpen(false)}>Got it <Check size={16} /></button></section></div>}
    </div>
  );
}

function HomePage({ onSubmit, question, setQuestion, subject, setSubject, inputRef, onOpenSubjects, onQuickAsk }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; question: string; setQuestion: (value: string) => void; subject: string; setSubject: (value: string) => void; inputRef: React.RefObject<HTMLTextAreaElement | null>; onOpenSubjects: () => void; onQuickAsk: (text: string) => void }) {
  return <>
    <section className="home-hero">
      <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR THINKING, WITH A LITTLE BACKUP</span><h1>Don&apos;t just find<br />the answer.<br /><em>Learn how to solve it.</em></h1><p>A thoughtful study partner that meets you where you are, asks the right question, and helps you find your own way through.</p></div>
      <div className="hero-art" aria-label="A student thinking through a problem with help from an AI tutor"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-sticky sticky-top"><span>what if I...</span><i>↗</i></div><div className="art-sticky sticky-bottom"><span>start here</span><i>✳</i></div><div className="art-core"><div className="core-grid" /><span className="core-star">✳</span><span className="core-caption">one step<br />at a time</span></div><div className="art-node node-left"><span className="node-line" /><span>curiosity</span></div><div className="art-node node-right"><span className="node-line" /><span>your idea</span></div><span className="art-caption">A different kind of study buddy</span></div>
    </section>
    <section className="question-launch" aria-labelledby="launch-title"><div className="launch-heading"><span className="launch-number">01</span><div><h2 id="launch-title">What&apos;s on your mind?</h2><p>Start with a question. We&apos;ll figure out the next step together.</p></div></div><form onSubmit={onSubmit} className="launch-form"><textarea ref={inputRef} rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What question are you struggling with?" aria-label="Your question" /><div className="launch-controls"><div className="launch-subject"><span className="subject-pip" /><select aria-label="Choose a subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option>Mathematics</option><option>Science</option><option>English</option></select><ChevronDown size={14} /></div><button className="primary-button" type="submit" disabled={!question.trim()}>Get guidance <ArrowRight size={16} /></button></div></form><div className="launch-bottom"><span><span className="tiny-spark">✳</span> No judgment. No shortcuts. Just understanding.</span><button onClick={onOpenSubjects}>Explore subjects <ArrowDownLeft size={14} /></button></div></section>
    <section className="how-section"><div className="section-heading"><div><span className="eyebrow">A BETTER WAY TO GET UNSTUCK</span><h2>Not the answer key.<br /><em>The thinking partner.</em></h2></div><p>Real understanding doesn&apos;t come from copying a solution. It comes from that little click when you see why it works.</p></div><div className="feature-row"><article className="feature-item"><span className="feature-index">01 / NOTICE</span><div className="feature-icon feature-blue"><MessageCircle size={20} /></div><h3>Start where you are</h3><p>Share the question, the part that feels fuzzy, or even a wrong first guess. That&apos;s a perfectly good place to begin.</p></article><article className="feature-item"><span className="feature-index">02 / EXPLORE</span><div className="feature-icon feature-green"><Lightbulb size={20} /></div><h3>Get just enough of a nudge</h3><p>Hints arrive one at a time. Ask for a concept breakdown whenever you need more of the picture.</p></article><article className="feature-item"><span className="feature-index">03 / OWN IT</span><div className="feature-icon feature-yellow"><CheckCircle2 size={20} /></div><h3>Make the next move yours</h3><p>Try it, explain your reasoning, change your mind. Every attempt makes the next one a little easier.</p></article></div></section>
    <section className="try-section"><div><span className="eyebrow">NOT SURE WHERE TO BEGIN?</span><h2>Pick a thread.<br /><em>We&apos;ll follow it.</em></h2></div><div className="starter-list">{starterQuestions.map((item, index) => <button key={item} onClick={() => onQuickAsk(item)}><span>0{index + 1}</span><span>{item}</span><ArrowRight size={16} /></button>)}</div></section>
  </>;
}

function WorkspacePage({ question, setQuestion, subject, setSubject, level, setLevel, mode, onSubmit, messages, busy, error, onAsk, hintCount, setHintCount }: { question: string; setQuestion: (value: string) => void; subject: string; setSubject: (value: string) => void; level: string; setLevel: (value: string) => void; mode: "checking" | "unconfigured" | "ai"; onSubmit: (event: FormEvent<HTMLFormElement>) => void; messages: Message[]; busy: boolean; error: string; onAsk: (text: string) => void; hintCount: number; setHintCount: (value: number) => void }) {
  const latestReply = messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1] : undefined;
  const progress = Math.min(88, messages.filter((message) => message.role === "user").length * 17 + hintCount * 10);
  return <>
    <div className="page-intro"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Study space<span className="title-period">.</span></h1><p>Bring the problem. We&apos;ll make room for your thinking.</p></div><div className="workspace-progress"><div className="progress-label"><span>YOUR MOMENTUM</span><span>{progress}%</span></div><div className="progress-track"><span style={{ width: `${Math.max(progress, 5)}%` }} /></div></div></div>
    <div className="workspace-grid"><section className="problem-column"><div className="panel-label"><span>THE QUESTION</span><span className="label-note">Take your time</span></div><form className="problem-form" onSubmit={onSubmit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={6} placeholder="Write out the question, or describe the bit that has you stuck..." aria-label="Academic question" /><div className="problem-options"><label>SUBJECT<select value={subject} onChange={(event) => setSubject(event.target.value)}><option>Mathematics</option><option>Science</option><option>English</option></select></label><label>YEAR GROUP<select value={level} onChange={(event) => setLevel(event.target.value)}><option>Year 8</option><option>Year 9</option><option>Year 10</option></select></label><button className="primary-button" disabled={!question.trim() || busy}>Guide me <ArrowRight size={15} /></button></div></form><div className="workspace-tool-list"><button onClick={() => { setHintCount(hintCount + 1); onAsk("I'm stuck. Please give me one more small, progressive hint without jumping to the final answer."); }} disabled={busy}><Lightbulb size={16} /><span>Give me another hint</span><Plus size={15} /></button><button onClick={() => onAsk("Please explain the underlying concept for my question in simple language, with a small example.")} disabled={busy}><BookOpen size={16} /><span>Explain this concept</span><ArrowRight size={15} /></button><button onClick={() => { const attempt = window.prompt("What have you tried so far?"); if (attempt?.trim()) onAsk(`Check my reasoning. My attempt: ${attempt}`); }} disabled={busy}><CheckCircle2 size={16} /><span>Check my reasoning</span><ArrowRight size={15} /></button></div></section>
      <section className="guidance-column"><div className="guidance-header"><div className="guidance-mark"><Sparkles size={16} /></div><div><strong>AGSgpt</strong><small>{busy ? "Working through the steps..." : mode === "ai" ? "AI connected · step-by-step guidance" : mode === "checking" ? "Checking AI connection..." : "AI connection required"}</small></div><span className={`mini-mode ${modeLabel(busy)}`}>{busy ? "WORKING" : "GUIDANCE"}</span></div><div className="guidance-body">{error && <div className="error-message" role="alert">{error}<button onClick={() => onAsk(messages[messages.length - 1]?.content || question)}>Try again</button></div>}{latestReply ? <><span className="reply-kicker">LET&apos;S THINK THIS THROUGH</span><p className="guidance-reply">{latestReply.content}</p><div className="guidance-question"><span>YOUR TURN</span><p>What are you thinking so far?</p></div></> : busy ? <div className="guidance-empty"><Typing /><p>Reading your question...</p></div> : <div className="guidance-empty"><span className="empty-orbit"><Sparkles size={22} /></span><h3>Your first step starts here.</h3><p>AGSgpt gives step-by-step guidance when its AI connection is configured.</p></div>}{busy && latestReply && <Typing />}</div><div className="guidance-foot"><span><span className="trust-dot" /> A safe place to think out loud</span><span>Nothing is too small to ask</span></div></section></div>
  </>;
}

function modeLabel(busy: boolean) { return busy ? "" : ""; }

function ChatPage({ conversations, activeId, messages, busy, error, onSend, onNew, onSelect, chatEnd }: { conversations: Conversation[]; activeId: string; messages: Message[]; busy: boolean; error: string; onSend: (text: string) => void; onNew: () => void; onSelect: (id: string) => void; chatEnd: React.RefObject<HTMLDivElement | null> }) {
  const [draft, setDraft] = useState("");
  return <div className="full-chat-layout"><aside className="chat-history"><div className="history-heading"><div><span className="eyebrow">YOUR THREADS</span><h2>Conversations</h2></div><button className="icon-button new-chat-button" aria-label="Start a new conversation" onClick={onNew}><Plus size={18} /></button></div><button className="new-thread" onClick={onNew}><Plus size={16} /> New conversation</button><div className="history-list">{conversations.length === 0 ? <p className="history-empty">Your conversations will find a home here.</p> : conversations.map((item) => <button key={item.id} className={`history-item ${activeId === item.id ? "history-active" : ""}`} onClick={() => onSelect(item.id)}><span className="history-item-icon"><MessageCircle size={15} /></span><span><strong>{item.title}</strong><small>{item.messages.length} messages · {relativeDate(item.updatedAt)}</small></span><MoreHorizontal size={16} /></button>)}</div><div className="history-note"><Bookmark size={15} /><span>Saved on this device</span></div></aside><section className="chat-thread"><div className="thread-top"><div><span className="eyebrow">YOUR STUDY SESSION</span><h1>{conversations.find((item) => item.id === activeId)?.title || "A question, a conversation"}</h1></div><span className="thread-subject"><span className="subject-pip" /> {subjectLabel(messages)}</span></div><div className="thread-messages">{messages.length === 0 ? <div className="chat-empty"><span className="empty-orbit"><Sparkles size={23} /></span><span className="eyebrow">A FRESH PAGE</span><h2>What are you working through?</h2><p>Start with the question, or tell me what part doesn&apos;t quite click yet.</p><div className="prompt-suggestions">{starterQuestions.map((item) => <button key={item} onClick={() => onSend(item)}>{item}<ArrowRight size={14} /></button>)}</div></div> : messages.map((message, index) => <MessageBubble key={`${activeId}-${index}`} message={message} />)}{busy && <Typing />}{error && <div className="error-message" role="alert">{error}<button onClick={() => onSend(messages[messages.length - 1]?.content || "Can you help me think through this?")}>Try again</button></div>}<div ref={chatEnd} /></div><form className="thread-composer" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) { onSend(draft); setDraft(""); } }}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} placeholder="Ask a question, share a thought..." aria-label="Message your tutor" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (draft.trim()) { onSend(draft); setDraft(""); } } }} /><div className="composer-bottom"><span>Shift + Enter for a new line <span>·</span> Your tutor guides, never grades.</span><button className="send-button" aria-label="Send message" disabled={!draft.trim() || busy}><Send size={16} /></button></div></form></section></div>;
}

function DashboardPage({ conversations, onNavigate, onSelect }: { conversations: Conversation[]; onNavigate: (page: Page) => void; onSelect: (id: string) => void }) {
  const totalMessages = conversations.reduce((total, item) => total + item.messages.filter((message) => message.role === "user").length, 0);
  const studiedSubjects = Array.from(new Set(conversations.map((item) => inferSubject(item.title))));
  return <><div className="page-intro dash-intro"><div><span className="eyebrow">YOUR PERSONAL STUDY LOG</span><h1>Welcome back<span className="title-period">.</span></h1><p>A little progress is still progress. Here&apos;s yours.</p></div><span className="profile-large">M</span></div><div className="dash-stats"><div className="stat-block"><span className="stat-icon stat-icon-blue"><MessageCircle size={17} /></span><span className="stat-value">{conversations.length}</span><span className="stat-caption">study sessions</span></div><div className="stat-block"><span className="stat-icon stat-icon-green"><CheckCircle2 size={17} /></span><span className="stat-value">{totalMessages}</span><span className="stat-caption">questions explored</span></div><div className="stat-block"><span className="stat-icon stat-icon-yellow"><Target size={17} /></span><span className="stat-value">{studiedSubjects.length}</span><span className="stat-caption">subjects explored</span></div><button className="stat-cta" onClick={() => onNavigate("workspace")}><span className="stat-icon stat-icon-violet"><Plus size={17} /></span><strong>Start a new session</strong><ArrowRight size={16} /></button></div><div className="dashboard-columns"><section className="dash-section"><div className="dash-section-title"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recent sessions</h2></div><button onClick={() => onNavigate("chat")}>All conversations <ArrowRight size={14} /></button></div>{conversations.length === 0 ? <div className="empty-list"><span className="empty-orbit"><MessageCircle size={19} /></span><strong>Your story starts with a question.</strong><p>Study sessions will appear here as you explore.</p><button onClick={() => onNavigate("workspace")}>Begin a study session <ArrowRight size={14} /></button></div> : <div className="recent-list">{conversations.slice(0, 4).map((item) => <button className="recent-row" key={item.id} onClick={() => onSelect(item.id)}><span className="recent-symbol"><BookOpen size={16} /></span><span className="recent-copy"><strong>{item.title}</strong><small>{inferSubject(item.title)} <span>·</span> {item.messages.filter((message) => message.role === "user").length} questions</small></span><span className="recent-date">{relativeDate(item.updatedAt)}</span><ArrowRight size={15} /></button>)}</div>}</section><aside className="dash-aside"><div className="progress-card"><span className="eyebrow">A NOTE FOR YOU</span><div className="progress-art"><span>✳</span><i /><i /><i /></div><h3>Keep the questions coming.</h3><p>There&apos;s no streak to break and no pace to keep. The fact that you showed up is the whole thing.</p><button onClick={() => onNavigate("subjects")}>Explore something new <ArrowRight size={14} /></button></div><div className="local-note"><span><Bookmark size={15} /></span><p>Your learning history is saved <strong>only on this device.</strong> Accounts aren&apos;t connected in this preview.</p></div></aside></div></>;
}

function SubjectsPage({ onChoose }: { onChoose: (name: string) => void }) {
  const [filter, setFilter] = useState("All subjects");
  const visibleSubjects = subjects.filter((item) => filter === "All subjects" || item.name === filter);
  return <><div className="page-intro subject-intro"><div><span className="eyebrow">YEAR 8-10 LEARNING</span><h1>What are you studying<span className="title-period">?</span></h1><p>Choose Mathematics, Science, or English to get started.</p></div></div><div className="subject-toolbar"><div className="subject-tabs" role="group" aria-label="Filter subjects">{["All subjects", "Mathematics", "Science", "English"].map((item) => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><span>{visibleSubjects.length} subjects</span></div><div className="subject-grid">{visibleSubjects.map(({ name, icon: Icon, description, topics, color }, index) => <article className={`subject-card subject-${color}`} key={name}><div className="subject-card-top"><span className="subject-icon"><Icon size={21} strokeWidth={1.7} /></span><span className="subject-count">0{index + 1}</span></div><h2>{name}</h2><p>{description}</p><div className="subject-topics"><span>YEAR 8-10 TOPICS</span><p>{topics}</p></div><button onClick={() => onChoose(name)}>Begin a guided session <ArrowRight size={15} /></button></article>)}</div><div className="subject-bottom-note"><span className="tiny-spark">✳</span><p>AGSgpt explains each step, then helps you try the next one.</p></div></>;
}

function MessageBubble({ message }: { message: Message }) {
  return <div className={`message-row ${message.role === "user" ? "message-user" : "message-tutor"}`}>{message.role === "assistant" && <span className="message-avatar"><Sparkles size={14} /></span>}<div className="message-content"><span className="message-author">{message.role === "user" ? "YOU" : "AGSGPT"}</span><p>{message.content}</p></div></div>;
}

function Typing() {
  return <div className="typing-indicator" role="status" aria-label="AGSgpt is thinking"><span /><span /><span /></div>;
}

function subjectLabel(messages: Message[]) {
  return messages.length ? inferSubject(messages[0].content) : "Open conversation";
}

function inferSubject(text: string) {
  const lower = text.toLowerCase();
  if (/math|algebra|equation|fraction|number|geometry/.test(lower)) return "Mathematics";
  if (/science|biology|photosynthesis|physics|chemistry/.test(lower)) return "Science";
  if (/essay|write|literature|grammar|english/.test(lower)) return "English";
  return "General learning";
}

function relativeDate(timestamp: number) {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}