/**
 * Portal-only styles on top of BrandStyles (DesignOS v3): tabs, the onboarding interview,
 * and the Home dashboard. Solid surfaces, one orange accent, big type, big tap targets.
 */
const CSS = `
.ff-tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-top: 24px; padding: 4px; background: var(--ff-card);
  border-radius: 12px; box-shadow: var(--ff-shadow-sm); }
.ff-tab { font: inherit; font-weight: 800; font-size: 16px; border: 0; cursor: pointer; border-radius: 8px;
  padding: 10px 18px; background: transparent; color: var(--ff-muted); transition: background .18s ease, color .18s ease; }
.ff-tab:hover { color: var(--ff-dark); }
.ff-tab[aria-selected='true'] { background: var(--ff-dark); color: #fff; }
.ff-tab:focus-visible, .ob-option:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }

/* Onboarding interview */
.ob { padding-bottom: 96px; }
.ob-steps { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 32px; }
.ob-step { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; color: var(--ff-muted); }
.ob-step-num { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 28px; height: 28px;
  border-radius: 9999px; background: var(--ff-line); color: var(--ff-dark); font-weight: 800; font-size: 14px; }
.ob-step-num svg { width: 16px; height: 16px; }
.ob-step-now { color: var(--ff-dark); }
.ob-step-now .ob-step-num { background: var(--ff-orange); color: #fff; }
.ob-step-done .ob-step-num { background: var(--ff-dark); color: #fff; }
.ob-save { margin-left: auto; font-size: 13px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--ff-muted); }
.ob-q { font-size: clamp(28px, 4vw, 40px); }
.ob-optional { font-size: 15px; font-weight: 800; letter-spacing: 0; color: var(--ff-muted); vertical-align: middle; }
.ob-why { margin: 12px 0 0; padding: 12px 16px; border-left: 4px solid var(--ff-orange); background: var(--ff-card); border-radius: 0 12px 12px 0; color: var(--ff-dark); font-size: 17px; }
.ob-input { font-size: 19px; padding: 14px 16px; }
.ob-options { display: flex; flex-direction: column; gap: 10px; }
.ob-options-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.ob-option { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; font: inherit; font-size: 18px; font-weight: 800;
  color: var(--ff-dark); background: var(--ff-card); border: 2px solid var(--ff-line); border-radius: 12px; padding: 16px 18px; cursor: pointer;
  transition: border-color .18s ease, transform .18s ease; }
.ob-option:hover { border-color: var(--ff-orange); transform: translateY(-1px); }
.ob-option[aria-checked='true'] { border-color: var(--ff-orange); box-shadow: 0 0 0 3px rgba(227,119,83,.18); }
.ob-dot { width: 22px; height: 22px; flex-shrink: 0; border-radius: 9999px; border: 2px solid var(--ff-line); background: #fff; }
.ob-option[aria-checked='true'] .ob-dot { border: 7px solid var(--ff-orange); }
.ob-check { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; border-radius: 8px;
  border: 2px solid var(--ff-line); background: #fff; color: #fff; }
.ob-check svg { width: 16px; height: 16px; }
.ob-option[aria-checked='true'] .ob-check { background: var(--ff-orange); border-color: var(--ff-orange); }
.ob-drop { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 32px 16px; border: 2px dashed var(--ff-line);
  border-radius: 16px; background: var(--ff-card); font-weight: 800; cursor: pointer; transition: border-color .18s ease; }
.ob-drop:hover { border-color: var(--ff-orange); }
.ob-drop svg { width: 22px; height: 22px; color: var(--ff-orange-deep); }
.ob-drop-busy { cursor: wait; }
.ob-file { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ob-uploaded { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 800; }
.ob-uploaded svg { width: 18px; height: 18px; color: #15803D; }
.ob-plan { list-style: none; padding: 0; margin: 32px 0; display: flex; flex-direction: column; gap: 16px; }
.ob-plan li { display: flex; gap: 14px; align-items: flex-start; }
.ob-cta { font-size: 19px; padding: 16px 28px; }
.ob-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px max(16px, calc((100vw - 640px) / 2)); background: var(--ff-cream); border-top: 1px solid var(--ff-line); }
.ob-pct { font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-muted); }
.ob-review { margin: 12px 0 0; }
.ob-review-row { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 12px 0; border-top: 1px solid var(--ff-line); }
.ob-review-row dt { grid-column: 1; font-size: 15px; color: var(--ff-muted); }
.ob-review-row dd { grid-column: 1; margin: 0; font-weight: 800; white-space: pre-wrap; overflow-wrap: anywhere; }
.ob-review-row button { grid-column: 2; grid-row: 1 / span 2; align-self: center; }
.ob-missing { color: var(--ff-warn); }

/* Home dashboard */
.home-next { border-radius: 16px; padding: 28px; box-shadow: var(--ff-shadow-card); }
.home-next .ff-eyebrow { background: rgba(227,119,83,.2); color: #fff; }
.home-done { display: flex; gap: 14px; align-items: center; }
.home-done > svg { width: 32px; height: 32px; flex-shrink: 0; color: #15803D; }
.home-stepper { list-style: none; padding: 0; margin: 16px 0 4px; display: grid; grid-template-columns: repeat(5, 1fr); }
.home-stepper li { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.home-stepper li:not(:first-child)::before { content: ''; position: absolute; top: 11px; right: 50%; width: 100%; height: 3px; background: var(--ff-line); z-index: 0; }
.home-stepper li.is-done:not(:first-child)::before, .home-stepper li.is-now:not(:first-child)::before { background: var(--ff-orange); }
.home-stepper-dot { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
  border-radius: 9999px; background: var(--ff-line); color: #fff; }
.home-stepper-dot svg { width: 14px; height: 14px; }
.home-stepper li.is-done .home-stepper-dot { background: var(--ff-orange); }
.home-stepper li.is-now .home-stepper-dot { background: #fff; border: 6px solid var(--ff-orange); }
.home-stepper-label { font-size: 13px; font-weight: 800; color: var(--ff-muted); }
.home-stepper li.is-now .home-stepper-label { color: var(--ff-dark); }
.home-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.home-count { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; padding: 0 8px; margin-left: 6px;
  border-radius: 9999px; background: var(--ff-orange); color: #fff; font-size: 14px; vertical-align: middle; }
.home-list { margin: 12px 0 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.home-list-btn { background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; }
.home-checklist { list-style: none; padding: 0; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
.home-checklist li { display: flex; gap: 10px; align-items: flex-start; }
.home-checklist .ob-check { background: var(--ff-orange); border-color: var(--ff-orange); }
/* Height is set from the calendar's own size messages, so it never scrolls inside the page. 720px is the fallback. */
.home-calendar { display: block; width: 100%; height: 720px; margin-top: 16px; border: 0; border-radius: 12px; background: #fff; overflow: hidden; }

/* Service card on Home: the whole card opens the service. Links sit above the click layer. */
.home-service { position: relative; cursor: pointer; }
.home-service-open { position: absolute; inset: 0; z-index: 1; border: 0; padding: 0; background: transparent; border-radius: 16px; cursor: pointer; }
.home-service-open:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.home-service .ff-row-actions { position: relative; z-index: 2; }
.home-service-cta { margin: 14px 0 0; font-size: 15px; color: var(--ff-muted); }
.home-service-cta .ff-link { display: inline-flex; align-items: center; gap: 4px; }
.home-service-cta svg { width: 16px; height: 16px; transition: transform .18s ease; }
.home-service:hover .home-service-cta svg { transform: translateX(3px); }

/* Service page: milestones board */
.ff-col-wide.pt-wide { max-width: 1280px; }
.sv-back { align-self: flex-start; }
.sv-back svg { width: 18px; height: 18px; }
.sv-link { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; }
.sv-link svg { width: 14px; height: 14px; }
.sv-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.sv-toggle { display: inline-flex; gap: 2px; padding: 4px; background: var(--ff-card); border-radius: 12px; box-shadow: var(--ff-shadow-sm); }
.sv-toggle button { font: inherit; font-weight: 800; font-size: 15px; border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer;
  background: transparent; color: var(--ff-muted); }
.sv-toggle button[aria-pressed='true'] { background: var(--ff-dark); color: #fff; }
.sv-toggle button:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.kb { display: flex; gap: 12px; align-items: flex-start; overflow-x: auto; scroll-snap-type: x proximity; padding: 2px 2px 12px;
  margin: 0 -2px; -webkit-overflow-scrolling: touch; }
.kb-col { position: relative; flex: 0 0 var(--kb-col-w, 280px); scroll-snap-align: start; display: flex; flex-direction: column; gap: 10px; padding: 14px;
  border-radius: 16px; background: rgba(231,222,207,.55); border: 2px solid transparent; }
/* Board drag bars. Edge bars pull the board out past the page column. Column bars set the column width.
   Drag them, or focus one and use the arrow keys. Double-click resets. */
.kb-wrap { position: relative; margin-inline: calc(var(--kb-extra, 0px) / -2); }
.kb-stretching, .kb-resizing { cursor: col-resize; user-select: none; }
.kb-stretching .kb, .kb-resizing { scroll-snap-type: none; }
.kb-edge { position: absolute; top: 0; bottom: 12px; width: 14px; display: flex; align-items: center; justify-content: center;
  cursor: col-resize; touch-action: none; z-index: 2; border-radius: 9999px; }
.kb-edge-left { left: -15px; }
.kb-edge-right { right: -15px; }
.kb-edge > span { width: 5px; height: 48px; border-radius: 9999px; background: var(--ff-line); transition: background .15s, height .15s; }
.kb-edge:hover > span, .kb-edge:focus-visible > span, .kb-stretching .kb-edge > span { background: var(--ff-orange); height: 72px; }
.kb-edge:focus-visible { outline: none; }
.kb-resize { position: absolute; top: 12px; bottom: 12px; right: -9px; width: 6px; border-radius: 9999px; cursor: col-resize;
  touch-action: none; background: transparent; transition: background .15s; z-index: 1; }
.kb-resize::before { content: ''; position: absolute; inset: 0 -5px; }
.kb-col:hover .kb-resize { background: var(--ff-line); }
.kb-resize:hover, .kb-resizing .kb-resize, .kb-resize:focus-visible { background: var(--ff-orange); outline: none; }
/* Soft fade on a board edge when more columns sit past it (no hard cut-off line). */
.kb { --fade-l: 0px; --fade-r: 0px;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%); }
.kb-fade-l { --fade-l: 48px; }
.kb-fade-r { --fade-r: 48px; }
/* Status board colors: Backlog grey, To Do blue, In Progress yellow, Waiting purple, Done green. */
.kb-st { background: var(--kb-tint); box-shadow: inset 0 4px 0 var(--kb-tone); }
.kb-st .kb-head-text::before { content: ''; width: 10px; height: 10px; flex-shrink: 0; border-radius: 9999px; background: var(--kb-tone); }
.kb-st .kb-count { background: var(--kb-tone); color: #fff; }
.kb-st-grey { --kb-tone: #6B7280; --kb-tint: rgba(107,114,128,.12); }
.kb-st-blue { --kb-tone: #2563EB; --kb-tint: rgba(37,99,235,.10); }
.kb-st-yellow { --kb-tone: #CA8A04; --kb-tint: rgba(234,179,8,.16); }
.kb-st-purple { --kb-tone: #7C3AED; --kb-tint: rgba(124,58,237,.10); }
.kb-st-green { --kb-tone: #16A34A; --kb-tint: rgba(34,197,94,.12); }
.kb-col-done { border-color: rgba(34,197,94,.35); }
/* Admin drag and drop on the Status board. */
.kb-hint { margin: -4px 0 0; color: var(--ff-muted); }
.kb-drag { cursor: grab; }
.kb-drag:active { cursor: grabbing; }
.kb-dragging { opacity: .45; }
.kb-saving { opacity: .7; pointer-events: none; }
.kb-drop { border-color: var(--ff-orange); border-style: dashed; }
.kb-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kb-title { display: block; margin: 0; font-weight: 800; font-size: 17px; letter-spacing: -0.01em; line-height: 1.25; }
.kb-count { flex-shrink: 0; font-size: 13px; font-weight: 800; letter-spacing: .6px; color: var(--ff-muted); background: var(--ff-card);
  border-radius: 9999px; padding: 3px 10px; }
.kb-col-done .kb-count { background: rgba(34,197,94,.14); color: #15803D; }
.kb-bar { height: 6px; border-radius: 9999px; background: var(--ff-card); overflow: hidden; }
.kb-bar > span { display: block; height: 100%; border-radius: 9999px; background: var(--ff-orange); transition: width .45s cubic-bezier(.2,.8,.2,1); }
.kb-col-done .kb-bar > span { background: var(--ff-ok); }
.kb-cards { display: flex; flex-direction: column; gap: 8px; }
.kb-card { padding: 14px 16px; border-radius: 12px; }
.kb-card .ff-item-title { font-size: 16px; }
.kb-card .ff-item-head { align-items: flex-start; }
.kb-card .ff-tag { font-size: 11px; padding: 3px 8px; }
.kb-card .ff-item-meta { font-size: 14px; }
.kb-card .ff-item-body { margin-top: 10px; gap: 10px; }
.kb-empty { margin: 0; padding: 12px; text-align: center; font-size: 14px; color: var(--ff-muted); border: 2px dashed var(--ff-line); border-radius: 12px; }

/* Progress */
.ob-progress { display: flex; align-items: center; gap: 12px; margin: -16px 0 32px; }
.ob-bigbar { flex: 1; height: 12px; border-radius: 9999px; background: var(--ff-line); overflow: hidden; }
.ob-bigbar > span { display: block; height: 100%; border-radius: 9999px; background: var(--ff-orange); transition: width .45s cubic-bezier(.2,.8,.2,1); }
.ob-progress-text { font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-orange-deep); white-space: nowrap; }
.ob-pct { display: inline-flex; align-items: center; gap: 8px; }
.ob-minibar { display: inline-block; width: 80px; height: 6px; border-radius: 9999px; background: var(--ff-line); overflow: hidden; }
.ob-minibar > span { display: block; height: 100%; background: var(--ff-orange); border-radius: 9999px; }

/* Grouped questions (max 5 per page) */
.ob-fields { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.ob-field { display: flex; flex-direction: column; gap: 10px; background: var(--ff-card); border-radius: 16px; box-shadow: var(--ff-shadow-sm);
  padding: 20px 24px; border: 2px solid transparent; }
.ob-field-missing { border-color: var(--ff-warn); }
.ob-label { font-weight: 800; font-size: 20px; letter-spacing: -0.01em; line-height: 1.25; }
.ob-field .ob-why { margin: 0; }
.ob-field .ob-option, .ob-field .ob-drop { background: #fff; }

/* Chips (tap to pick) */
.ob-chipgroups { display: flex; flex-direction: column; gap: 14px; }
.ob-chipgroup { display: flex; flex-direction: column; gap: 8px; }
.ob-chipgroup-label { font-size: 13px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--ff-muted); }
.ob-chipgroup-label:empty { display: none; }
.ob-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ob-chip { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 16px; font-weight: 800; color: var(--ff-dark);
  background: #fff; border: 2px solid var(--ff-line); border-radius: 8px; padding: 8px 14px; cursor: pointer;
  transition: border-color .18s ease, background .18s ease, color .18s ease; }
.ob-chip:hover { border-color: var(--ff-orange); }
.ob-chip:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.ob-chip[aria-checked='true'] { background: var(--ff-orange); border-color: var(--ff-orange); color: #fff; }
.ob-chip svg { width: 16px; height: 16px; }

/* Row tables (service times, teammates) */
.ob-rows { display: flex; flex-direction: column; gap: 8px; }
.ob-rows-head, .ob-row { display: grid; gap: 8px; align-items: center; }
.ob-rows-head span { font-size: 13px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--ff-muted); }
.ob-row { background: #fff; border: 1.5px solid var(--ff-line); border-radius: 12px; padding: 8px; }
.ob-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ob-cell-label { display: none; font-size: 13px; font-weight: 800; color: var(--ff-muted); }
.ob-cell .ff-input { padding: 10px 12px; font-size: 16px; min-width: 0; }
.ob-row-remove { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0; border-radius: 8px;
  background: transparent; color: var(--ff-muted); cursor: pointer; }
.ob-row-remove:hover { background: var(--ff-cream); color: var(--ff-warn); }
.ob-row-remove svg { width: 18px; height: 18px; }
.ob-rows-add { align-self: flex-start; }
.ob-rows-add svg { width: 16px; height: 16px; }

/* Address suggestions */
.ob-address { position: relative; }
.ob-suggest { list-style: none; margin: 6px 0 0; padding: 6px; position: absolute; left: 0; right: 0; z-index: 20; background: #fff;
  border: 1.5px solid var(--ff-line); border-radius: 12px; box-shadow: var(--ff-shadow-card); }
.ob-suggest button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; font: inherit; font-size: 16px; color: var(--ff-dark);
  background: transparent; border: 0; border-radius: 8px; padding: 10px 12px; cursor: pointer; }
.ob-suggest button:hover, .ob-suggest li[aria-selected='true'] button { background: var(--ff-cream); }
.ob-suggest svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--ff-orange-deep); }

/* Section intro */
.ob-intro-card { margin-top: 32px; }
.ob-intro-list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 12px; }
.ob-intro-list li { display: flex; gap: 12px; align-items: flex-start; font-size: 17px; }
.ob-intro-list li.is-done { color: var(--ff-muted); }
.ob-intro-list li.is-done .ob-step-num { background: var(--ff-dark); color: #fff; }

/* Menu */
.pp-menu-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 8px; }
.pp-menu-btn svg { width: 24px; height: 24px; }
.dr-root { position: fixed; inset: 0; z-index: 50; }
.dr-backdrop { position: absolute; inset: 0; border: 0; padding: 0; background: rgba(42,49,53,.55); cursor: pointer;
  animation: dr-fade .22s ease; transition: opacity .2s ease; }
.dr-panel { position: absolute; top: 0; left: 0; bottom: 0; width: min(360px, 86vw); height: 100vh; height: 100dvh;
  overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y;
  background: var(--ff-cream); box-shadow: var(--ff-shadow-card); outline: none;
  padding: 0 16px calc(16px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
  display: flex; flex-direction: column; gap: 16px;
  animation: dr-in .22s cubic-bezier(.2,.8,.2,1); transition: transform .2s cubic-bezier(.4,0,.2,1); }
.dr-closing { pointer-events: none; }
.dr-closing .dr-backdrop { opacity: 0; }
.dr-closing .dr-panel { transform: translateX(-100%); }
@keyframes dr-in { from { transform: translateX(-100%); } to { transform: none; } }
@keyframes dr-fade { from { opacity: 0; } to { opacity: 1; } }
.dr-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin: 0 -4px; padding: calc(12px + env(safe-area-inset-top, 0px)) 4px 8px; background: var(--ff-cream); }
.dr-head .ff-count { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dr-close { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0; margin-right: -8px; }
.dr-close svg { width: 22px; height: 22px; }
.dr-progress { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--ff-card); border-radius: 16px; }
.dr-group { display: flex; flex-direction: column; gap: 4px; }
.dr-group:last-child { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--ff-line); }
.dr-group-label { font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-muted); padding: 0 8px 4px; }
.dr-item { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; text-align: left; font: inherit; color: var(--ff-dark);
  background: transparent; border: 0; border-radius: 12px; padding: 12px; cursor: pointer; transition: background .18s ease; }
@media (hover: hover) { .dr-item:hover { background: var(--ff-card); } }
.dr-item:active { background: var(--ff-line); }
.dr-item:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.dr-item-now { background: var(--ff-card); box-shadow: inset 4px 0 0 var(--ff-orange); }
.dr-item-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 9999px; background: var(--ff-line); color: var(--ff-dark); }
.dr-item-icon svg { width: 16px; height: 16px; }
.dr-item-done .dr-item-icon { background: var(--ff-dark); color: #fff; }
.dr-item-now .dr-item-icon { background: var(--ff-orange); color: #fff; }
.dr-item-text { min-width: 0; }
.dr-item-label { display: block; font-weight: 800; font-size: 17px; }
.dr-item-meta { display: block; font-size: 14px; color: var(--ff-muted); overflow-wrap: anywhere; }
@media (prefers-reduced-motion: reduce) { .dr-panel, .dr-backdrop { animation: none; transition: none; } }

/* Portal menu: one component, two homes. Desktop = sidebar (.pp-side), tablet + phone = Drawer. */
.pp-shell { grid-template-rows: auto 1fr; }
.pp-shell-nav { grid-template-rows: auto 1fr auto; }
.pp-side { display: none; }
.pp-panel { margin-top: 24px; }
.pn { display: flex; flex-direction: column; gap: 20px; flex: 1 0 auto; }
.pn-brand { display: flex; flex-direction: column; gap: 12px; padding: 0 12px 4px; }
.pn-church { font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pn-group { display: flex; flex-direction: column; gap: 2px; }
.pn-label { font-size: 12px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-muted); padding: 0 12px 6px; }
.pn-item { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 8px 12px; text-align: left;
  font: inherit; font-weight: 800; font-size: 16px; color: var(--ff-dark); background: transparent; border: 0; border-radius: 12px;
  cursor: pointer; transition: background .18s ease, color .18s ease; }
@media (hover: hover) { .pn-item:hover, .pn-me:hover { background: rgba(231,222,207,.6); } }
.pn-item:active, .pn-me:active { background: var(--ff-line); }
.pn-item[aria-current='page'] { background: var(--ff-dark); color: #fff; }
.pn-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 10px; background: rgba(227,119,83,.12); color: var(--ff-orange-deep); transition: background .18s ease, color .18s ease; }
.pn-icon svg { width: 18px; height: 18px; }
.pn-item[aria-current='page'] .pn-icon { background: var(--ff-orange); color: #fff; }
.pn-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pn-item[aria-current='page'] .pp-badge { background: #fff; color: var(--ff-dark); }
.pn-dot { width: 10px; height: 10px; flex-shrink: 0; margin-right: 6px; border-radius: 9999px; background: var(--ff-orange); }
.pn-foot { margin-top: auto; display: flex; align-items: center; gap: 4px; padding-top: 12px; border-top: 1px solid var(--ff-line); }
.pn-me { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; padding: 8px; text-align: left; font: inherit;
  color: var(--ff-dark); background: transparent; border: 0; border-radius: 12px; cursor: pointer; transition: background .18s ease; }
.pn-me[aria-current='page'] { background: rgba(227,119,83,.12); }
.pn-avatar, .pp-avatar-btn, .pf-avatar { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  border-radius: 9999px; background: var(--ff-orange); color: #fff; font-weight: 800; letter-spacing: .02em; }
.pn-avatar { width: 40px; height: 40px; font-size: 15px; }
.pn-me-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.pn-me-name { font-weight: 800; font-size: 15px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pn-me-email { font-size: 13px; color: var(--ff-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pn-me-chevron { width: 16px; height: 16px; flex-shrink: 0; color: var(--ff-muted); }
.pn-signout { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0;
  border: 0; border-radius: 12px; background: transparent; color: var(--ff-muted); cursor: pointer; transition: background .18s ease, color .18s ease; }
.pn-signout svg { width: 20px; height: 20px; }
.pn-signout:hover { background: rgba(226,54,54,.1); color: var(--ff-warn); }
.pp-avatar-btn { width: 44px; height: 44px; font-size: 15px; font-family: inherit; border: 0; cursor: pointer;
  box-shadow: 0 0 0 0 transparent; transition: box-shadow .18s ease; }
.pp-avatar-btn:hover, .pp-avatar-btn[aria-current='page'] { box-shadow: 0 0 0 3px rgba(227,119,83,.3); }
.pn-item:focus-visible, .pn-me:focus-visible, .pn-signout:focus-visible, .pp-avatar-btn:focus-visible, .pf-link:focus-visible {
  outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.dr-panel .pn { flex: 1 0 auto; }
@media (prefers-reduced-motion: reduce) { .pn-item, .pn-icon, .pn-me, .pn-signout, .pp-avatar-btn { transition: none; } }

/* Desktop sidebar: collapse button and the folded icon rail */
.pn-item { position: relative; }
.pn-brand-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; }
.pn-collapse { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex-shrink: 0; margin-right: -8px;
  border: 0; border-radius: 10px; background: transparent; color: var(--ff-muted); cursor: pointer; transition: background .18s ease, color .18s ease; }
.pn-collapse svg { width: 20px; height: 20px; }
.pn-collapse:hover { background: rgba(231,222,207,.6); color: var(--ff-dark); }
.pn-collapse:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.pn-collapsed { gap: 16px; }
.pn-collapsed .pn-logo, .pn-collapsed .pn-church, .pn-collapsed .pn-text, .pn-collapsed .pn-me-text, .pn-collapsed .pn-me-chevron { display: none; }
.pn-collapsed .pn-brand { padding: 0; }
.pn-collapsed .pn-brand-row { justify-content: center; }
.pn-collapsed .pn-collapse { margin-right: 0; }
.pn-collapsed .pn-label { height: 1px; padding: 0; margin: 0 10px 6px; overflow: hidden; font-size: 0; background: var(--ff-line); }
.pn-collapsed .pn-item { justify-content: center; padding: 8px; }
.pn-collapsed .pp-badge { position: absolute; top: 2px; right: 4px; min-width: 18px; height: 18px; padding: 0 4px; font-size: 11px; border: 2px solid var(--ff-card); }
.pn-collapsed .pn-dot { position: absolute; top: 6px; right: 10px; margin: 0; border: 2px solid var(--ff-card); width: 12px; height: 12px; }
.pn-collapsed .pn-foot { flex-direction: column; gap: 6px; }
.pn-collapsed .pn-me { flex: none; justify-content: center; padding: 4px; }
@media (prefers-reduced-motion: reduce) { .pn-collapse { transition: none; } }

/* Profile */
.pf-me { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 4px 20px; }
.pf-avatar { width: 72px; height: 72px; font-size: 26px; }
.pf-me-text { min-width: 0; }
.pf-email { margin: 4px 0 0; overflow-wrap: anywhere; }
.pf-church { margin: 2px 0 0; }
.pf-me-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.pf-note { grid-column: 1 / -1; margin: 12px 0 0; }
.pf-group { border: 0; padding: 0; margin: 24px 0 0; min-width: 0; }
.pf-legend { padding: 0; margin-bottom: 12px; font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-orange-deep); }
.pf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.pf-wide { grid-column: 1 / -1; }
.pf-save { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 24px; }
.pf-saved { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: #15803D; }
.pf-saved svg { width: 18px; height: 18px; }
.pf-row { display: flex; gap: 14px; align-items: flex-start; }
.pf-row-icon { width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; color: var(--ff-orange-deep); }
.pf-link { display: flex; align-items: center; gap: 14px; width: 100%; border: 0; text-align: left; font: inherit; color: var(--ff-dark); cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease; }
@media (hover: hover) { .pf-link:hover { transform: translateY(-2px); box-shadow: var(--ff-shadow-card); } }
.pf-link .pf-row-icon { margin-top: 0; }
.pn-avatar, .pp-avatar-btn, .pf-avatar { overflow: hidden; }
.pp-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-photo { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; margin-top: 20px; }
.pf-photo .pf-avatar { width: 88px; height: 88px; font-size: 30px; }
.pf-photo label.ff-btn { position: relative; cursor: pointer; }
.pf-busy { opacity: .55; cursor: wait !important; }
@media (max-width: 560px) { .pf-grid { grid-template-columns: 1fr; } }

/* Files: media library */
.ml-bar { display: flex; flex-direction: column; gap: 14px; }
.ml-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
.ml-crumb-wrap { display: inline-flex; align-items: center; gap: 2px; }
.ml-crumb { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-weight: 800; font-size: 17px; color: var(--ff-muted);
  background: transparent; border: 2px solid transparent; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.ml-crumb svg { width: 18px; height: 18px; }
.ml-crumb:hover { color: var(--ff-dark); background: var(--ff-cream); }
.ml-crumb[aria-current='page'], .ml-crumb-static { color: var(--ff-dark); cursor: default; }
.ml-crumb:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.ml-crumb-sep { width: 16px; height: 16px; color: var(--ff-muted); flex-shrink: 0; }
.ml-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ml-search { position: relative; flex: 1 1 220px; min-width: 0; }
.ml-search svg { position: absolute; left: 14px; top: 50%; width: 18px; height: 18px; transform: translateY(-50%); color: var(--ff-muted); pointer-events: none; }
.ml-search .ff-input { padding-left: 42px; }
.ml-toggle { display: inline-flex; gap: 2px; padding: 3px; background: var(--ff-cream); border-radius: 10px; }
.ml-toggle button { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 0; border-radius: 8px;
  background: transparent; color: var(--ff-muted); cursor: pointer; }
.ml-toggle button svg { width: 18px; height: 18px; }
.ml-toggle button[aria-pressed='true'] { background: var(--ff-dark); color: #fff; }
.ml-toggle button:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.ml-tools label.ff-btn { position: relative; cursor: pointer; }
.ml-disabled { opacity: .55; cursor: wait !important; }
.ml-inline { display: flex; align-items: center; gap: 8px; }
.ml-inline .ff-input { flex: 1; min-width: 0; }
.ml-inline-icon { width: 22px; height: 22px; flex-shrink: 0; color: var(--ff-orange-deep); }
.ml-inline-tight { margin-top: 8px; }
.ml-inline-tight .ff-input { padding: 8px 10px; font-size: 15px; }
.ml-confirm { flex: 1; font-weight: 800; font-size: 15px; }
.ml-danger { background: var(--ff-warn); }
.ml-danger:hover:not(:disabled) { background: #B91C1C; box-shadow: none; }
.ml-uploads { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.ml-upload { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 15px; }
.ml-upload svg { width: 16px; height: 16px; flex-shrink: 0; }
.ml-upload-done svg { color: #15803D; }
.ml-upload-error svg, .ml-upload-error { color: var(--ff-warn); }
.ml-upload-name { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
.ml-area { display: flex; flex-direction: column; gap: 20px; min-height: 220px; border-radius: 16px; border: 2px dashed transparent;
  transition: border-color .18s ease, background .18s ease; }
.ml-area.ml-drop { border-color: var(--ff-orange); background: rgba(227,119,83,.06); }
.ml-section { margin: 0 0 10px; }
.ml-folders { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.ml-folder { display: flex; align-items: center; gap: 4px; background: var(--ff-card); border-radius: 12px; box-shadow: var(--ff-shadow-sm);
  padding: 6px 6px 6px 4px; border: 2px solid transparent; min-width: 0; }
.ml-folder > .ml-inline { flex: 1; margin: 0; padding-left: 8px; }
.ml-folder.ml-drop, .ml-crumb.ml-drop { border-color: var(--ff-orange); background: rgba(227,119,83,.1); }
.ml-folder-open { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; font: inherit; text-align: left; color: var(--ff-dark);
  background: transparent; border: 0; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
.ml-folder-open:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.ml-folder-icon { width: 28px; height: 28px; flex-shrink: 0; color: var(--ff-orange); fill: rgba(227,119,83,.18); }
.ml-folder-text { display: flex; flex-direction: column; min-width: 0; }
.ml-name { display: block; margin: 0; font-weight: 800; font-size: 16px; color: var(--ff-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ml-meta { display: block; margin: 2px 0 0; font-size: 14px; color: var(--ff-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ml-actions { display: inline-flex; gap: 2px; flex-shrink: 0; }
.ml-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 0; border-radius: 8px;
  background: transparent; color: var(--ff-muted); cursor: pointer; text-decoration: none; }
.ml-icon-btn svg { width: 17px; height: 17px; }
.ml-icon-btn:hover:not(:disabled) { background: var(--ff-cream); color: var(--ff-dark); }
.ml-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.ml-icon-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 1px; }
.ml-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.ml-list { display: flex; flex-direction: column; gap: 8px; }
.ml-file { position: relative; background: var(--ff-card); border-radius: 12px; box-shadow: var(--ff-shadow-sm); overflow: hidden; min-width: 0; }
.ml-file[draggable='true'] { cursor: grab; }
.ml-file-grid { display: flex; flex-direction: column; }
.ml-file-grid .ml-file-body { padding: 10px 12px 12px; }
.ml-file-grid .ml-actions { padding: 0 8px 8px; }
.ml-file-list { display: flex; align-items: center; gap: 12px; padding: 8px; }
.ml-file-list .ml-file-body { flex: 1; min-width: 0; }
.ml-thumb { display: flex; align-items: center; justify-content: center; background: var(--ff-cream); color: var(--ff-orange-deep); overflow: hidden; }
.ml-file-grid .ml-thumb { aspect-ratio: 4 / 3; }
.ml-file-list .ml-thumb { width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; }
.ml-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ml-thumb-icon { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ml-thumb-icon svg { width: 36px; height: 36px; }
.ml-file-list .ml-thumb-icon svg { width: 24px; height: 24px; }
.ml-ext { font-size: 12px; font-weight: 800; letter-spacing: .6px; color: var(--ff-muted); }
.ml-file-list .ml-ext { display: none; }
.ml-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; flex: 1; padding: 48px 16px;
  text-align: center; color: var(--ff-muted); border: 2px dashed var(--ff-line); border-radius: 16px; }
.ml-empty > svg { width: 32px; height: 32px; color: var(--ff-orange); margin-bottom: 6px; }
.ml-empty p { margin: 0; }

/* Header, tabs and the phone tab bar */
.pp-top-actions { display: flex; align-items: center; gap: 8px; }
.ff-tab { display: inline-flex; align-items: center; gap: 8px; }
.pp-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px;
  border-radius: 9999px; background: var(--ff-orange); color: #fff; font-size: 13px; }
.pp-page-title { display: none; }
.pp-tabbar { display: none; }

/* Task cards */
.tk-head { align-items: flex-start; flex-wrap: nowrap; }
.tk-head .ff-item-title { display: flex; align-items: flex-start; gap: 6px; min-width: 0; overflow-wrap: anywhere; }
.tk-check { width: 18px; height: 18px; flex-shrink: 0; margin-top: 3px; color: #15803D; }
.tk-tags { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; flex-shrink: 0; }
/* Board columns are narrow: tags go under the title so it never squeezes. */
.kb-card .tk-head { flex-direction: column; align-items: flex-start; gap: 6px; }
.kb-card .tk-tags { justify-content: flex-start; }
.tk-yours { background: rgba(227,119,83,.12); color: var(--ff-orange-deep); border-color: transparent; }
.tk-done { opacity: .72; }
.tk-done .ff-item-title { color: var(--ff-muted); }
.tk-waiting { box-shadow: inset 4px 0 0 var(--ff-orange), var(--ff-shadow-sm); }
.tk-filters { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px; width: fit-content; max-width: 100%; background: var(--ff-card);
  border-radius: 12px; box-shadow: var(--ff-shadow-sm); }
.tk-filters button { display: inline-flex; align-items: center; gap: 8px; font: inherit; font-weight: 800; font-size: 15px; white-space: nowrap;
  border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer; background: transparent; color: var(--ff-muted); }
.tk-filters button[aria-pressed='true'] { background: var(--ff-dark); color: #fff; }
.tk-filters button:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.tk-filter-count { font-size: 13px; opacity: .8; }
.tk-answered { font-size: 19px; margin: 12px 0 0; color: var(--ff-muted); }
/* Filters on the left, "Request approval" (Faith Funnels only) on the right. The open form takes the full row. */
.tk-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.tk-bar > .ff-btn { margin-left: auto; }
.ra-form { flex-basis: 100%; display: flex; flex-direction: column; gap: 14px; }
.ra-field { display: flex; flex-direction: column; gap: 6px; }
.ra-field .ff-label { margin: 0; }
.ra-description { margin: 10px 0 0; white-space: pre-wrap; }

/* Results tab */
.rs { display: flex; flex-direction: column; gap: 16px; }
.rs-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.rs-range { display: inline-flex; padding: 4px; gap: 4px; background: var(--ff-card); border-radius: 12px; box-shadow: var(--ff-shadow-sm); }
.rs-range-btn { border: 0; background: transparent; font: inherit; font-size: 15px; font-weight: 800; color: var(--ff-muted);
  padding: 8px 14px; border-radius: 8px; cursor: pointer; min-height: 40px; }
.rs-range-btn[aria-pressed='true'] { background: var(--ff-dark); color: #fff; }
.rs-range-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.rs-hero { display: flex; flex-direction: column; gap: 6px; }
.rs-hero-label { font-weight: 900; font-size: 22px; letter-spacing: -0.02em; }
.rs-hero-value { font-weight: 900; font-size: clamp(56px, 10vw, 88px); line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.rs-hero .rs-change { color: var(--ff-on-dark-muted); }
.rs-hero .rs-change.is-good { color: #fff; }
.rs-hero-help { margin: 6px 0 0; color: var(--ff-on-dark-muted); }
.rs-hero-sub { margin: 0; color: #fff; }
.rs-note-text { margin: 12px 0 6px; font-size: 18px; white-space: pre-line; }
.rs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.rs-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; margin-top: 16px; }
.rs-stat { display: flex; flex-direction: column; gap: 2px; }
.rs-stat-label { font-size: 14px; font-weight: 800; color: var(--ff-muted); }
.rs-stat-value { font-weight: 900; font-size: 32px; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.rs-stat-value small { font-size: 15px; font-weight: 800; color: var(--ff-muted); letter-spacing: 0; }
.rs-change { font-size: 14px; color: var(--ff-muted); }
.rs-change.is-good { color: #15803D; font-weight: 800; }
.rs-wait { margin: 0; }
.rs-foot { margin: 0; }
@media (max-width: 560px) { .rs-grid { grid-template-columns: 1fr; } .rs-range-btn { padding: 8px 10px; } }

/* Stage: compact bar for phones */
.home-stage-compact { display: none; margin: 14px 0 2px; }
.home-stage-segs { display: flex; gap: 4px; }
.home-stage-segs span { flex: 1; height: 8px; border-radius: 9999px; background: var(--ff-line); }
.home-stage-segs span.is-done { background: var(--ff-orange); }
.home-stage-segs span.is-now { background: var(--ff-dark); }
.home-stage-text { margin: 8px 0 0; font-size: 15px; color: var(--ff-muted); }
.home-stage-text strong { color: var(--ff-dark); }

/* Service page extras */
.sv-progress { margin: 16px 0 0; }
.sv-timeline { display: flex; align-items: center; gap: 6px; margin-top: 12px; }
.sv-timeline svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--ff-orange-deep); }
.kb-head-text { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; flex: 1; min-width: 0; }
.kb-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 9999px;
  background: var(--ff-card); color: var(--ff-dark); font-size: 13px; font-weight: 800; }
.kb-num svg { width: 15px; height: 15px; }
.kb-col-now { border-color: var(--ff-orange); }
.kb-col-now .kb-num { background: var(--ff-orange); color: #fff; }
.kb-col-done .kb-num { background: var(--ff-ok); color: #fff; }
.kb-now { font-size: 11px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: #fff; background: var(--ff-orange);
  border-radius: 9999px; padding: 2px 8px; }
.kb-goal { margin: 0; font-size: 15px; color: var(--ff-muted); }
.kb-head-btn { width: 100%; min-height: 44px; font: inherit; color: var(--ff-dark); text-align: left; background: none; border: 0; padding: 0; cursor: pointer; }
.kb-head-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 4px; border-radius: 8px; }
.kb-chevron { width: 20px; height: 20px; flex-shrink: 0; color: var(--ff-muted); transition: transform .18s ease; }
.kb-col-closed .kb-chevron { transform: rotate(-90deg); }
/* Wide screens: fold a column into a thin strip. Tap the strip to open it again. */
.kb-fold { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; padding: 0;
  border: 0; border-radius: 8px; background: transparent; color: var(--ff-muted); cursor: pointer; transition: background .15s, color .15s; }
.kb-fold:hover { background: var(--ff-card); color: var(--ff-dark); }
.kb-fold-icon { width: 18px; height: 18px; }
.kb-col-folded { flex: 0 0 52px; padding: 0; align-self: stretch; scroll-snap-align: none; }
.kb-unfold { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; height: 100%; min-height: 240px;
  padding: 14px 0; font: inherit; color: var(--ff-muted); background: transparent; border: 0; border-radius: 14px; cursor: pointer;
  transition: background .15s, color .15s; }
.kb-unfold:hover { background: rgba(231,222,207,.8); color: var(--ff-dark); }
.kb-unfold .kb-count { padding: 3px 7px; }
.kb-fold-title { writing-mode: vertical-rl; font-weight: 800; font-size: 16px; letter-spacing: -0.01em; color: var(--ff-dark); white-space: nowrap; }
.kb-fold:focus-visible, .kb-unfold:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }

/* Touch screens: no hover lifts (they stick after a tap), no grey tap flash, no double-tap zoom delay. */
.ff { -webkit-tap-highlight-color: transparent; }
.ff button, .ff a, .ff label { touch-action: manipulation; }
@media (hover: none) {
  .ff-lift:hover { transform: none; box-shadow: var(--ff-shadow-sm); }
  .ob-option:hover { transform: none; }
  .ff-btn-primary:hover:not(:disabled) { transform: none; box-shadow: none; }
}
@media (prefers-reduced-motion: reduce) { .kb-chevron { transition: none; } }

/* Task card: the title button covers the whole card, so a tap anywhere opens the task. "I did this" sits above it. */
.td-card { position: relative; cursor: pointer; }
.td-open { font: inherit; color: inherit; letter-spacing: inherit; text-align: left; background: none; border: 0; padding: 0; cursor: pointer; }
.td-open::after { content: ''; position: absolute; inset: 0; border-radius: 16px; }
.kb-card .td-open::after { border-radius: 12px; }
.td-open:focus-visible { outline: none; }
.td-open:focus-visible::after { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-above { position: relative; z-index: 1; margin-top: 12px; }
.td-preview { margin: 8px 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-wrap; }
.td-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
.td-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; color: var(--ff-muted);
  background: var(--ff-cream); border-radius: 9999px; padding: 3px 9px; }
.td-chip svg { width: 14px; height: 14px; }
.td-chip-ok { background: rgba(34,197,94,.14); color: #15803D; }
.td-owner { margin-left: auto; display: inline-flex; }
.td-avatar { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 9999px; object-fit: cover;
  background: var(--ff-dark); box-shadow: 0 0 0 2px var(--ff-card); }
.td-avatar-sm { width: 28px; height: 28px; font-size: 11px; }
.td-avatar-md { width: 24px; height: 24px; font-size: 10px; margin-left: -6px; }
.td-avatar-you { background: var(--ff-orange); color: #fff; font-weight: 800; letter-spacing: .02em; }
.td-stack { display: inline-flex; align-items: center; }
.td-stack > .td-avatar + .td-avatar { margin-left: -8px; }
.td-avatar-more { background: var(--ff-line); color: var(--ff-dark); font-weight: 800; }
.td-avatar-empty { background: transparent; color: var(--ff-muted); box-shadow: inset 0 0 0 1.5px var(--ff-muted); }
.td-avatar-empty svg { width: 14px; height: 14px; color: var(--ff-muted); }
.td-facts li.td-assign { position: relative; padding: 0; }
.td-assign-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 6px 10px 6px 12px; border: 0; border-radius: 9999px;
  background: transparent; font: inherit; font-weight: 800; color: var(--ff-dark); cursor: pointer; max-width: 100%; }
.td-assign-btn:hover { box-shadow: inset 0 0 0 1.5px var(--ff-orange); }
.td-assign-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-assign-btn[aria-expanded='true'] { box-shadow: inset 0 0 0 1.5px var(--ff-orange); }
.td-assign-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-facts .td-assign-btn .td-avatar-md { margin-left: 0; }
.td-facts .td-assign-btn > svg { color: var(--ff-muted); transition: transform .18s ease; }
.td-assign-btn[aria-expanded='true'] .td-assign-chevron { transform: rotate(180deg); }
.td-assign-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 5; width: min(320px, calc(100vw - 48px)); max-height: 360px; overflow-y: auto;
  padding: 4px 12px 12px; border-radius: 16px; background: var(--ff-card); box-shadow: var(--ff-shadow-card); font-weight: 700; }
.td-assign-group { border: 0; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.td-assign-group legend { padding: 0; margin-bottom: 6px; font-size: 13px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--ff-muted); }
.td-assign-item { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 8px; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 700; }
.td-assign-item { position: relative; box-shadow: inset 0 0 0 1.5px transparent; transition: background-color .12s ease, box-shadow .12s ease; }
.td-assign-item:hover { background: var(--ff-cream); }
.td-assign-on, .td-assign-on:hover { background: rgba(227,119,83,.14); box-shadow: inset 0 0 0 1.5px var(--ff-orange); color: var(--ff-orange-deep); }
.td-assign-tick { width: 18px; height: 18px; margin-left: auto; flex-shrink: 0; color: var(--ff-orange); }
.td-assign-item:has(input:disabled) { cursor: progress; opacity: .7; }
.td-assign-item:focus-within { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .td-assign-item { transition: none; } }
button.td-assign-item { width: 100%; border: 0; font: inherit; font-weight: 700; color: var(--ff-dark); text-align: left; }
button.td-assign-item:not(.td-assign-on) { background: transparent; }
button.td-assign-item:not(.td-assign-on):hover { background: var(--ff-cream); }
button.td-assign-on { color: var(--ff-orange-deep); }
button.td-assign-item:disabled { cursor: progress; opacity: .7; }
/* Status badge at the top of a task: opens the status list */
.td-status { position: relative; }
.ff-tag.td-status-btn { display: inline-flex; align-items: center; gap: 6px; font-family: inherit; cursor: pointer; }
.td-status-btn svg { width: 14px; height: 14px; }
.td-status-btn:hover, .td-status-btn[aria-expanded='true'] { box-shadow: inset 0 0 0 1.5px var(--ff-orange); }
.td-status-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-status-pop { padding-top: 8px; font-size: 16px; }
.td-status-dot { width: 10px; height: 10px; border-radius: 9999px; flex-shrink: 0; background: var(--kb-tone); }
.td-status-note { margin: 4px 4px 0; }
.td-status-board { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; margin-top: 8px; padding: 0 8px;
  border: 0; border-top: 1.5px solid var(--ff-line); border-radius: 0 0 12px 12px; background: transparent; font: inherit; font-size: 15px;
  font-weight: 800; color: var(--ff-orange-deep); cursor: pointer; text-align: left; }
.td-status-board:hover { background: var(--ff-cream); }
.td-status-board:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-status-board svg { width: 16px; height: 16px; }
/* Service and milestone chips open the service page */
.td-facts li.td-fact-nav { padding: 0; }
.td-chip-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 6px 12px; border: 0; border-radius: 9999px;
  background: transparent; font: inherit; font-weight: 800; color: var(--ff-dark); cursor: pointer; }
.td-chip-btn:hover { box-shadow: inset 0 0 0 1.5px var(--ff-orange); }
.td-chip-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
/* The column a task chip opened: flashes once */
.kb-col-focus { animation: kb-focus 1.6s ease 1; }
@keyframes kb-focus { 0%, 60% { box-shadow: 0 0 0 3px var(--ff-orange); } 100% { box-shadow: 0 0 0 0 rgba(227,119,83,0); } }
@media (prefers-reduced-motion: reduce) { .kb-col-focus { animation: none; box-shadow: 0 0 0 3px var(--ff-orange); } }
.td-assign-name { overflow-wrap: anywhere; }
.td-assign-error { margin: 10px 0 0; font-size: 14px; }
.td-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Task full view: slides in from the right (a bottom sheet on phones) */
.td-root { position: fixed; inset: 0; z-index: 60; }
.td-backdrop { position: absolute; inset: 0; border: 0; padding: 0; background: rgba(42,49,53,.55); cursor: pointer; animation: dr-fade .22s ease; }
.td-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(520px, 100vw); height: 100vh; height: 100dvh;
  overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
  background: var(--ff-cream); box-shadow: var(--ff-shadow-card); outline: none;
  padding: 0 24px calc(32px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 16px;
  animation: td-in .22s cubic-bezier(.2,.8,.2,1); }
@keyframes td-in { from { transform: translateX(100%); } to { transform: none; } }
@keyframes td-up { from { transform: translateY(100%); } to { transform: none; } }
.td-top { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin: 0 -4px; padding: calc(16px + env(safe-area-inset-top, 0px)) 4px 4px; background: var(--ff-cream); }
.td-close { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0; margin-right: -8px; }
.td-close svg { width: 22px; height: 22px; }
.td-title { margin: 0; overflow-wrap: anywhere; }
.td-facts { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.td-facts li { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 800; color: var(--ff-dark);
  background: var(--ff-card); border-radius: 9999px; padding: 6px 12px; }
.td-facts svg { width: 16px; height: 16px; color: var(--ff-orange); }
.td-callout { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px; border-radius: 16px;
  background: var(--ff-card); box-shadow: inset 4px 0 0 var(--ff-orange); }
.td-section { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: var(--ff-card); border-radius: 16px; }
.td-section-title { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; color: var(--ff-muted); }
.td-notes { margin: 0; font-size: 17px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.td-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.td-step { display: flex; align-items: flex-start; gap: 10px; font-size: 16px; }
.td-step svg { width: 20px; height: 20px; flex-shrink: 0; color: var(--ff-muted); margin-top: 1px; }
.td-step-done svg { color: var(--ff-ok); }
.td-step-done span { color: var(--ff-muted); text-decoration: line-through; }
.td-images { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.td-image { display: block; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: var(--ff-cream); }
.td-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .18s ease; }
@media (hover: hover) { .td-image:hover img { transform: scale(1.04); } .td-file:hover { box-shadow: inset 0 0 0 2px var(--ff-line); } }
.td-image:focus-visible, .td-file:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-file { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 12px; border-radius: 12px; background: var(--ff-cream);
  color: var(--ff-dark); text-decoration: none; font-weight: 800; }
.td-file-icon { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 10px; background: var(--ff-card); color: var(--ff-orange); }
.td-file-icon svg { width: 18px; height: 18px; }
.td-file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-file-out { width: 16px; height: 16px; flex-shrink: 0; color: var(--ff-muted); }
/* Task history: a closed box at the bottom of the task view. */
.td-history { gap: 0; }
.td-history-toggle { display: flex; align-items: center; gap: 8px; min-height: 44px; margin: -12px -8px; padding: 0 8px; border-radius: 12px;
  list-style: none; cursor: pointer; }
.td-history-toggle::-webkit-details-marker { display: none; }
.td-history-toggle:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.td-history-toggle > svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--ff-muted); }
.td-history-chevron { margin-left: auto; transition: transform .18s ease; }
.td-history[open] .td-history-chevron { transform: rotate(180deg); }
.td-history-empty { margin: 12px 0 0; }
.td-history-list { list-style: none; margin: 12px 0 0; padding: 0 0 0 14px; display: flex; flex-direction: column; gap: 12px; border-left: 2px solid var(--ff-line); }
.td-history-item { position: relative; display: flex; flex-direction: column; gap: 2px; font-size: 16px; overflow-wrap: anywhere; }
.td-history-item::before { content: ''; position: absolute; left: -20px; top: 7px; width: 10px; height: 10px; border-radius: 9999px; background: var(--ff-orange); }
.td-history-item time { font-size: 13px; font-weight: 800; color: var(--ff-muted); }
@media (prefers-reduced-motion: reduce) { .td-history-chevron, .td-facts .td-assign-btn > svg { transition: none; } }
/* Task comments (TaskComments.tsx). */
.tc { display: flex; flex-direction: column; gap: 14px; }
.tc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.tc-item { display: flex; gap: 10px; align-items: flex-start; }
.tc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.tc-meta { margin: 0; display: flex; align-items: center; gap: 4px; min-height: 28px; font-size: 14px; font-weight: 800; color: var(--ff-dark); }
.tc-time { font-size: 13px; font-weight: 600; color: var(--ff-muted); white-space: nowrap; }
.tc-text { margin: 0; font-size: 16px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
.tc-del { margin-left: auto; }
.tc-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: 8px;
  background: transparent; color: var(--ff-muted); cursor: pointer; }
.tc-icon-btn svg { width: 16px; height: 16px; }
.tc-icon-btn:hover { background: var(--ff-line); color: var(--ff-dark); }
.tc-icon-btn:focus-visible, .tc-pick-item:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.tc-form { display: flex; flex-direction: column; gap: 8px; padding-top: 14px; border-top: 1.5px solid var(--ff-line); }
/* Message bar: icons, text box and round send button stay on one row. */
.tc-bar { display: flex; align-items: flex-end; gap: 4px; }
.tc-bar .tc-tool { position: relative; width: 40px; height: 40px; border-radius: 9999px; }
.tc-bar .tc-tool svg { width: 20px; height: 20px; }
.tc-bar .tc-tool[hidden] { display: none; }
.tc-tool:focus-within { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.tc-input { flex: 1; min-width: 0; min-height: 40px; max-height: 160px; padding: 8px 14px; border-radius: 20px; line-height: 1.4;
  resize: none; field-sizing: content; }
.tc-send { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0;
  border: 0; border-radius: 9999px; background: var(--ff-orange); color: #fff; cursor: pointer; transition: background .18s ease, opacity .18s ease; }
.tc-send svg { width: 18px; height: 18px; }
.tc-send:hover:not(:disabled) { background: var(--ff-orange-deep); }
.tc-send:disabled { opacity: .4; cursor: default; }
.tc-send:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.tc-chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.tc-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 2px 2px 2px 10px; border-radius: 10px;
  background: var(--ff-cream); font-size: 14px; }
.tc-chip > svg { width: 16px; height: 16px; color: var(--ff-orange); flex-shrink: 0; }
.tc-chip-name { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.tc-chip-meta { color: var(--ff-muted); white-space: nowrap; }
.tc-chip-error { box-shadow: inset 0 0 0 1.5px var(--ff-warn); }
.tc-chip-error .tc-chip-meta { color: var(--ff-warn); }
.tc-pick { border: 1.5px solid var(--ff-line); border-radius: 12px; background: #fff; overflow: hidden; }
.tc-pick-head { display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 12px; border-bottom: 1.5px solid var(--ff-line); }
.tc-pick-head > svg { width: 16px; height: 16px; color: var(--ff-muted); flex-shrink: 0; }
.tc-pick-search { flex: 1; min-width: 0; font: inherit; font-size: 16px; border: 0; outline: none; background: transparent; padding: 8px 0; color: var(--ff-dark); }
.tc-pick-list { list-style: none; margin: 0; padding: 4px; max-height: 240px; overflow-y: auto; }
.tc-pick-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 6px 10px; border: 0; border-radius: 8px;
  background: transparent; font: inherit; font-size: 15px; text-align: left; color: var(--ff-dark); cursor: pointer; }
.tc-pick-item:hover { background: var(--ff-cream); }
.tc-pick-item svg { width: 16px; height: 16px; color: var(--ff-orange); flex-shrink: 0; }
.tc-pick-name { flex: 1; min-width: 0; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tc-pick-empty { margin: 0; padding: 14px 12px; display: flex; align-items: center; gap: 8px; }
.tc-pick-empty svg { width: 16px; height: 16px; }
@media (prefers-reduced-motion: reduce) { .td-panel, .td-backdrop { animation: none; } .td-image img { transition: none; } }
@media (max-width: 640px) {
  .td-panel { top: auto; height: auto; max-height: 92vh; max-height: 92dvh; width: 100vw; border-radius: 20px 20px 0 0;
    padding: 0 16px calc(28px + env(safe-area-inset-bottom, 0px)); animation-name: td-up; }
  .td-top { padding-top: 12px; }
  .td-images { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .td-callout .ff-btn { width: 100%; }
}

@media (max-width: 640px) {
  /* App-style layout: content up top, tabs in reach of the thumb at the bottom. */
  .pp-top-actions { display: none; }
  /* Hamburger on the right, logo on the left; the menu slides in from the right to match. */
  .pp-shell .ff-topbar > div:first-child { flex: 1; flex-direction: row-reverse; justify-content: space-between; }
  .dr-panel { left: auto; right: 0;
    padding: 0 calc(16px + env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) 16px; }
  .dr-closing .dr-panel { transform: translateX(100%); }
  @keyframes dr-in { from { transform: translateX(100%); } to { transform: none; } }
  .ff-tabs { display: none; }
  .pp-hero-sub { display: none; }
  .pp-page-title { display: block; font-size: 32px; margin-top: 4px; }
  .ff-body { padding: 4px 16px 24px; }
  .pp-tabbar { display: flex; gap: 2px; padding: 6px 6px calc(6px + env(safe-area-inset-bottom)); background: var(--ff-card);
    border-top: 1px solid var(--ff-line); box-shadow: 0 -6px 18px rgba(42,49,53,.06); }
  .pp-tabbar-btn { flex: 1; min-width: 0; min-height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    font: inherit; font-size: 13px; font-weight: 800; color: var(--ff-muted); background: transparent; border: 0; border-radius: 12px; padding: 4px 2px; cursor: pointer; }
  .pp-tabbar-btn:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: -2px; }
  .pp-tabbar-btn[aria-current='page'] { color: var(--ff-dark); }
  .pp-tabbar-icon { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 30px;
    border-radius: 9999px; transition: background .18s ease, color .18s ease; }
  .pp-tabbar-icon svg { width: 22px; height: 22px; }
  .pp-tabbar-btn[aria-current='page'] .pp-tabbar-icon { background: var(--ff-dark); color: #fff; }
  .pp-tabbar-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pp-tabbar-badge { position: absolute; top: -3px; right: 4px; display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px;
    padding: 0 5px; border-radius: 9999px; background: var(--ff-orange); color: #fff; font-size: 12px; border: 2px solid var(--ff-card); }
  .pp-tabbar-badge:empty { min-width: 12px; height: 12px; padding: 0; top: 0; right: 10px; }

  /* Cards and type */
  .ff-item { padding: 16px 18px; }
  .ff-h2 { font-size: 22px; }
  .home-next { padding: 22px 20px; }
  .home-next .ff-btn { width: 100%; }
  .bl-cta { width: 100%; }
  .home-stepper { display: none; }
  .home-stage-compact { display: block; }
  .home-list { gap: 2px; }
  .home-list-btn { display: block; width: 100%; min-height: 40px; padding: 8px 0; }

  /* Every tap target at least 44px tall */
  .ff-btn-sm { min-height: 44px; }
  .ff-row-actions .ff-btn { flex: 1 1 auto; }
  .tk-filters, .sv-toggle { display: flex; width: 100%; }
  .tk-filters button, .sv-toggle button { flex: 1; justify-content: center; min-height: 44px; padding: 8px 10px; }
  .tk-did { width: 100%; }
  .tk-head { flex-direction: column; align-items: flex-start; gap: 6px; }
  .tk-tags { justify-content: flex-start; }

  /* Service plan: stacked milestones instead of a sideways board */
  .sv-bar { flex-direction: column; align-items: stretch; }
  .kb { flex-direction: column; align-items: stretch; overflow: visible; scroll-snap-type: none; margin: 0; padding: 0; gap: 10px; }
  .kb-col { flex: none; width: 100%; padding: 10px 14px 14px; }
  .kb-col-closed { padding-bottom: 12px; }
  .kb-wrap { margin-inline: 0; }
  .kb-edge, .kb-resize { display: none; }
  .kb { -webkit-mask-image: none; mask-image: none; }
  .kb-card .ff-item-title { font-size: 17px; }
  .ml-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ml-folders { grid-template-columns: 1fr; }
  .ml-tools .ff-btn { flex: 1; justify-content: center; }
  .ob-minibar { display: none; }
  .ob-rows-head { display: none; }
  .ob-row { grid-template-columns: 1fr 1fr !important; }
  .ob-cell-label { display: block; }
  .ob-steps { gap: 8px; }
  .ob-step { font-size: 13px; }

  /* Profile */
  .pf-avatar { width: 56px; height: 56px; font-size: 20px; }
  .pf-grid { grid-template-columns: 1fr; }
  .pf-me-actions .ff-btn, .pf-save .ff-btn-primary { flex: 1 1 auto; }
}

/* Desktop: the menu becomes a sidebar that is always open. No hamburger, no tab row, no bottom bar. */
@media (min-width: 1024px) {
  .pp-shell-nav { grid-template-columns: 272px minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr);
    transition: grid-template-columns .22s cubic-bezier(.2,.8,.2,1); }
  .pp-shell-nav.pp-side-collapsed { grid-template-columns: 80px minmax(0, 1fr); }
  .pp-side-collapsed > .pp-side { padding: 20px 12px 16px; }
  .pp-shell-nav > .ff-top { grid-column: 2; grid-row: 1; }
  .pp-shell-nav > .ff-body { grid-column: 2; grid-row: 2; padding: 24px 40px 56px; }
  .pp-shell-nav > .pp-side { grid-column: 1; grid-row: 1 / -1; display: flex; flex-direction: column; min-height: 0; overflow-y: auto;
    overscroll-behavior: contain; padding: 24px 16px 16px; background: var(--ff-card); border-right: 1px solid var(--ff-line); }
  .pp-shell-nav .ff-topbar, .pp-shell-nav .ff-tabs, .pp-shell-nav .pp-tabbar, .pp-shell-nav .pp-hero-sub { display: none; }
  .pp-shell-nav .pp-page-title { display: block; margin-top: 4px; }
  .pp-shell-nav .ff-progress { border-radius: 0; }
}
@media (min-width: 1024px) and (prefers-reduced-motion: reduce) { .pp-shell-nav { transition: none; } }

/* GHL look (2026-10-01): charcoal top bar and sidebar with orange glow gradients. Work area stays cream. */
.pp-shell > .ff-top { color: #fff;
  background: radial-gradient(55% 320% at 100% 0%, rgba(227,119,83,.9) 0%, rgba(213,100,42,.4) 40%, transparent 75%), var(--ff-dark); }
.pp-shell > .ff-top .ff-progress { background: rgba(255,255,255,.14); }
.pp-shell .ff-topbar .pp-menu-btn { color: #fff; }
.pp-shell .ff-topbar .pp-menu-btn:hover { background: rgba(255,255,255,.1); }
.pp-shell .ff-topbar .ff-btn-secondary { color: #fff; border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.08); }
.pp-shell .ff-topbar .ff-btn-secondary:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,.2); }
.pp-shell .ff-topbar .ff-btn-ghost { color: var(--ff-on-dark-muted); }
.pp-shell .ff-topbar .ff-btn-ghost:hover:not(:disabled) { color: #fff; }
.pp-shell .ff-topbar .pp-avatar-btn { box-shadow: 0 0 0 2px rgba(255,255,255,.55); }
.pp-shell .ff-topbar .pp-avatar-btn:hover, .pp-shell .ff-topbar .pp-avatar-btn[aria-current='page'] { box-shadow: 0 0 0 3px #fff; }
.pp-shell .ff-topbar :focus-visible { outline-color: #fff; }
@media (min-width: 1024px) {
  /* Desktop keeps a slim top bar (Billing + avatar) like GHL. Logo and menu live in the sidebar. */
  .pp-shell-nav .ff-topbar { display: flex; justify-content: flex-end; min-height: 60px; padding: 8px 40px; }
  .pp-shell-nav .ff-topbar .pp-menu-btn, .pp-shell-nav .ff-topbar .ff-logo { display: none; }
  .pp-shell-nav > .pp-side { color: #fff; border-right: 0;
    background: radial-gradient(140% 40% at 0% 100%, rgba(227,119,83,.6) 0%, rgba(227,119,83,.2) 45%, transparent 75%), var(--ff-dark); }
  .pp-side .pn-church { color: #fff; background: var(--ff-orange); padding: 10px 12px; border-radius: 10px; box-shadow: var(--ff-shadow-cta); }
  .pp-side .pn-label { color: rgba(255,255,255,.5); }
  .pp-side .pn-item, .pp-side .pn-me, .pp-side .pn-signout, .pp-side .pn-collapse { color: var(--ff-on-dark-muted); }
  .pp-side .pn-icon { background: transparent; color: inherit; }
  .pp-side .pn-item:hover, .pp-side .pn-me:hover, .pp-side .pn-collapse:hover { background: rgba(255,255,255,.08); color: #fff; }
  .pp-side .pn-item:active, .pp-side .pn-me:active { background: rgba(255,255,255,.14); }
  .pp-side .pn-item[aria-current='page'] { background: var(--ff-orange); color: #fff; box-shadow: var(--ff-shadow-cta); }
  .pp-side .pn-item[aria-current='page'] .pn-icon { background: transparent; }
  .pp-side .pn-me[aria-current='page'] { background: rgba(255,255,255,.1); }
  .pp-side .pn-me-name { color: #fff; }
  .pp-side .pn-me-email, .pp-side .pn-me-chevron { color: rgba(255,255,255,.6); }
  .pp-side .pn-foot { border-top-color: rgba(255,255,255,.14); }
  .pp-side .pn-collapsed .pn-label { background: rgba(255,255,255,.14); }
  .pp-side .pn-collapsed .pp-badge, .pp-side .pn-collapsed .pn-dot { border-color: var(--ff-dark); }
  .pp-side .pn-item:focus-visible, .pp-side .pn-me:focus-visible, .pp-side .pn-signout:focus-visible { outline-color: #fff; }
}

/* Tasks tab: one card, one compact row per task (title + meta left; tags, chips, avatar right). */
.tk-list { padding: 0; overflow: hidden; }
.tk-list .td-card { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; column-gap: 12px;
  padding: 12px 20px; border-radius: 0; box-shadow: none; background: transparent; transition: background .15s ease; }
.tk-list .td-card + .td-card { border-top: 1px solid var(--ff-line); }
.tk-list .td-card:hover { transform: none; box-shadow: none; background: var(--ff-cream); }
.tk-list .tk-waiting, .tk-list .tk-waiting:hover { box-shadow: inset 4px 0 0 var(--ff-orange); }
.tk-list .tk-head { display: contents; }
.tk-list .ff-item-title { grid-column: 1; grid-row: 1; font-size: 16px; }
.tk-list .ff-item-meta { grid-column: 1; grid-row: 2; font-size: 13px; margin-top: 2px; }
.tk-list .tk-tags { grid-column: 2; grid-row: 1 / span 2; }
.tk-list .td-chips { grid-column: 3; grid-row: 1 / span 2; margin-top: 0; flex-wrap: nowrap; }
.tk-list .td-above { grid-column: 4; grid-row: 1 / span 2; margin-top: 0; }
.tk-list .td-preview { display: none; }
.tk-list .td-open::after { border-radius: 0; }
@media (max-width: 640px) {
  .tk-list .td-card { grid-template-columns: minmax(0, 1fr) auto; row-gap: 6px; padding: 12px 16px; }
  .tk-list .tk-tags { grid-column: 2; grid-row: 1; }
  .tk-list .td-chips { grid-column: 2; grid-row: 2; justify-content: flex-end; }
  .tk-list .td-above { grid-column: 1 / -1; grid-row: 3; }
}
`;

export function PortalStyles() {
  return <style>{CSS}</style>;
}
