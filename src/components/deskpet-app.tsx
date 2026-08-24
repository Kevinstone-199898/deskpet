"use client";

import {
  Check,
  Download,
  Feather,
  Moon,
  RotateCcw,
  Send,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  COLOR_OPTIONS,
  localPersonalityResponse,
  PERSONALITY_OPTIONS,
  SPECIES_OPTIONS,
  type ChatMessage,
  type Mood,
  type PetProfile,
  type Personality,
  type Species,
  validateName,
} from "@/lib/pet";
import { PetAvatar } from "./pet-avatar";

const DEVICE_KEY = "deskpet.device_id";
const PROFILE_KEY = "deskpet.profile";
const MESSAGES_KEY = "deskpet.messages";
const THEME_KEY = "deskpet.theme";
const STARTERS = [
  "How was your day?",
  "Tell me something silly",
  "I need a little encouragement",
];
const QUICK_NAMES = ["Miso", "Pixel", "Ember", "Noodle", "Biscuit", "Comet"];

type Theme = "light" | "dark";
type EditablePet = Pick<PetProfile, "name" | "species" | "color" | "personality">;

const DEFAULT_PET: EditablePet = {
  name: "",
  species: "cat",
  color: "#f4a879",
  personality: "sunny",
};

function readJSON<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function IconMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "brand-mark--small" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ThemeButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button className="icon-button" type="button" onClick={onToggle} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function SelectionFields({
  value,
  onChange,
  compact = false,
}: {
  value: EditablePet;
  onChange: (value: EditablePet) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "selection-fields selection-fields--compact" : "selection-fields"}>
      <fieldset className="field-group">
        <legend>Choose a species</legend>
        <div className="species-grid">
          {SPECIES_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`choice-card ${value.species === option.value ? "choice-card--selected" : ""}`}
              aria-pressed={value.species === option.value}
              onClick={() => onChange({ ...value, species: option.value as Species })}
            >
              <span className="species-glyph" aria-hidden="true">{option.emoji}</span>
              <span>
                <strong>{option.label}</strong>
                {!compact && <small>{option.blurb}</small>}
              </span>
              {value.species === option.value && <Check className="choice-check" size={14} />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>Pick a color</legend>
        <div className="color-row">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`color-swatch ${value.color === option.value ? "color-swatch--selected" : ""}`}
              style={{ "--swatch": option.value } as React.CSSProperties}
              aria-label={option.label}
              aria-pressed={value.color === option.value}
              onClick={() => onChange({ ...value, color: option.value })}
            >
              {value.color === option.value && <Check size={17} />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>Personality</legend>
        <div className="personality-grid">
          {PERSONALITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`personality-card ${value.personality === option.value ? "personality-card--selected" : ""}`}
              aria-pressed={value.personality === option.value}
              onClick={() => onChange({ ...value, personality: option.value as Personality })}
            >
              <span className="personality-icon" aria-hidden="true">{option.emoji}</span>
              <span>
                <strong>{option.label}</strong>
                {!compact && <small>{option.blurb}</small>}
              </span>
              {value.personality === option.value && <Check className="choice-check" size={14} />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function Onboarding({
  theme,
  onTheme,
  onComplete,
}: {
  theme: Theme;
  onTheme: () => void;
  onComplete: (profile: PetProfile, greeting: string) => void;
}) {
  const [pet, setPet] = useState<EditablePet>(DEFAULT_PET);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validateName(pet.name);
    if (validation !== true) {
      setError(typeof validation === "string" ? validation : "Give your pet a name first.");
      return;
    }
    setSaving(true);
    const deviceId = getDeviceId();
    const profile = { ...pet, name: pet.name.trim(), deviceId } as PetProfile;
    let greeting = `Hi! I’m ${profile.name}. I’m really glad you’re here.`;
    try {
      const response = await fetch("/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error("Could not save your pet");
      const data = await response.json();
      greeting = data.greeting ?? greeting;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile ?? profile));
      onComplete(data.profile ?? profile, greeting);
    } catch {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      onComplete(profile, greeting);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="topbar topbar--onboarding">
        <a className="brand" href="#" aria-label="Deskpet home">
          <IconMark />
          <span>deskpet</span>
        </a>
        <ThemeButton theme={theme} onToggle={onTheme} />
      </header>
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-intro">
          <span className="eyebrow"><Feather size={13} /> Your tiny sidekick</span>
          <h1 id="onboarding-title">Meet your new<br /><em>companion.</em></h1>
          <p>Give it a name, a look, and a personality. It will remember this and everything you tell it, every time you come back.</p>
        </div>
        <form className="onboarding-form" onSubmit={submit}>
          <label className="name-field">
            <span>Name your pet</span>
            <span className="input-shell">
              <input
                autoFocus
                maxLength={24}
                value={pet.name}
                placeholder="Something adorable..."
                onChange={(event) => {
                  setPet({ ...pet, name: event.target.value });
                  setError("");
                }}
                aria-describedby={error ? "name-error" : undefined}
              />
              <small>{pet.name.length}/24</small>
            </span>
          </label>
          <div className="name-picks" aria-label="Quick name ideas">
            {QUICK_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={pet.name === name ? "name-pick name-pick--selected" : "name-pick"}
                onClick={() => {
                  setPet({ ...pet, name });
                  setError("");
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {error && <p className="field-error" id="name-error">{error}</p>}
          <SelectionFields value={pet} onChange={setPet} />
          <button className="primary-button primary-button--large" disabled={saving} type="submit">
            {saving ? "Bringing your pet to life…" : "Bring my pet to life"}
            {!saving && <span aria-hidden="true">→</span>}
          </button>
          <p className="privacy-note">No account needed · Your companion stays yours</p>
        </form>
      </section>
      <footer className="onboarding-footer">Made for quiet moments between everything else.</footer>
    </main>
  );
}

function ChatPanel({
  profile,
  messages,
  open,
  sending,
  onClose,
  onSettings,
  onSend,
}: {
  profile: PetProfile;
  messages: ChatMessage[];
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSettings: () => void;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, sending, open]);

  function sendDraft() {
    if (!draft.trim() || sending) return;
    onSend(draft.trim());
    setDraft("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    sendDraft();
  }

  return (
    <>
      {open && <button className="sheet-backdrop" type="button" aria-label="Close chat" onClick={onClose} />}
      <aside className={`chat-panel ${open ? "chat-panel--open" : ""}`} aria-label={`Chat with ${profile.name}`}>
        <header className="chat-header">
          <div className="chat-pet-badge">
            <PetAvatar profile={profile} mood="happy" compact />
          </div>
          <div>
            <strong>{profile.name}</strong>
            <span><i /> {sending ? "typing…" : "here for you"}</span>
          </div>
          <div className="chat-header-actions">
            <button className="icon-button" type="button" onClick={onSettings} aria-label={`Edit ${profile.name}`} title="Companion settings"><Sun size={17} /></button>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close chat"><X size={18} /></button>
          </div>
        </header>
        <div className="chat-scroll" aria-live="polite">
          <div className="chat-date">Today</div>
          {messages.length === 0 && (
            <div className="empty-chat">
              <span>✦</span>
              <p>{profile.name} is listening.</p>
              <small>Start with anything on your mind.</small>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={message.id} className={`message-row message-row--${message.role}`}>
              <div className="message-bubble">{message.content}</div>
              {index === 0 && message.role === "assistant" && <span className="starter-label">Starter message</span>}
            </div>
          ))}
          {sending && (
            <div className="message-row message-row--assistant">
              <div className="typing" aria-label={`${profile.name} is typing`}><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length < 2 && (
          <div className="starter-chips">
            {STARTERS.map((starter) => <button type="button" key={starter} onClick={() => onSend(starter)}>{starter}</button>)}
          </div>
        )}
        <div className="chat-composer-wrap">
          <form className="chat-compose" onSubmit={submit}>
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendDraft();
                }
              }}
              maxLength={2000}
              placeholder={`Message ${profile.name}…`}
              aria-label={`Message ${profile.name}`}
            />
            <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Send size={17} /></button>
          </form>
          <div className="composer-meta"><span>Enter to send · Shift+Enter for a new line</span><span>{draft.length}/2000</span></div>
        </div>
        <p className="chat-footnote">Your conversations are remembered on this device.</p>
      </aside>
    </>
  );
}

function SettingsModal({
  profile,
  onClose,
  onSave,
  onForget,
  onExport,
}: {
  profile: PetProfile;
  onClose: () => void;
  onSave: (profile: PetProfile) => Promise<void>;
  onForget: () => void;
  onExport: () => void;
}) {
  const [pet, setPet] = useState<EditablePet>(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = validateName(pet.name);
    if (result !== true) {
      setError(typeof result === "string" ? result : "Please enter a name.");
      return;
    }
    setSaving(true);
    await onSave({ ...profile, ...pet, name: pet.name.trim() });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close settings" />
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header>
          <div className="edit-title">
            <span className="edit-avatar"><PetAvatar profile={{ ...profile, ...pet }} mood="happy" compact /></span>
            <h2 id="settings-title">Edit your pet</h2>
          </div>
        </header>
        <form onSubmit={save}>
          <label className="name-field">
            <span>Name</span>
            <span className="input-shell">
              <input maxLength={24} value={pet.name} onChange={(event) => setPet({ ...pet, name: event.target.value })} />
              <small>{pet.name.length}/24</small>
            </span>
          </label>
          {error && <p className="field-error">{error}</p>}
          <fieldset className="field-group edit-species">
            <legend>Species</legend>
            <div className="edit-species-grid">
              {SPECIES_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={pet.species === option.value ? "edit-species-tile edit-species-tile--selected" : "edit-species-tile"}
                  onClick={() => setPet({ ...pet, species: option.value })}
                  aria-label={option.label}
                  aria-pressed={pet.species === option.value}
                  title={option.label}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="field-group edit-colors">
            <legend>Color</legend>
            <div className="color-row">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`color-swatch ${pet.color === option.value ? "color-swatch--selected" : ""}`}
                  style={{ "--swatch": option.value } as React.CSSProperties}
                  aria-label={option.label}
                  aria-pressed={pet.color === option.value}
                  onClick={() => setPet({ ...pet, color: option.value })}
                >
                  {pet.color === option.value && <Check size={14} />}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="edit-personality">
            <span>Personality</span>
            <select
              value={pet.personality}
              onChange={(event) => setPet({ ...pet, personality: event.target.value as Personality })}
            >
              {PERSONALITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="settings-form-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
        <div className="settings-tools">
          <h3>Conversation</h3>
          <button type="button" onClick={onExport}><Download size={16} /> Export transcript</button>
          <button className="danger-action" type="button" onClick={onForget}><Trash2 size={16} /> Forget conversation</button>
        </div>
      </section>
    </div>
  );
}

export function DeskpetApp() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [mood, setMood] = useState<Mood>("happy");
  const [theme, setTheme] = useState<Theme>("light");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      const storedTheme = (localStorage.getItem(THEME_KEY) as Theme) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      const localProfile = readJSON<PetProfile>(PROFILE_KEY);
      const localMessages = readJSON<ChatMessage[]>(MESSAGES_KEY) ?? [];
      if (localProfile) setProfile(localProfile);
      setMessages(localMessages);

      const deviceId = getDeviceId();
      Promise.all([
        fetch(`/api/pet?deviceId=${encodeURIComponent(deviceId)}`).then((response) => response.ok ? response.json() : null),
        fetch(`/api/chat?deviceId=${encodeURIComponent(deviceId)}`).then((response) => response.ok ? response.json() : null),
      ]).then(async ([petData, chatData]) => {
        if (petData?.profile) {
          setProfile(petData.profile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(petData.profile));
        } else if (localProfile) {
          fetch("/api/pet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(localProfile) }).catch(() => undefined);
        }
        if (chatData?.messages?.length) {
          setMessages(chatData.messages);
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(chatData.messages));
        }
      }).catch(() => undefined).finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(initialization);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
  }

  function persistMessages(next: ChatMessage[]) {
    setMessages(next);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
  }

  function completeOnboarding(nextProfile: PetProfile, greeting: string) {
    setProfile(nextProfile);
    const greetingMessage = makeMessage("assistant", greeting);
    persistMessages([greetingMessage]);
    setMood("excited");
    setTimeout(() => setMood("happy"), 2200);
  }

  async function sendMessage(text: string) {
    if (!profile || sending) return;
    const userMessage = makeMessage("user", text);
    const previous = messages;
    persistMessages([...messages, userMessage]);
    setSending(true);
    setMood(text.includes("?") ? "curious" : "excited");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({ deviceId: profile.deviceId, message: text }),
      });
      if (!response.ok) throw new Error("chat unavailable");
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/plain") && response.body) {
        const assistant = makeMessage("assistant", "");
        let current = [...previous, userMessage, assistant];
        persistMessages(current);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assistant.content += decoder.decode(value, { stream: true });
          current = [...previous, userMessage, { ...assistant }];
          persistMessages(current);
        }
      } else {
        const data = await response.json();
        persistMessages([...previous, data.userMessage ?? userMessage, data.assistantMessage]);
      }
      setMood("happy");
    } catch {
      const fallback = makeMessage("assistant", localPersonalityResponse(profile, previous, text));
      persistMessages([...previous, userMessage, fallback]);
      setToast("I lost the signal, so I answered right from the desk.");
      setMood("happy");
    } finally {
      setSending(false);
    }
  }

  async function saveProfile(next: PetProfile) {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    try {
      await fetch("/api/pet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setToast("Your companion has a fresh new look.");
    } catch {
      setToast("Saved on this device.");
    }
  }

  async function forgetConversation() {
    if (!profile || !confirm(`Forget your conversation with ${profile.name}?`)) return;
    persistMessages([]);
    try {
      await fetch(`/api/chat?deviceId=${encodeURIComponent(profile.deviceId)}`, { method: "DELETE" });
    } catch {}
    setSettingsOpen(false);
    setToast("Conversation forgotten. A clean little slate.");
  }

  function exportTranscript() {
    if (!profile) return;
    const lines = [
      `Deskpet transcript — ${profile.name}`,
      `Exported ${new Date().toLocaleString()}`,
      "",
      ...messages.map((message) => `${message.role === "user" ? "You" : profile.name}: ${message.content}`),
    ];
    const href = URL.createObjectURL(new Blob([lines.join("\n\n")], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `${profile.name.toLowerCase().replaceAll(/\W+/g, "-")}-deskpet-chat.txt`;
    link.click();
    URL.revokeObjectURL(href);
    setToast("Transcript downloaded.");
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!ready && !profile) {
    return <main className="loading-screen"><IconMark /><span>Waking up your desk...</span></main>;
  }
  if (!profile) {
    return <Onboarding theme={theme} onTheme={toggleTheme} onComplete={completeOnboarding} />;
  }

  return (
    <main className="pet-home">
      <button className="floating-theme" type="button" onClick={toggleTheme} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <section className="companion-stage">
        <div className="ambient-orb ambient-orb--one" />
        <div className="ambient-orb ambient-orb--two" />
        <div className="corner-hint">
          <span className="hint-sparkle" aria-hidden="true">✦</span>
          <h1>{profile.name} is here, in the corner.</h1>
          <p>Click on {profile.name} any time you want to talk.</p>
        </div>
        <div className="corner-pet" style={{ "--pet-color": profile.color } as React.CSSProperties}>
          <PetAvatar profile={profile} mood={mood} interactive onClick={() => setChatOpen(true)} />
        </div>
      </section>

      <ChatPanel
        profile={profile}
        messages={messages}
        open={chatOpen}
        sending={sending}
        onClose={() => setChatOpen(false)}
        onSettings={() => {
          setChatOpen(false);
          setSettingsOpen(true);
        }}
        onSend={sendMessage}
      />
      {settingsOpen && <SettingsModal profile={profile} onClose={() => setSettingsOpen(false)} onSave={saveProfile} onForget={forgetConversation} onExport={exportTranscript} />}
      {toast && <div className="toast" role="status"><RotateCcw size={15} />{toast}</div>}
    </main>
  );
}
