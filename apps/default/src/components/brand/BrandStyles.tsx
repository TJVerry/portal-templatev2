/**
 * Faith Funnels DesignOS brand layer (v3 "Bold Everywhere").
 * Source of truth: D:\CODE\FF DesignOS\DESIGN-SYSTEM.md — change colors there first.
 *
 * Plain CSS under the `.ff` root so it works no matter how the Genesis
 * Tailwind theme is set up. Keep this file identical in the intake and portal apps.
 */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,800;12..96,900&display=swap');

.ff {
  --ff-cream: #F4EFE6;
  --ff-card: #FBF8F2;
  --ff-orange: #E37753;
  --ff-orange-deep: #D5642A;
  --ff-dark: #2A3135;
  --ff-ok: #22C55E;
  --ff-warn: #E23636;
  --ff-muted: #78716C;
  --ff-on-dark-muted: #CDD3D6;
  --ff-line: #E7DECF;
  --ff-shadow-card: 0 10px 30px rgba(42, 49, 53, 0.10);
  --ff-shadow-sm: 0 4px 14px rgba(42, 49, 53, 0.08);
  --ff-shadow-cta: 0 8px 22px rgba(227, 119, 83, 0.40);
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  background: var(--ff-cream);
  color: var(--ff-dark);
  font-size: 17px;
  line-height: 1.5;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}
.ff *, .ff *::before, .ff *::after { box-sizing: border-box; }

/* Full-screen shell: top bar, body, bottom bar. The body scrolls only on tiny phones. */
.ff-shell { height: 100dvh; display: grid; grid-template-rows: auto 1fr auto; }
.ff-body { overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 12px 16px; }
/* Auto margins center the step but never cut off its top when a small phone must scroll. */
.ff-body > * { margin-top: auto; margin-bottom: auto; }
.ff-body-top > * { margin-top: 16px; }
.ff-col { width: 100%; max-width: 640px; }
.ff-col-wide { width: 100%; max-width: 880px; }

/* Top bar + progress */
.ff-top { background: var(--ff-cream); }
.ff-progress { height: 8px; background: var(--ff-line); }
.ff-progress-fill { height: 100%; background: var(--ff-orange); border-radius: 0 9999px 9999px 0; transition: width .45s cubic-bezier(.2,.8,.2,1); }
.ff-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 24px; }
.ff-wordmark { font-weight: 900; font-size: 19px; letter-spacing: -0.02em; color: var(--ff-dark); text-decoration: none; }
.ff-wordmark span { color: var(--ff-orange); }
.ff-logo { display: block; height: 28px; width: auto; }
.ff-count { font-size: 13px; font-weight: 800; letter-spacing: 0.9px; text-transform: uppercase; color: var(--ff-muted); }

/* Type */
.ff-eyebrow { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.9px; text-transform: uppercase; color: var(--ff-orange-deep); background: rgba(227,119,83,.12); padding: 6px 12px; border-radius: 9999px; }
.ff-display { font-weight: 900; letter-spacing: -0.03em; line-height: 0.98; font-size: clamp(40px, 7vw, 64px); margin: 16px 0 0; }
.ff-h1 { font-weight: 900; letter-spacing: -0.03em; line-height: 1; font-size: clamp(30px, 4.4vw, 44px); margin: 10px 0 0; }
.ff-h2 { font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; font-size: 24px; margin: 0; }
.ff-lead { font-size: 19px; color: var(--ff-muted); margin: 8px 0 0; }
.ff-small { font-size: 15px; color: var(--ff-muted); }
.ff-box { background: var(--ff-orange); color: var(--ff-dark); border-radius: 8px; padding: 0 0.12em; box-decoration-break: clone; -webkit-box-decoration-break: clone; }

