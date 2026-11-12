/*
 * Trajet LED Card — temps de trajet façon panneau à messages variables d'autoroute
 * https://github.com/robote7701/trajet-ledcard
 *
 * Fonctionne avec tout capteur de temps de trajet en minutes (Waze Travel Time,
 * Google Maps Travel Time…). Le « temps normal » sert à calculer le retard.
 *
 * type: custom:trajet-ledcard
 * title: Temps de parcours
 * slow_after: 5                # retard (min) à partir duquel c'est « ralenti »
 * jam_after: 15                # retard (min) à partir duquel c'est « bouchon »
 * show_beacons: true
 * routes:
 *   - name: Bureau
 *     entity: sensor.waze_bureau
 *     normal: sensor.waze_bureau_normal   # capteur… ou un nombre de minutes (ex. 20)
 */
const TLC_VERSION = "1.0.0";
const TLC_TAG = "trajet-ledcard";

const TLC_I18N = {
  fr: {
    title: "Temps de parcours", min: "MIN", via: "VIA", km: "KM", ok: "FLUIDE", slow: "RALENTI", jam: "BOUCHON",
    na: "INDISPONIBLE", upd: "MAJ", delay: "Retard estimé", none: "Ajoutez au moins un trajet (routes).",
    f_title: "Nom du panneau", f_routes: "Trajets", f_name: "Nom affiché", f_entity: "Capteur de temps de trajet",
    f_normal: "Capteur de temps normal (facultatif)", f_normal_min: "ou temps normal fixe (min)",
    f_slow: "Ralenti à partir de (min de retard)", f_jam: "Bouchon à partir de (min de retard)", f_beacons: "Feux clignotants",
  },
  en: {
    title: "Travel time", min: "MIN", via: "VIA", km: "KM", ok: "FLOWING", slow: "SLOW", jam: "JAM",
    na: "UNAVAILABLE", upd: "UPD", delay: "Estimated delay", none: "Add at least one route (routes).",
    f_title: "Sign name", f_routes: "Routes", f_name: "Display name", f_entity: "Travel time sensor",
    f_normal: "Normal time sensor (optional)", f_normal_min: "or fixed normal time (min)",
    f_slow: "Slow from (min of delay)", f_jam: "Jam from (min of delay)", f_beacons: "Flashing beacons",
  },
};
const tlcLang = (hass) => ((hass && (hass.locale?.language || hass.language)) || "fr").startsWith("fr") ? "fr" : "en";

const TLC_STYLE = `
  :host { display:block; }
  .sign { --amber:#ffe24a; --ok:#8cff6a; --slow:#ffa62e; --jam:#ff4a3d; --off:#9aa1ab; }
  .housing { position:relative; border-radius:12px; padding:30px 10px 10px;
    background:linear-gradient(180deg,#3a3f47,#1d2025 60%,#15171b);
    box-shadow:0 3px 10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12); }
  .hl { position:absolute; top:8px; left:38px; right:38px; text-align:center; font-size:11px; font-weight:700;
    font-family:"Arial Narrow","Roboto Condensed",Roboto,Arial,sans-serif;
    letter-spacing:3px; color:#c9ced6; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .beacon { position:absolute; top:7px; width:16px; height:16px; border-radius:50%;
    background:radial-gradient(circle at 40% 35%,#5a4520,#2a1d08); box-shadow:inset 0 0 0 2px #111; }
  .beacon.l { left:12px; } .beacon.r { right:12px; }
  .on .beacon { animation:tlc-blink 1.1s steps(1) infinite; }
  .on.b-jam .beacon { animation-duration:.6s; }
  .on .beacon.r { animation-delay:.55s; }
  .on.b-jam .beacon.r { animation-delay:.3s; }
  @keyframes tlc-blink {
    0% { background:radial-gradient(circle at 40% 35%,#fff6c0,#ffb300 45%,#ff7a00);
         box-shadow:inset 0 0 0 2px #111, 0 0 10px 3px rgba(255,170,0,.75); }
    50% { background:radial-gradient(circle at 40% 35%,#5a4520,#2a1d08); box-shadow:inset 0 0 0 2px #111; }
  }
  .screen { background:#050505; border-radius:6px; padding:8px 10px 6px;
    box-shadow:inset 0 0 0 2px #2a2a2a, inset 0 4px 14px rgba(0,0,0,.95); }
  .m { font-family:"DejaVu Sans Mono","Consolas","Menlo","Liberation Mono","Droid Sans Mono",monospace;
    font-weight:700; text-transform:uppercase; line-height:1.15;
    -webkit-mask-image:radial-gradient(circle,#000 64%,transparent 72%); -webkit-mask-size:var(--dot,2.5px) var(--dot,2.5px);
    mask-image:radial-gradient(circle,#000 64%,transparent 72%); mask-size:var(--dot,2.5px) var(--dot,2.5px); }
  .g { filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 3px color-mix(in srgb, currentColor 80%, transparent)) drop-shadow(0 0 7px color-mix(in srgb, currentColor 50%, transparent)); }
  .route { padding:4px 0; cursor:pointer; }
  .line { display:flex; align-items:baseline; justify-content:space-between; gap:8px; min-width:0; }
  .name { color:var(--amber); font-size:22px; white-space:nowrap; overflow:hidden; min-width:0; padding:9px; margin:-9px; }
  .time { color:var(--amber); font-size:32px; white-space:nowrap; --dot:2.8px; }
  .time small { font-size:15px; margin-left:3px; }
  .via { color:var(--amber); opacity:.95; font-size:14px; --dot:1.9px; white-space:nowrap; overflow:hidden; min-width:0; padding:9px; margin:-9px; }
  .state { font-size:17px; --dot:2px; white-space:nowrap; }
  .r-ok .state { color:var(--ok); } .r-slow .state { color:var(--slow); } .r-jam .state { color:var(--jam); }
  .r-jam .state .m { animation:tlc-flash 1s steps(1) infinite; }
  @keyframes tlc-flash { 50% { opacity:.25; } }
  .r-na .time, .r-na .state { color:var(--off); }
  .sep { height:0; border-top:1px dashed rgba(255,226,74,.25); margin:4px 0; }
  .foot { display:flex; justify-content:space-between; color:var(--amber); opacity:.8; font-size:11.5px; --dot:1.6px;
    margin-top:4px; }
  .empty { color:var(--off); font-size:14px; padding:10px 0; }
  @media (max-width:400px) {
    .name { font-size:19px; } .time { font-size:28px; } .state { font-size:15px; } .via { font-size:13px; }
  }
`;

const tlcEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tlcM = (txt) => `<span class="g"><span class="m">${txt}</span></span>`;

class TrajetLedCard extends HTMLElement {
  setConfig(config) {
    const c = { title: "", show_beacons: true, routes: [], ...(config || {}) };
    if (!Array.isArray(c.routes)) c.routes = [];
    const th = Array.isArray(c.thresholds) ? c.thresholds : [];
    c.slow_after = Number(c.slow_after ?? th[0] ?? 5);
    c.jam_after = Number(c.jam_after ?? th[1] ?? 15);
    this._config = c;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (ev) => {
        const el = ev.composedPath().find((n) => n.dataset && n.dataset.entity);
        if (!el) return;
        const e = new Event("hass-more-info", { bubbles: true, composed: true });
        e.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(e);
      });
    }
    this._sig = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = tlcLang(hass) + this._config.routes.map((r) => {
      const a = r.entity && hass.states[r.entity];
      const b = typeof r.normal === "string" && hass.states[r.normal];
      return (a ? a.state + a.last_updated : "-") + (b ? b.state : String(r.normal ?? "-"));
    }).join("|");
    if (sig === this._sig) return;
    this._sig = sig;
    this._render();
  }

  _normal(r, t) {
    if (r.normal === undefined || r.normal === null || r.normal === "") return null;
    if (typeof r.normal === "number" || /^\d+(\.\d+)?$/.test(String(r.normal))) return Number(r.normal);
    const st = this._hass.states[r.normal];
    const v = st ? parseFloat(st.state) : NaN;
    return Number.isFinite(v) ? v : null;
  }

  _data(r) {
    const st = r.entity && this._hass && this._hass.states[r.entity];
    const t = st ? parseFloat(st.state) : NaN;
    if (!Number.isFinite(t)) return { level: "na", r, st };
    const n = this._normal(r, t);
    const a = st.attributes || {};
    const base = { r, st, t: Math.round(t), route: a.route || "", dist: a.distance };
    if (n === null) return { ...base, level: "none", delay: null };
    const delay = Math.max(0, Math.round(t - n));
    const level = delay < this._config.slow_after ? "ok" : delay < this._config.jam_after ? "slow" : "jam";
    return { ...base, level, delay };
  }

  _via(d, T) {
    const parts = [];
    if (d.route) parts.push(T.via + " " + String(d.route).split(/[;,]\s*/).join(" · "));
    const dist = Number(d.dist);
    if (Number.isFinite(dist)) parts.push(Math.round(dist) + " " + T.km);
    else if (d.dist) parts.push(String(d.dist));
    return parts.join(" · ");
  }

  _row(d, T) {
    const name = tlcEsc(d.r.name || (d.st && d.st.attributes.friendly_name) || d.r.entity || "?");
    const ent = tlcEsc(d.r.entity || "");
    if (d.level === "na") {
      return `<div class="route r-na" data-entity="${ent}"><div class="line">
        <span class="name">${tlcM("&gt; " + name)}</span><span class="time">${tlcM(`--<small>${T.min}</small>`)}</span></div>
        <div class="line"><span class="via"></span><span class="state">${tlcM(T.na)}</span></div></div>`;
    }
    const state = d.level === "ok" ? T.ok : d.level === "slow" ? `${T.slow} +${d.delay}` : d.level === "jam" ? `${T.jam} +${d.delay}` : "";
    const title = d.delay !== null ? `${T.delay} : ${d.delay} min` : "";
    return `<div class="route r-${d.level}" data-entity="${ent}" title="${tlcEsc(title)}">
      <div class="line"><span class="name">${tlcM("&gt; " + name)}</span>
        <span class="time">${tlcM(`${d.t}<small>${T.min}</small>`)}</span></div>
      <div class="line"><span class="via">${tlcM(tlcEsc(this._via(d, T)))}</span>
        <span class="state">${state ? tlcM(state) : ""}</span></div></div>`;
  }

  _source(data) {
    for (const d of data) {
      const at = String((d.st && d.st.attributes.attribution) || "");
      const m = at.match(/powered by\s+(.+)$/i);
      if (m) return m[1].trim();
    }
    return "";
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) return;
    const T = TLC_I18N[tlcLang(this._hass)];
    const data = this._config.routes.filter((r) => r && r.entity).map((r) => this._data(r));
    const worst = data.some((d) => d.level === "jam") ? "jam" : data.some((d) => d.level === "slow") ? "slow" : "ok";
    const last = data.map((d) => d.st && new Date(d.st.last_updated)).filter((x) => x && !isNaN(x)).sort((a, b) => b - a)[0];
    const loc = tlcLang(this._hass) === "fr" ? "fr-FR" : "en-GB";
    const upd = last ? last.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" }) : "--:--";
    const src = this._source(data);
    const beacons = this._config.show_beacons !== false;
    const on = beacons && worst !== "ok" ? "on b-" + worst : "";
    this.shadowRoot.innerHTML = `<style>${TLC_STYLE}</style>
      <ha-card style="background:none;box-shadow:none;border:none"><div class="sign">
        <div class="housing ${on}">
          <div class="hl">${tlcEsc(this._config.title || T.title)}</div>
          ${beacons ? '<span class="beacon l"></span><span class="beacon r"></span>' : ""}
          <div class="screen">
            ${data.length ? data.map((d) => this._row(d, T)).join('<div class="sep"></div>') : `<div class="empty">${tlcEsc(T.none)}</div>`}
            <div class="foot">${tlcM(T.upd + " " + upd)}${src ? tlcM(tlcEsc(src)) : ""}</div>
          </div>
        </div>
      </div></ha-card>`;
  }

  getCardSize() { return 2 + (this._config.routes.length || 1) * 2; }
  getGridOptions() { return { columns: 12, min_columns: 6 }; }

  static getStubConfig(hass) {
    const s = hass && Object.keys(hass.states).find((id) => id.startsWith("sensor.") &&
      /waze|google|travel/i.test(id + (hass.states[id].attributes.attribution || "")));
    return { routes: [{ name: "Travail", entity: s || "" }] };
  }

  static getConfigForm() {
    const T = TLC_I18N[(document.documentElement.lang || "fr").startsWith("fr") ? "fr" : "en"];
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "routes", selector: { object: { multiple: true, label_field: "name", fields: {
          name: { label: T.f_name, selector: { text: {} } },
          entity: { label: T.f_entity, required: true, selector: { entity: { domain: "sensor" } } },
          normal: { label: T.f_normal, selector: { entity: { domain: "sensor" } } },
        } } } },
        { type: "grid", name: "", schema: [
          { name: "slow_after", selector: { number: { min: 1, max: 120, mode: "box" } } },
          { name: "jam_after", selector: { number: { min: 1, max: 240, mode: "box" } } },
          { name: "show_beacons", selector: { boolean: {} } },
        ] },
      ],
      computeLabel: (s) => ({ title: T.f_title, routes: T.f_routes, slow_after: T.f_slow, jam_after: T.f_jam,
        show_beacons: T.f_beacons })[s.name],
    };
  }
}

if (!customElements.get(TLC_TAG)) {
  customElements.define(TLC_TAG, TrajetLedCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((x) => x.type === TLC_TAG)) {
    window.customCards.push({
      type: TLC_TAG,
      name: "Trajet LED Card",
      description: "Temps de trajet et état du trafic façon panneau à messages variables d'autoroute",
      preview: true,
      documentationURL: "https://github.com/robote7701/trajet-ledcard",
    });
  }
  console.info(`%c TRAJET-LEDCARD %c ${TLC_VERSION} `, "background:#3a3f47;color:#ffe24a", "background:#050505;color:#ffe24a");
}
