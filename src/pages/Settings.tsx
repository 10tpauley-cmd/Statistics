import { useRef, useState, type ReactNode } from 'react';
import { useLearner, isStorageAvailable, emit } from '../state/store';
import { updateSettings, setName, exportData, importData, resetAll } from '../state/actions';
import { Icon } from '../components/ui/Icon';
import { Seg, Toggle, Modal } from '../components/ui';
import { Mu } from '../components/mascot/Mu';

function Row({ title, desc, children }: { title: string; desc?: ReactNode; children: ReactNode }) {
  return (
    <div className="list-item" style={{ flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 240px' }}>
        <div className="bold small">{title}</div>
        {desc && <div className="tiny muted">{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const s = useLearner();
  const st = s.settings;
  const [key, setKey] = useState(st.aiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<null | 'busy' | { ok: boolean; msg: string }>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stat-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    emit({ kind: 'toast', tone: 'success', title: 'Backup downloaded', body: 'Your API key is never included in backups.' });
  };

  const onImport = async (f: File) => {
    const res = importData(await f.text());
    emit({ kind: 'toast', tone: res.ok ? 'success' : 'error', title: res.ok ? 'Imported' : 'Import failed', body: res.message });
  };

  const saveKey = () => {
    updateSettings({ aiKey: key.trim() });
    setTesting(null);
    emit({ kind: 'toast', tone: 'success', title: key.trim() ? 'API key saved on this device' : 'API key removed' });
  };

  const test = async () => {
    const k = key.trim();
    if (!k) return;
    setTesting('busy');
    const { testApiKey } = await import('../lib/ai');
    const r = await testApiKey(k);
    setTesting(r.ok ? { ok: true, msg: 'Connected — Mu and AI feedback are ready.' } : { ok: false, msg: r.message });
    if (r.ok && k !== st.aiKey) updateSettings({ aiKey: k });
  };

  return (
    <div className="content narrow">
      <div className="page-head"><div><h1>Settings</h1><p>Everything is stored on this device only.</p></div></div>
      {!isStorageAvailable() && <div className="callout warn mb">Your browser is blocking local storage, so progress won't be saved after you close this tab. Use “Export” to keep a copy.</div>}

      <div className="card">
        <h3>Profile</h3>
        <div className="list">
          <Row title="Your name" desc="Used for greetings only.">
            <input className="input" style={{ width: 220 }} defaultValue={s.name} onBlur={(e) => setName(e.target.value.trim())} aria-label="Your name" placeholder="Optional" />
          </Row>
        </div>
      </div>

      <div className="card mt">
        <h3>Appearance & accessibility</h3>
        <div className="list">
          <Row title="Theme"><Seg options={[{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} value={st.theme} onChange={(v) => updateSettings({ theme: v })} label="Theme" /></Row>
          <Row title="Text size"><Seg options={[{ id: 0.9, label: 'S' }, { id: 1, label: 'M' }, { id: 1.1, label: 'L' }, { id: 1.2, label: 'XL' }]} value={st.fontScale} onChange={(v) => updateSettings({ fontScale: v })} label="Text size" /></Row>
          <Row title="Reduce motion" desc="Turns off confetti and animations."><Toggle checked={st.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} label="Reduce motion" /></Row>
          <Row title="Sound effects" desc="Soft tones for correct answers and milestones."><Toggle checked={st.sound} onChange={(v) => updateSettings({ sound: v })} label="Sound effects" /></Row>
        </div>
      </div>

      <div className="card mt">
        <h3>Study plan</h3>
        <div className="list">
          <Row title="Daily goal" desc="Today's plan is sized to fit this."><Seg options={[10, 20, 30, 45, 60].map((m) => ({ id: m, label: `${m}m` }))} value={st.dailyGoal} onChange={(v) => updateSettings({ dailyGoal: v })} label="Daily goal" /></Row>
          <Row title="Next exam date" desc="Shows a countdown on your dashboard."><input type="date" className="input" style={{ width: 180 }} value={st.examDate} onChange={(e) => updateSettings({ examDate: e.target.value })} aria-label="Exam date" /></Row>
        </div>
      </div>

      <div className="card mt">
        <div className="row" style={{ gap: 12 }}><Mu mood="happy" size={44} /><h3 style={{ margin: 0 }}>Mu, your helper</h3></div>
        <div className="list mt-sm">
          <Row title="Show Mu" desc={<>Floating helper button. Shortcut: <span className="kbd">?</span></>}><Toggle checked={st.mascot} onChange={(v) => updateSettings({ mascot: v })} label="Show Mu" /></Row>
          <Row title="Reactions" desc="Mu pops up with encouragement and tips after answers."><Toggle checked={st.mascotReactions} onChange={(v) => updateSettings({ mascotReactions: v })} label="Mu reactions" /></Row>
        </div>
      </div>

      <div className="card mt">
        <h3><Icon name="sparkles" size={16} /> AI tutor & written-answer feedback</h3>
        <p className="small muted">Add your own Claude API key to let Mu answer open questions and to get detailed AI feedback on Teach It and free-response answers. Without a key, everything still works using offline rubric checks.</p>
        <div className="callout small mb">
          <b>Privacy:</b> the key is saved only in this browser and sent directly to Anthropic's API when you use AI features. It is never included in exported backups. Get a key at console.anthropic.com.
        </div>
        <div className="field">
          <label htmlFor="key">Claude API key</label>
          <div className="row">
            <input id="key" className="input mono" type={showKey ? 'text' : 'password'} value={key} onChange={(e) => { setKey(e.target.value); setTesting(null); }} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} />
            <button className="btn icon" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? 'Hide key' : 'Show key'}><Icon name="eye" size={16} /></button>
          </div>
        </div>
        <div className="row wrap mt-sm">
          <button className="btn primary sm" onClick={saveKey} disabled={key.trim() === st.aiKey}>Save key</button>
          <button className="btn sm" onClick={test} disabled={!key.trim() || testing === 'busy'}>{testing === 'busy' ? <><span className="spinner" /> Testing…</> : 'Test connection'}</button>
          {st.aiKey && <button className="btn ghost sm danger" onClick={() => { setKey(''); updateSettings({ aiKey: '' }); }}>Remove key</button>}
        </div>
        {testing && testing !== 'busy' && <p className="small mt-sm" style={{ color: testing.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 0 }}>{testing.msg}</p>}
        <div className="list mt">
          <Row title="Use AI features" desc="Turn off to always use offline checks, even with a key saved."><Toggle checked={st.aiEnabled} onChange={(v) => updateSettings({ aiEnabled: v })} label="Use AI features" /></Row>
        </div>
      </div>

      <div className="card mt">
        <h3>Your data</h3>
        <div className="list">
          <Row title="Export progress" desc="Download a backup file (JSON)."><button className="btn sm" onClick={download}><Icon name="download" size={14} /> Export</button></Row>
          <Row title="Import progress" desc="Restore from a backup file. This replaces current progress.">
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
            <button className="btn sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Import</button>
          </Row>
          <Row title="Reset everything" desc="Erase all progress on this device. Settings are kept."><button className="btn sm danger" onClick={() => setConfirmReset(true)}><Icon name="trash" size={14} /> Reset</button></Row>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase all progress?">
        <p className="small">This deletes lessons, mastery, mistakes, notes, exams, and streaks on this device. Export a backup first if you might want it back.</p>
        <div className="row">
          <button className="btn danger" onClick={() => { resetAll(); setConfirmReset(false); emit({ kind: 'toast', tone: 'info', title: 'Progress reset' }); }}>Yes, erase it</button>
          <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