/* Surfaces */
.ff-card { background: var(--ff-card); border-radius: 16px; box-shadow: var(--ff-shadow-card); padding: 24px 28px; }
.ff-dark { background: var(--ff-dark); color: #fff; background-image: radial-gradient(rgba(227,119,83,.18) 1px, transparent 1px); background-size: 22px 22px; }

/* Fields */
.ff-fields { display: flex; flex-direction: column; gap: 16px; }
.ff-label { display: block; font-weight: 800; font-size: 17px; margin-bottom: 6px; }
.ff-req { color: var(--ff-orange-deep); }
.ff-input, .ff-textarea {
  width: 100%; font: inherit; font-size: 17px; color: var(--ff-dark);
  background: #fff; border: 1.5px solid var(--ff-line); border-radius: 12px; padding: 10px 14px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.ff-textarea { resize: vertical; min-height: 72px; }
.ff-input::placeholder, .ff-textarea::placeholder { color: #A8A29E; }
.ff-input:focus, .ff-textarea:focus { outline: none; border-color: var(--ff-orange); box-shadow: 0 0 0 4px rgba(227,119,83,.18); }
.ff-input::file-selector-button { font: inherit; font-weight: 800; font-size: 15px; margin-right: 12px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--ff-dark); background: transparent; color: var(--ff-dark); cursor: pointer; }
.ff-input::file-selector-button:hover { background: var(--ff-dark); color: #fff; }
.ff-help { font-size: 15px; color: var(--ff-muted); margin-top: 6px; }
.ff-error { color: var(--ff-warn); font-size: 15px; font-weight: 800; }

/* Buttons */
.ff-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font: inherit; font-weight: 800; font-size: 17px; line-height: 1; cursor: pointer; text-decoration: none;
  border-radius: 8px; padding: 14px 22px; border: 1px solid transparent;
  transition: background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease;
}
.ff-btn svg { width: 18px; height: 18px; }
.ff-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
.ff-btn-primary { background: var(--ff-orange); color: #fff; }
.ff-btn-primary:hover:not(:disabled) { background: var(--ff-orange-deep); transform: translateY(-2px); box-shadow: var(--ff-shadow-cta); }
.ff-btn-secondary { background: transparent; color: var(--ff-dark); border-color: var(--ff-dark); }
.ff-btn-secondary:hover:not(:disabled) { background: var(--ff-dark); color: #fff; }
.ff-btn-ghost { background: transparent; color: var(--ff-muted); padding: 10px 12px; }
.ff-btn-ghost:hover:not(:disabled) { color: var(--ff-dark); }
.ff-btn-sm { font-size: 15px; padding: 10px 16px; }
.ff-btn:focus-visible, .ff-link:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 3px; }

/* Bottom bar */
.ff-bottom { border-top: 1px solid var(--ff-line); background: var(--ff-cream); }
.ff-bottom-inner { max-width: 640px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; }

/* Tags */
.ff-tag { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; border-radius: 8px; padding: 4px 10px; background: var(--ff-cream); color: var(--ff-dark); border: 1px solid var(--ff-line); }
.ff-tag-hot { background: var(--ff-dark); color: #fff; border-color: var(--ff-dark); }
.ff-tag-ok { background: rgba(34,197,94,.14); color: #15803D; border-color: transparent; }
.ff-tag-warn { background: rgba(226,54,54,.12); color: #B91C1C; border-color: transparent; }

.ff-link { color: var(--ff-orange-deep); font-weight: 800; text-decoration: none; }
.ff-link:hover { text-decoration: underline; text-underline-offset: 4px; }

/* List items (portal rows) */
.ff-stack { display: flex; flex-direction: column; gap: 12px; }
.ff-item { background: var(--ff-card); border-radius: 16px; box-shadow: var(--ff-shadow-sm); padding: 20px 24px; }
.ff-item-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.ff-item-title { font-weight: 800; font-size: 19px; letter-spacing: -0.02em; margin: 0; }
.ff-item-meta { font-size: 15px; color: var(--ff-muted); margin: 4px 0 0; }
.ff-item-body { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
.ff-row-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ff-empty { text-align: center; color: var(--ff-muted); padding: 40px 24px; }

/* Motion */
@keyframes ff-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.ff-enter { animation: ff-rise .38s cubic-bezier(.2,.8,.2,1) both; }
.ff-lift { transition: transform .18s ease, box-shadow .18s ease; }
.ff-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(42,49,53,.14); }
@keyframes ff-spin { to { transform: rotate(360deg); } }
.ff-spin { animation: ff-spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .ff-enter, .ff-spin { animation: none; }
  .ff-lift, .ff-btn, .ff-progress-fill { transition: none; }
}

/* Short laptop screens: shrink headlines so each step still fits without scrolling. */
@media (max-height: 760px) {
  .ff-display { font-size: clamp(36px, 5vw, 48px); margin-top: 10px; }
  .ff-h1 { font-size: clamp(28px, 3.6vw, 36px); }
  .ff-topbar { padding-top: 10px; padding-bottom: 10px; }
}

@media (max-width: 640px) {
  .ff-card { padding: 20px; }
  .ff-topbar { padding: 12px 16px; }
}
`;

/** Mount once at the app root, then wrap the app in `<div className="ff">`. */
export function BrandStyles() {
  return <style>{CSS}</style>;
}
