/* ════════════════════════════════════════════════════════════════
   PRINCE 3D DRIVING — script.js
   Drive. Earn. Unlock. Explore.  ·  Created by Prince.
   ════════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════ 1. UTILITIES ══════════════════════ */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fmtN    = (n) => Math.round(n).toLocaleString('en-US');
const fmtDist = (m) => m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
const fmtTime = (s) => {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const genPlayerId = () => {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return 'PRC-' + s;
};
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

/* ══════════════════════ 2. GAME DATA ══════════════════════ */
const CAR_DATA = [
  { id: 'hatch', name: 'Starter Hatchback', price: 0,
    stats: { speed: 55, acc: 12, hand: 8 }, color: '#2E9BFF',
    model: { type: 'hatch', len: 3.6, wid: 1.75, hgt: 1.35, roof: 0.62, spoiler: false, wheels: 'std' },
    blurb: 'Nayi shuruaat.' },
  { id: 'sedan', name: 'City Sedan', price: 500,
    stats: { speed: 70, acc: 14, hand: 7 }, color: '#C7D3E4',
    model: { type: 'sedan', len: 4.5, wid: 1.8, hgt: 1.45, roof: 0.66, spoiler: false, wheels: 'std' },
    blurb: 'City traffic ka king.' },
  { id: 'coupe', name: 'Sports Coupe', price: 1200,
    stats: { speed: 90, acc: 18, hand: 8 }, color: '#E8425A',
    model: { type: 'coupe', len: 4.2, wid: 1.85, hgt: 1.2, roof: 0.5, spoiler: true, wheels: 'alloy' },
    blurb: 'Low silhouette, punchy acceleration.' },
  { id: 'suv', name: 'Premium SUV', price: 2000,
    stats: { speed: 78, acc: 15, hand: 6 }, color: '#2F6B4F',
    model: { type: 'suv', len: 4.6, wid: 1.9, hgt: 1.8, roof: 0.85, spoiler: false, wheels: 'alloy' },
    blurb: 'Heavy, high, unbothered.' },
  { id: 'super', name: 'Supercar', price: 4000,
    stats: { speed: 120, acc: 22, hand: 9 }, color: '#FFC94D',
    model: { type: 'supercar', len: 4.4, wid: 2.0, hgt: 1.1, roof: 0.42, spoiler: true, wheels: 'turbo' },
    blurb: 'Mid-engine thunder.' },
  { id: 'hyper', name: 'Hypercar', price: 8000,
    stats: { speed: 150, acc: 26, hand: 10 }, color: '#7B5BE6',
    model: { type: 'hypercar', len: 4.7, wid: 2.1, hgt: 1.0, roof: 0.36, spoiler: true, wheels: 'turbo' },
    blurb: 'Final form.' }
];
const carById = (id) => CAR_DATA.find((c) => c.id === id) || CAR_DATA[0];

const PAINTS = [
  ['#2E9BFF', 'Electric Blue'], ['#C7D3E4', 'Lunar Silver'], ['#E8425A', 'Crimson'],
  ['#FFC94D', 'Gold Rush'],     ['#3ED598', 'Mint'],         ['#7B5BE6', 'Violet Storm'],
  ['#0F172A', 'Midnight'],      ['#FF7847', 'Sunset Orange'],
  ['#DDE3EC', 'Pearl White'],   ['#19B8A6', 'Teal Glass']
];
const FINISHES = [
  { id: 'glossy',   name: 'Glossy' },
  { id: 'metallic', name: 'Metallic' },
  { id: 'matte',    name: 'Matte' }
];
const WHEEL_STYLES = [
  { id: 'std',   name: 'Standard' },
  { id: 'alloy', name: 'Alloy' },
  { id: 'turbo', name: 'Turbo' }
];
const FINISH_PRICE = 150, WHEEL_PRICE = 250;

const MODES = [
  { id: 'free',  name: 'FREE DRIVE',         ico: '🏙️', desc: 'Bina tension drive karo. Coins collect karo.',           reward: 0,   goal: {} },
  { id: 'city',  name: 'CITY DRIVE',         ico: '🏙️', desc: '1,500 m traffic ke beech, bina crash.',                  reward: 250, goal: { dist: 1500, noCrash: true } },
  { id: 'coin',  name: 'COIN CHALLENGE',     ico: '🪙', desc: '90 seconds me 40 coins pakdo.',                          reward: 400, goal: { coins: 40, time: 90 } },
  { id: 'park',  name: 'PARKING CHALLENGE',  ico: '🅿️', desc: 'Car ko marked parking bay me park karo.',                reward: 350, goal: { park: true } },
  { id: 'm1',    name: 'MISSION · LONG RUN', ico: '🛣️', desc: 'Ek hi run me 2,000 m chalo.',                            reward: 500, goal: { dist: 2000 } },
  { id: 'm2',    name: 'MISSION · COIN HUNTER', ico: '💰', desc: 'Ek run me 60 coins collect karo.',                    reward: 600, goal: { coins: 60 } },
  { id: 'm3',    name: 'MISSION · PERFECT RUN', ico: '🛡️', desc: '1,000 m bina ek bhi crash.',                           reward: 700, goal: { dist: 1000, noCrash: true } },
  { id: 'm4',    name: 'MISSION · DESTINATION', ico: '🚩', desc: '3,000 m ke checkpoint gate tak pahuncho.',            reward: 800, goal: { dist: 3000 } }
];
const modeById = (id) => MODES.find((m) => m.id === id) || MODES[0];

const ACH = [
  { id: 'first_drive',    ico: '🏁', name: 'First Drive',         desc: 'Apna pehla run complete karo' },
  { id: 'coin_100',       ico: '🪙', name: 'Coin Collector',      desc: 'Total 100 coins kamao' },
  { id: 'coin_1000',      ico: '💰', name: 'Coin Tycoon',         desc: 'Total 1,000 coins kamao' },
  { id: 'perfect_park',   ico: '🅿️', name: 'Perfect Parking',     desc: 'Parking Challenge complete karo' },
  { id: 'safe_driver',    ico: '🛡️', name: 'Safe Driver',         desc: 'Koi bhi no-crash mission complete karo' },
  { id: 'long_distance',  ico: '🛣️', name: 'Long Distance Driver', desc: 'Total 10 km drive karo' },
  { id: 'mission_master', ico: '⭐', name: 'Mission Master',       desc: '4 alag missions complete karo' },
  { id: 'super_driver',   ico: '👑', name: 'Super Driver',         desc: 'Best score 5,000+ karo' },
  { id: 'garage_baron',   ico: '🏭', name: 'Garage Baron',         desc: '4 cars khareedo' }
];
const achById = (id) => ACH.find((a) => a.id === id);

const AVATARS = ['🏎️','🚗','🚙','🚕','🛻','🏁','🎮','👑','⚡','🔥','🦅'];
const BANNERS = [
  'linear-gradient(120deg,#0B1526,#123A6B,#2E9BFF)',
  'linear-gradient(120deg,#1A0B26,#4B1B6B,#7B5BE6)',
  'linear-gradient(120deg,#26140B,#6B3A1B,#FFC94D)',
  'linear-gradient(120deg,#0B2618,#1B6B3A,#3ED598)',
  'linear-gradient(120deg,#260B14,#6B1B32,#E8425A)',
  'linear-gradient(120deg,#101820,#2A3A4A,#C7D3E4)'
];

const DAILY_CHALLENGES = [
  { id: 'dc_coins',  desc: 'Aaj 25 coins collect karo',   goal: { coins: 25 },            reward: 200 },
  { id: 'dc_dist',   desc: 'Aaj 2,000 m drive karo',      goal: { dist: 2000 },           reward: 200 },
  { id: 'dc_safe',   desc: 'Aaj 500 m bina ek bhi crash', goal: { dist: 500, noCrash: true }, reward: 250 }
];

/* ══════════════ 3. SAVE SYSTEM ══════════════ */
const SAVE_VERSION = 1;
const SAVE_KEY = 'prince3ddrive_save';

function defaultSave() {
  return {
    v: SAVE_VERSION, coins: 0, lifetimeCoins: 0,
    ownedCars: ['hatch'], selectedCar: 'hatch',
    custom: {}, unlockedFinishes: ['glossy'], unlockedWheels: ['std'],
    settings: { quality: 'high', timeOfDay: 'day', sound: true, volume: 0.7, cam: 1, ctrl: 1, steer: 1 },
    stats: { distance: 0, sessions: 0, bestScore: 0, crashes: 0, parks: 0 },
    completedMissions: {}, history: [], achievements: [],
    profile: null,
    daily: { date: '', claimed: false, coins: 0, dist: 0, crashed: false }
  };
}

function migrateSave(d) {
  const base = defaultSave();
  if (!d || typeof d !== 'object') return base;
  const out = Object.assign(base, d);
  if (!Array.isArray(out.ownedCars) || !out.ownedCars.length) out.ownedCars = ['hatch'];
  if (!out.ownedCars.includes('hatch')) out.ownedCars.unshift('hatch');
  if (!Array.isArray(out.history)) out.history = [];
  if (!Array.isArray(out.achievements)) out.achievements = [];
  if (!Array.isArray(out.unlockedFinishes) || !out.unlockedFinishes.includes('glossy')) out.unlockedFinishes = ['glossy'];
  if (!Array.isArray(out.unlockedWheels) || !out.unlockedWheels.includes('std')) out.unlockedWheels = ['std'];
  out.settings = Object.assign(base.settings, d.settings || {});
  out.stats    = Object.assign(base.stats, d.stats || {});
  out.daily    = Object.assign(base.daily, d.daily || {});
  if (typeof out.coins !== 'number' || isNaN(out.coins)) out.coins = 0;
  if (typeof out.lifetimeCoins !== 'number' || isNaN(out.lifetimeCoins)) out.lifetimeCoins = Math.max(0, out.coins);
  if (!CAR_DATA.some((c) => c.id === out.selectedCar)) out.selectedCar = 'hatch';
  out.v = SAVE_VERSION;
  return out;
}

const Save = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? migrateSave(JSON.parse(raw)) : defaultSave();
    } catch (e) {
      console.warn('Save corrupted — fresh start.', e);
      this.data = defaultSave();
    }
    return this.data;
  },
  _write: debounce(function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Save.data)); }
    catch (e) { console.warn('Could not save:', e); }
  }, 300),
  save() { this._write(); },
  saveNow() {
    clearTimeout(this._write._t);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Save.data)); }
    catch (e) { console.warn('Could not save:', e); }
  },
  reset() { this.data = defaultSave(); this.saveNow(); },
  earnCoins(n) { if (n > 0) { this.data.coins += n; this.data.lifetimeCoins += n; } this.save(); },
  spendCoins(n) { if (this.data.coins < n) return false; this.data.coins -= n; this.save(); return true; },
  historyPush(entry) {
    this.data.history.unshift(entry);
    if (this.data.history.length > 50) this.data.history.length = 50;
    this.save();
  },
  hasAch(id) { return this.data.achievements.includes(id); },
  unlockAch(id) {
    if (this.hasAch(id)) return false;
    this.data.achievements.push(id); this.save(); return true;
  }
};

window.addEventListener('beforeunload', () => Save.saveNow());
document.addEventListener('visibilitychange', () => { if (document.hidden) Save.saveNow(); });

/* ══════════════════════ 4. AUDIO ENGINE ══════════════════════ */
const AUDIO = (() => {
  let ctx = null, master = null;
  let engGain = null, engFilter = null, engOsc1 = null, engOsc2 = null;
  let engineOn = false;

  function ok() {
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function applyMaster() {
    if (!master) return;
    const s = Save.data.settings;
    master.gain.setTargetAtTime(s.sound ? s.volume * 0.9 : 0, ctx.currentTime, 0.05);
  }

  function unlock() {
    if (ctx) { ok(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      applyMaster();
    } catch (e) { console.warn('Audio unavailable', e); }
  }

  function blip(freq, dur, type, vol, delay = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, freqCut) {
    if (!ok()) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freqCut || 900;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  return {
    unlock, applyMaster,
    startEngine() {
      if (!ok() || engineOn) return;
      engOsc1 = ctx.createOscillator(); engOsc1.type = 'sawtooth'; engOsc1.frequency.value = 55;
      engOsc2 = ctx.createOscillator(); engOsc2.type = 'square';   engOsc2.frequency.value = 28;
      engFilter = ctx.createBiquadFilter(); engFilter.type = 'lowpass'; engFilter.frequency.value = 300;
      engGain = ctx.createGain(); engGain.gain.value = 0;
      engOsc1.connect(engFilter); engOsc2.connect(engFilter);
      engFilter.connect(engGain); engGain.connect(master);
      engOsc1.start(); engOsc2.start();
      engineOn = true;
    },
    setEngine(ratio, throttle) {
      if (!engineOn || !engOsc1) return;
      const t = ctx.currentTime;
      const f = 50 + ratio * 190 + throttle * 25;
      engOsc1.frequency.setTargetAtTime(f, t, 0.08);
      engOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
      engFilter.frequency.setTargetAtTime(250 + ratio * 1400 + throttle * 500, t, 0.1);
      engGain.gain.setTargetAtTime(0.035 + ratio * 0.03 + throttle * 0.045, t, 0.1);
    },
    stopEngine() {
      if (!engineOn) return;
      const t = ctx.currentTime;
      engGain.gain.setTargetAtTime(0, t, 0.06);
      const o1 = engOsc1, o2 = engOsc2;
      setTimeout(() => { try { o1.stop(); o2.stop(); } catch (e) {} }, 400);
      engOsc1 = engOsc2 = null;
      engineOn = false;
    },
    pauseEngine(on) {
      if (!engineOn || !engGain) return;
      engGain.gain.setTargetAtTime(on ? 0.01 : 0, ctx.currentTime, 0.05);
    },
    click()    { blip(620, 0.05, 'square', 0.12); },
    select()   { blip(440, 0.07, 'triangle', 0.16); blip(660, 0.09, 'triangle', 0.12, 0.05); },
    coin()     { blip(880, 0.09, 'sine', 0.22); blip(1318, 0.14, 'sine', 0.18, 0.06); },
    crash()    { noise(0.4, 0.5, 700); blip(80, 0.35, 'sawtooth', 0.25); },
    purchase() { [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.16, 'triangle', 0.16, i * 0.09)); },
    achieve()  { [660, 880, 1108, 1318, 1760].forEach((f, i) => blip(f, 0.2, 'sine', 0.16, i * 0.11)); },
    tick()     { blip(1200, 0.04, 'square', 0.08); },
    go()       { blip(392, 0.18, 'square', 0.2); blip(523, 0.3, 'square', 0.2, 0.18); }
  };
})();

(function bindAudioUnlock() {
  const once = () => { AUDIO.unlock(); document.removeEventListener('pointerdown', once); document.removeEventListener('keydown', once); };
  document.addEventListener('pointerdown', once);
  document.addEventListener('keydown', once);
})();

/* ══════════════════════════ 5. THREE.JS 3D ENGINE ══════════════════════════ */
const Game = {
  input: { gas: false, brake: false, left: false, right: false, hb: false },
  running: false, paused: false,
  mode: null,
  car: carById('hatch'),
  onFrame: null,
  onRunComplete: null,
  onCoin: null,
  onCrash: null
};

const Engine = (() => {
  if (typeof THREE === 'undefined') {
    $('#load-error').hidden = false;
    return { init() {}, setCar() {}, setQuality() {}, setTimeOfDay() {},
             startRun() {}, endRun() {}, setPaused() {}, resize() {} };
  }

  let scene, camera, renderer, clock;
  let hemi, sun, ground, fog;
  let player = null;
  let chunks = [], CHUNK = 60;
  let coinPool = [], trafficPool = [];
  let bay = null, gate = null;
  let roadTex, windowTexes = [];
  let buildingMats = [], bulbMats = [], headMats = [], tailMats = [], glowMats = [];
  let timeMode = 'day';
  let quality = 'high';
  let shake = 0;
  let raf = 0;

  const ROAD_HALF = 10;
  const BOUND = 8.4;
  const LANE_X = [-6, -2, 2, 6];

  function std(color, opt = {}) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.2, roughness: 0.7 }, opt));
  }
  function box(w, h, d, mat) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = quality !== 'low'; return m; }
  function cyl(rt, rb, h, seg, mat) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = quality !== 'low'; return m; }

  function makeRoadTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#20242e'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.03) + ')'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    const px = (x) => ((x + 10) / 20) * 256;
    g.fillStyle = '#e8e2c9';
    g.fillRect(px(-8) - 1.5, 0, 3, 256); g.fillRect(px(8) - 1.5, 0, 3, 256);
    g.fillStyle = '#d9dbe0';
    for (const lx of [-4, 0, 4]) { const p = px(lx); for (let y = 0; y < 256; y += 54) g.fillRect(p - 1, y, 2, 30); }
    const t = new THREE.CanvasTexture(c);
    t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  function makeWindowTexture(base) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 64, 128);
    for (let y = 8; y < 128; y += 14) for (let x = 8; x < 64; x += 14) {
      const lit = Math.random() > 0.45;
      g.fillStyle = lit ? (Math.random() > 0.5 ? '#ffe6a3' : '#bfe3ff') : 'rgba(0,0,0,0.35)';
      g.fillRect(x, y, 8, 8);
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    return t;
  }
  function makeGlowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,201,77,0.9)'); rg.addColorStop(1, 'rgba(255,201,77,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function buildCar(spec, color, finish, wheelStyle) {
    const g = new THREE.Group();
    const fin = { glossy: { m: 0.55, r: 0.28 }, metallic: { m: 0.95, r: 0.18 }, matte: { m: 0.12, r: 0.72 } }[finish || 'glossy'];
    const paint = std(new THREE.Color(color), { metalness: fin.m, roughness: fin.r });
    const glass = std(new THREE.Color('#0e1a2b'), { metalness: 0.9, roughness: 0.08 });
    const dark = std(new THREE.Color('#0b0f16'), { metalness: 0.3, roughness: 0.6 });
    const L = spec.len, W = spec.wid, H = spec.hgt, R = spec.roof;

    const body = box(L, H * 0.62, W, paint); body.position.y = H * 0.32; g.add(body);
    const hood = box(L * 0.98, H * 0.42, W * 0.98, paint); hood.position.y = H * 0.7; g.add(hood);

    const roof = box(L * 0.52, R, W * 0.86, paint);
    roof.position.set(L * 0.02, H * 0.7 + R * 0.55, 0); g.add(roof);
    const windshield = box(0.06, R * 0.9, W * 0.8, glass);
    windshield.position.set(L * 0.02 + L * 0.26, H * 0.7 + R * 0.5, 0); windshield.rotation.z = -0.45; g.add(windshield);
    const rearGlass = box(0.06, R * 0.85, W * 0.8, glass);
    rearGlass.position.set(L * 0.02 - L * 0.26, H * 0.7 + R * 0.48, 0); rearGlass.rotation.z = 0.4; g.add(rearGlass);
    const sideL = box(L * 0.44, R * 0.8, 0.05, glass); sideL.position.set(0, H * 0.7 + R * 0.5, W * 0.43); g.add(sideL);
    const sideR = sideL.clone(); sideR.position.z = -W * 0.43; g.add(sideR);

    if (spec.spoiler) {
      const sp = box(0.5, 0.08, W * 0.9, dark); sp.position.set(-L * 0.46, H + 0.15, 0); g.add(sp);
      const spL = box(0.1, 0.18, 0.1, dark); spL.position.set(-L * 0.46, H + 0.05, W * 0.3); g.add(spL);
      const spR = spL.clone(); spR.position.z = -W * 0.3; g.add(spR);
    }

    const frontBump = box(0.3, H * 0.3, W * 0.96, dark); frontBump.position.set(L * 0.5, H * 0.2, 0); g.add(frontBump);
    const rearBump = box(0.3, H * 0.3, W * 0.96, dark); rearBump.position.set(-L * 0.5, H * 0.2, 0); g.add(rearBump);

    const headMat = std(new THREE.Color('#fff7e0'), { emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.3 });
    const tailMat = std(new THREE.Color('#ff3b4e'), { emissive: new THREE.Color('#ff2436'), emissiveIntensity: 1.2, metalness: 0.3, roughness: 0.35 });
    headMats.push(headMat); tailMats.push(tailMat);
    const hL = box(0.12, 0.16, 0.4, headMat); hL.position.set(L * 0.5 + 0.02, H * 0.42, W * 0.32); g.add(hL);
    const hR = hL.clone(); hR.position.z = -W * 0.32; g.add(hR);
    const tL = box(0.1, 0.14, 0.4, tailMat); tL.position.set(-L * 0.5 - 0.02, H * 0.42, W * 0.32); g.add(tL);
    const tR = tL.clone(); tR.position.z = -W * 0.32; g.add(tR);

    const rollGroups = [], steerGroups = [];
    const tireMat = std(new THREE.Color('#0c0f14'), { metalness: 0.2, roughness: 0.9 });
    const rimMat = std(new THREE.Color(wheelStyle === 'turbo' ? '#FFC94D' : wheelStyle === 'alloy' ? '#c9d3e0' : '#5a6675'),
      { metalness: 0.85, roughness: 0.3 });
    const r = 0.34, ww = 0.28;
    const mkWheel = (x, z, front) => {
      const sg = new THREE.Group(); sg.position.set(x, r, z);
      const rg = new THREE.Group();
      const tire = cyl(r, r, ww, 18, tireMat); tire.rotation.z = Math.PI / 2; rg.add(tire);
      const rim = cyl(r * 0.5, r * 0.5, ww + 0.02, 8, rimMat); rim.rotation.z = Math.PI / 2; rg.add(rim);
      sg.add(rg); g.add(sg);
      rollGroups.push(rg); if (front) steerGroups.push(sg);
    };
    const wy = W * 0.5 - 0.02, wx = L * 0.3;
    mkWheel(wx, wy, true); mkWheel(wx, -wy, true);
    mkWheel(-wx, wy, false); mkWheel(-wx, -wy, false);

    g.traverse((o) => { if (o.isMesh) { o.castShadow = quality !== 'low'; o.receiveShadow = false; } });
    return { group: g, rollGroups, steerGroups };
  }

  function setPlayerCar(carId) {
    const car = carById(carId);
    const cust = Save.data.custom[carId] || {};
    const color = cust.paint || car.color;
    const finish = cust.finish && Save.data.unlockedFinishes.includes(cust.finish) ? cust.finish : 'glossy';
    const wheel = cust.wheels && Save.data.unlockedWheels.includes(cust.wheels) ? cust.wheels : car.model.wheels;
    if (player) scene.remove(player.group);
    const b = buildCar(car.model, color, finish, wheel);
    b.group.position.set(0, 0, 0);
    player = { group: b.group, rollGroups: b.rollGroups, steerGroups: b.steerGroups, car, heading: 0 };
    scene.add(b.group);
  }

  function makeTree() {
    const t = new THREE.Group();
    const trunk = cyl(0.12, 0.18, 1.1, 6, std(0x5a3b22)); trunk.position.y = 0.55; t.add(trunk);
    const fol = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.0, 8), std(pick([0x2f7d4f, 0x3c8a5a, 0x2e6b46]), { roughness: 0.8 }));
    fol.position.y = 1.9; fol.castShadow = quality !== 'low'; t.add(fol);
    return t;
  }
  function makeStreetlight() {
    const g = new THREE.Group();
    const pole = cyl(0.08, 0.1, 4.2, 6, std(0x2b3340, { metalness: 0.6, roughness: 0.5 })); pole.position.y = 2.1; g.add(pole);
    const arm = box(1.2, 0.08, 0.08, std(0x2b3340, { metalness: 0.6 })); arm.position.set(-0.5, 4.1, 0); g.add(arm);
    const bulbMat = std(0xfff2c0, { emissive: new THREE.Color('#fff0b0'), emissiveIntensity: 0.4, roughness: 0.4 });
    bulbMats.push(bulbMat);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), bulbMat); bulb.position.set(-1.0, 4.05, 0); g.add(bulb);
    return g;
  }
  function makeBuilding() {
    const w = rand(6, 14), d = rand(6, 14), h = rand(10, 42);
    const tex = pick(windowTexes);
    const mat = std(new THREE.Color(pick(['#2a3550', '#33405e', '#26324a', '#3a2f4a'])),
      { roughness: 0.85, metalness: 0.15, map: tex, emissive: new THREE.Color('#ffcf7a'), emissiveMap: tex, emissiveIntensity: 0.25 });
    buildingMats.push(mat);
    const m = box(w, h, d, mat); m.position.y = h / 2; m.castShadow = quality !== 'low';
    return { mesh: m, h };
  }
  function makeCoin() {
    const g = new THREE.Group();
    const disc = cyl(0.42, 0.42, 0.09, 24, std(0xFFC94D, { metalness: 1, roughness: 0.2, emissive: 0x5a3d00, emissiveIntensity: 0.4 }));
    disc.rotation.x = Math.PI / 2; g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 24), std(0xFFE08A, { metalness: 1, roughness: 0.25 }));
    g.add(rim);
    const glowTex = makeGlowTexture();
    const glowM = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
    glowMats.push(glowM);
    const glow = new THREE.Sprite(glowM); glow.scale.set(1.6, 1.6, 1); g.add(glow);
    g.userData = { active: true, t: 0, baseY: 0.7 };
    scene.add(g);
    return g;
  }
  function makeTrafficCar() {
    const spec = { len: 4.2, wid: 1.8, hgt: 1.4, roof: 0.6, spoiler: false, wheels: 'std' };
    const color = pick(['#8a93a5', '#5a6b85', '#37455e', '#7a4a4a', '#4a7a5a', '#6a5a8a', '#b0a080']);
    const b = buildCar(spec, color, 'glossy', 'std');
    b.group.visible = false;
    scene.add(b.group);
    return { group: b.group, rollGroups: b.rollGroups, lane: 0, speed: 12, x: 0, active: false };
  }

  function buildChunk() {
    const g = new THREE.Group();
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, CHUNK),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95, metalness: 0 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, -CHUNK / 2); road.receiveShadow = quality !== 'low'; g.add(road);

    const walkMat = std(0x8a93a5, { roughness: 0.9 });
    for (const s of [-1, 1]) {
      const sw = box(3.4, 0.28, CHUNK, walkMat); sw.position.set(s * (ROAD_HALF + 1.7), 0.14, -CHUNK / 2); sw.receiveShadow = true; g.add(sw);
      const curb = box(0.3, 0.34, CHUNK, std(0xb9c0cc, { roughness: 0.8 })); curb.position.set(s * (ROAD_HALF + 0.1), 0.12, -CHUNK / 2); g.add(curb);
    }

    const deco = new THREE.Group(); g.add(deco); g.userData.deco = deco;
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) {
        const b = makeBuilding();
        b.mesh.position.set(s * rand(ROAD_HALF + 8, ROAD_HALF + 24), b.h / 2, -rand(4, CHUNK - 4));
        deco.add(b.mesh);
      }
    }
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) {
        const tr = makeTree(); tr.position.set(s * (ROAD_HALF + 2.2), 0, -rand(3, CHUNK - 3)); deco.add(tr);
        const sl = makeStreetlight(); sl.position.set(s * (ROAD_HALF + 0.6), 0, -((i + 0.5) / 4) * CHUNK);
        if (s < 0) sl.rotation.y = Math.PI;
        deco.add(sl);
      }
    }
    return g;
  }
  function initChunks() {
    chunks = [];
    for (let i = 0; i < 8; i++) {
      const c = buildChunk(); c.position.z = -i * CHUNK;
      scene.add(c); chunks.push(c);
    }
  }
  function recycleChunks() {
    let minZ = Infinity;
    for (const c of chunks) if (c.position.z < minZ) minZ = c.position.z;
    for (const c of chunks) {
      if (c.position.z > player.group.position.z + CHUNK) {
        c.position.z = minZ - CHUNK; minZ = c.position.z;
      }
    }
  }

  function makeGate() {
    const g = new THREE.Group();
    const pMat = std(0xFFC94D, { metalness: 0.7, roughness: 0.3, emissive: 0x5a3d00, emissiveIntensity: 0.5 });
    const p1 = box(0.5, 6, 0.5, pMat); p1.position.set(-6, 3, 0); g.add(p1);
    const p2 = box(0.5, 6, 0.5, pMat); p2.position.set(6, 3, 0); g.add(p2);
    const beam = box(12.5, 1.2, 0.5, pMat); beam.position.set(0, 6, 0); g.add(beam);
    return g;
  }
  function makeBay() {
    const g = new THREE.Group();
    const line = (w, d, x, z) => { const m = box(w, 0.03, d, std(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 })); m.position.set(x, 0.05, z); g.add(m); };
    line(2.8, 0.15, 0, -2.5); line(2.8, 0.15, 0, 2.5); line(0.15, 5, -1.4, 0); line(0.15, 5, 1.4, 0);
    const pole = cyl(0.1, 0.1, 3, 8, std(0x2b3340)); pole.position.set(2.2, 1.5, -2.5); g.add(pole);
    const sign = box(1.2, 1.2, 0.1, std(0x1b6b3a, { emissive: 0x0a3a1e, emissiveIntensity: 0.5 })); sign.position.set(2.2, 3.2, -2.5); g.add(sign);
    return g;
  }

  function applyTime() {
    const night = timeMode === 'night';
    const sky = night ? 0x070d1c : 0xbcd7ff;
    scene.background = new THREE.Color(sky);
    fog.color.setHex(sky);
    fog.far = night ? 150 : 300; fog.near = 20;
    hemi.intensity = night ? 0.35 : 0.95;
    sun.intensity = night ? 0.3 : 1.15;
    sun.color.setHex(night ? 0x8fb4ff : 0xfff2d8);
    const b = night ? 2.4 : 0.35, he = night ? 2.2 : 0.9, te = night ? 2.0 : 0.7, gl = night ? 1 : 0.7;
    for (const m of bulbMats) m.emissiveIntensity = b;
    for (const m of headMats) m.emissiveIntensity = he;
    for (const m of tailMats) m.emissiveIntensity = te;
    for (const m of buildingMats) m.emissiveIntensity = night ? 0.9 : 0.22;
    ground.material.color.setHex(night ? 0x0c1420 : 0x2a3320);
    for (const m of glowMats) m.opacity = night ? 0.9 : 0.6;
  }
  function applyQuality() {
    const dpr = Math.min(window.devicePixelRatio || 1, quality === 'ultra' ? 3 : quality === 'high' ? 2 : 1);
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.needsUpdate = true;
    if (sun) { sun.shadow.mapSize.set(quality === 'low' ? 0 : 2048, quality === 'low' ? 0 : 2048); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    for (const c of chunks) c.userData.deco.visible = quality !== 'low';
    if (player) player.group.traverse((o) => { if (o.isMesh) o.castShadow = quality !== 'low'; });
    renderer.toneMappingExposure = quality === 'ultra' ? 1.15 : 1.05;
  }

  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    fog = new THREE.Fog(0xbcd7ff, 20, 300);
    scene.fog = fog;

    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 700);
    camera.position.set(0, 5, 9);

    hemi = new THREE.HemisphereLight(0xdff0ff, 0x2a2418, 0.95); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2d8, 1.15);
    sun.position.set(12, 26, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34;
    sun.shadow.bias = -0.0004;
    scene.add(sun); scene.add(sun.target);

    ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 900), std(0x2a3320, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; ground.receiveShadow = true; scene.add(ground);

    roadTex = makeRoadTexture(); roadTex.repeat.set(1, CHUNK / 12);
    windowTexes = [makeWindowTexture('#243049'), makeWindowTexture('#2c2440'), makeWindowTexture('#1f2a3a')];

    quality = Save.data.settings.quality;
    timeMode = Save.data.settings.timeOfDay;

    initChunks();
    setPlayerCar(Save.data.selectedCar);
    for (let i = 0; i < 22; i++) coinPool.push(makeCoin());
    for (let i = 0; i < 8; i++) trafficPool.push(makeTrafficCar());

    applyQuality(); applyTime();
    scatterCoins(true); setTraffic(4);

    clock = new THREE.Clock();
    resize();
    window.addEventListener('resize', resize);
    loop();
  }

  function resize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function scatterCoins(init) {
    for (const c of coinPool) {
      if (init) { c.position.set(pick(LANE_X), 0.7, player.group.position.z - rand(20, 160)); }
      else { c.position.set(pick(LANE_X), 0.7, player.group.position.z - rand(40, 180)); }
      c.visible = true; c.scale.set(1, 1, 1); c.userData.active = true; c.userData.t = 0;
    }
  }
  function setTraffic(n) {
    trafficPool.forEach((t, i) => {
      t.active = i < n; t.group.visible = t.active;
      if (t.active) { t.lane = randi(0, 3); t.x = LANE_X[t.lane]; t.speed = rand(8, 20); t.group.position.set(t.x, 0, player.group.position.z - rand(60, 220)); }
    });
  }

  function startRun(mode) {
    Game.mode = mode; Game.running = true; Game.paused = false;
    const p = player.group.position; p.set(0, 0, 0);
    player.group.rotation.set(0, 0, 0); player.heading = 0;
    scatterCoins(true);
    setTraffic(mode.id === 'city' ? 8 : mode.id === 'free' ? 4 : 6);

    bay && scene.remove(bay); gate && scene.remove(gate);
    if (mode.goal && mode.goal.park) { bay = makeBay(); bay.position.set(6, 0, -38); scene.add(bay); }
    if (mode.id === 'm4') { gate = makeGate(); gate.position.set(0, 0, -3000); scene.add(gate); }

    Game.run = { dist: 0, coins: 0, crashes: 0, park: false, time: 0, maxSpeed: 0 };
    AUDIO.go();
  }
  function endRun() {
    if (!Game.running) return;
    Game.running = false;
    AUDIO.stopEngine(); AUDIO.pauseEngine(false);
    const r = Game.run, goal = (Game.mode && Game.mode.goal) || {};
    const noCrash = r.crashes === 0;
    let complete = true;
    if (goal.dist && r.dist < goal.dist) complete = false;
    if (goal.coins && r.coins < goal.coins) complete = false;
    if (goal.noCrash && !noCrash) complete = false;
    if (goal.park && !r.park) complete = false;
    const reward = complete && Game.mode ? Game.mode.reward : 0;
    const score = Math.round(r.coins * 10 + r.dist * 0.5 + (noCrash && r.dist > 100 ? 500 : 0) + reward);
    if (complete && reward) { Save.earnCoins(reward); }
    const summary = { mode: Game.mode, dist: r.dist, coins: r.coins, crashes: r.crashes, time: r.time, park: r.park, complete, reward, score, carId: Game.car.id };
    Game.running = false;
    if (Game.onRunComplete) Game.onRunComplete(summary);
  }

  function stepPhysics(dt) {
    const p = player.group.position;
    const car = Game.car, st = car.stats;
    const maxSpeed = st.speed * 0.6;
    const acc = st.acc * 0.85;
    let speed = p.userData.speed || 0;

    const inp = Game.input;
    if (inp.gas) speed += acc * dt * (Save.data.settings.ctrl || 1);
    if (inp.brake) { if (speed > 0) speed -= 26 * dt; else speed -= 4 * dt; }
    if (inp.hb) speed -= (speed > 0 ? 34 : 8) * dt;
    if (!inp.gas && !inp.brake) speed -= Math.sign(speed) * Math.min(Math.abs(speed), 1.2 * dt);
    speed = clamp(speed, -12, maxSpeed);
    p.userData.speed = speed;
    p.z -= speed * dt;
    p.y = 0;

    const steer = (inp.left ? -1 : 0) + (inp.right ? 1 : 0);
    const sf = clamp(Math.abs(speed) / 10, 0, 1) * (0.55 + 0.45 * clamp(Math.abs(speed) / maxSpeed, 0, 1));
    p.x += steer * st.hand * 1.7 * sf * (speed < -1 ? -1 : 1) * dt * 3.2 * (Save.data.settings.steer || 1);
    p.x = clamp(p.x, -BOUND, BOUND);

    player.heading += (steer * 0.16 * sf - player.heading) * Math.min(1, dt * 8);
    player.group.rotation.y = player.heading;
    player.group.rotation.z += ((-steer * 0.03 * sf) - player.group.rotation.z) * Math.min(1, dt * 8);
    player.group.rotation.x += ((speed / maxSpeed) * -0.01) * dt * 4;

    const spin = (speed / 0.34) * dt;
    for (const rg of player.rollGroups) rg.rotation.x += spin;
    for (const sg of player.steerGroups) sg.rotation.y += (steer * 0.35 - sg.rotation.y) * Math.min(1, dt * 10);

    AUDIO.setEngine(clamp(Math.abs(speed) / maxSpeed, 0, 1), inp.gas ? 1 : 0);

    if (Game.running) {
      const r = Game.run;
      r.dist += Math.max(0, speed) * dt;
      r.time += dt;
      r.maxSpeed = Math.max(r.maxSpeed, Math.abs(speed) * 3.6);
      if (Game.mode && Game.mode.goal && Game.mode.goal.park && !r.park && bay) {
        if (Math.abs(p.x - 6) < 1.3 && Math.abs(p.z - (-38)) < 2.6 && Math.abs(speed) < 2) { r.park = true; }
      }
    }

    ground.position.z = p.z;
    sun.position.set(p.x + 12, 26, p.z + 10);
    sun.target.position.set(p.x, 0, p.z - 6);
  }

  function stepCoins(dt) {
    const p = player.group.position;
    for (const c of coinPool) {
      if (c.userData.active) {
        c.rotation.y += dt * 3;
        c.position.y = c.userData.baseY + Math.sin(c.position.z * 0.3) * 0.05;
        const dx = c.position.x - p.x, dz = c.position.z - p.z;
        if (dx * dx + dz * dz < 2.4 * 2.4) {
          c.userData.active = false; c.userData.t = 0.35;
          if (Game.running) { Game.run.coins++; if (Game.onCoin) Game.onCoin(); }
        }
        if (c.position.z > p.z + 18) respawnCoin(c);
      } else {
        c.userData.t -= dt;
        const s = clamp(c.userData.t / 0.35, 0, 1);
        c.scale.set(s, s, s);
        if (c.userData.t <= 0) respawnCoin(c);
      }
    }
  }
  function respawnCoin(c) { c.position.set(pick(LANE_X), 0.7, player.group.position.z - rand(50, 190)); c.visible = true; c.scale.set(1, 1, 1); c.userData.active = true; }

  function stepTraffic(dt) {
    const p = player.group.position;
    for (const t of trafficPool) {
      if (!t.active) continue;
      t.group.position.z -= t.speed * dt;
      t.group.position.x = t.x;
      for (const rg of t.rollGroups) rg.rotation.x -= (t.speed / 0.34) * dt;
      const dx = t.group.position.x - p.x, dz = t.group.position.z - p.z;
      if (dx * dx + dz * dz < 3.1 * 3.1) {
        const s = p.userData.speed || 0;
        if (s > 5 && !t.userData.hitCd) {
          t.userData.hitCd = 1.2;
          p.userData.speed = s * -0.25;
          if (Game.running) Game.run.crashes++;
          shake = 1;
          if (Game.onCrash) Game.onCrash();
          AUDIO.crash();
        }
      }
      if (t.userData.hitCd > 0) t.userData.hitCd -= dt;
      if (t.group.position.z > p.z + 12 || t.group.position.z < p.z - 260) {
        t.x = LANE_X[randi(0, 3)]; t.speed = rand(8, 20);
        t.group.position.set(t.x, 0, p.z - rand(80, 240));
      }
    }
  }

  function stepCamera(dt) {
    const p = player.group.position;
    const speed = p.userData.speed || 0;
    const sr = clamp(Math.abs(speed) / (Game.car.stats.speed * 0.6), 0, 1);
    const steer = (Game.input.left ? -1 : 0) + (Game.input.right ? 1 : 0);
    const sens = Save.data.settings.cam;
    const dx = p.x + steer * 1.4 * sens, dy = 4.4 + sr * 0.8, dz = p.z + 7.6 * sens;
    camera.position.x += (dx - camera.position.x) * Math.min(1, dt * 5);
    camera.position.y += (dy - camera.position.y) * Math.min(1, dt * 5);
    camera.position.z += (dz - camera.position.z) * Math.min(1, dt * 5);
    if (shake > 0) { camera.position.x += rand(-1, 1) * shake * 0.4; camera.position.y += rand(-1, 1) * shake * 0.4; shake = Math.max(0, shake - dt * 2); }
    camera.lookAt(p.x + steer * 2, 1.3, p.z - 3);
    const targetFov = 60 + sr * 10;
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 3);
    camera.updateProjectionMatrix();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const active = Game.running && !Game.paused;

    if (active) {
      stepPhysics(dt);
      stepCoins(dt);
      stepTraffic(dt);
      recycleChunks();
      const goal = Game.mode.goal || {};
      if (goal.dist && Game.run.dist >= goal.dist && !(goal.coins || goal.park)) endRun();
      else if (goal.coins && Game.run.coins >= goal.coins) endRun();
      else if (goal.park && Game.run.park) endRun();
      else if (goal.time && Game.run.time >= goal.time) endRun();
    }
    stepCamera(dt);
    if (Game.onFrame) Game.onFrame(dt);
    renderer.render(scene, camera);
  }

  return {
    init, resize,
    setCar(id) { Game.car = carById(id); setPlayerCar(id); },
    setQuality(q) { quality = q; applyQuality(); },
    setTimeOfDay(t) { timeMode = t; applyTime(); },
    startRun, endRun,
    setPaused(v) { Game.paused = v; if (v) { AUDIO.stopEngine(); } else if (Game.running) { AUDIO.startEngine(); } },
    isRunning() { return Game.running; }
  };
})();

/* ══════════════════════════ 6. UI & CONTROLS ══════════════════════════ */
const COIN_VALUE = 5;
let currentScreen = null;
let lastMode = null;
let prevDist = 0;
let inGame = false;
let garageSel = Save.data.selectedCar;
let pfDraft = null;

const Toast = (() => {
  let busy = false, queue = [];
  function show(ico, name, desc) {
    if (busy) { queue.push([ico, name, desc]); return; }
    busy = true;
    $('#ach-ico').textContent = ico;
    $('#ach-name').textContent = name;
    $('#ach-desc').textContent = desc || '';
    const t = $('#ach-toast');
    t.hidden = false;
    setTimeout(() => { t.hidden = true; busy = false; if (queue.length) show(...queue.shift()); }, 2900);
  }
  return { show };
})();

function showScreen(name) {
  currentScreen = name;
  $$('.screen').forEach((s) => s.classList.remove('active'));
  if (name) $('#screen-' + name).classList.add('active');
}

function refreshMenu() {
  $('#menu-coins').textContent = fmtN(Save.data.coins);
  $('#menu-car-name').textContent = carById(Save.data.selectedCar).name;
}

function renderModes() {
  const list = $('#mode-list');
  list.innerHTML = '';
  MODES.forEach((m) => {
    const done = !!Save.data.completedMissions[m.id];
    const el = document.createElement('button');
    el.className = 'mode-card';
    el.innerHTML =
      '<span class="mode-ico">' + m.ico + '</span>' +
      '<span class="mode-txt"><b>' + (done ? '✓ ' : '') + m.name + '</b><small>' + m.desc + '</small></span>' +
      '<span class="mode-reward ' + (done ? 'mode-done' : '') + '">' + (done ? 'COMPLETED' : (m.reward ? '🪙 +' + fmtN(m.reward) : '∞')) + '</span>';
    el.onclick = () => { AUDIO.select(); beginRun(m); };
    list.appendChild(el);
  });
}

function beginRun(mode) {
  if (typeof THREE === 'undefined') { Toast.show('⚠️', '3D ENGINE READY NAHI', 'Internet check karo, page refresh karo'); return; }
  lastMode = mode;
  inGame = true;
  Game.paused = false;
  showScreen(null);
  $('#hud').hidden = false;
  $('#touch').hidden = !IS_TOUCH;
  prevDist = 0;
  $('#hud-car').textContent = carById(Save.data.selectedCar).name;
  updateHUDMode(mode);
  Engine.startRun(mode);
  AUDIO.startEngine();
}

function exitToMenu() {
  inGame = false;
  Game.paused = false;
  Game.input.gas = Game.input.brake = Game.input.left = Game.input.right = Game.input.hb = false;
  Engine.setPaused(false);
  $('#hud').hidden = true;
  $('#touch').hidden = true;
  $('#summary').hidden = true;
  $('#pause-menu').hidden = true;
  refreshMenu();
  showScreen('menu');
}

function updateHUDMode(m) {
  $('#hud-mode').textContent = m.name;
  const g = m.goal || {};
  const o = $('#hud-objective');
  if (g.coins && g.time) o.textContent = g.coins + ' coins in ' + g.time + ' sec';
  else if (g.coins) o.textContent = g.coins + ' coins collect karo';
  else if (g.dist && g.noCrash) o.textContent = g.dist.toLocaleString() + ' m, zero crash';
  else if (g.dist) o.textContent = g.dist.toLocaleString() + ' m tak pahuncho';
  else if (g.park) o.textContent = 'Marked bay me park karo';
  else o.textContent = 'Coins pakdo, door chalo';
  $('#hud-timer').hidden = !g.time;
  $('#hud-prog-wrap').hidden = !(g.coins || g.dist);
}

function finishRun(s) {
  const d = Save.data;
  d.stats.distance += s.dist;
  d.stats.sessions++;
  d.stats.crashes += s.crashes;
  if (s.park) d.stats.parks++;
  d.stats.bestScore = Math.max(d.stats.bestScore, s.score);
  if (s.complete && s.mode) d.completedMissions[s.mode.id] = true;
  const day = todayStr();
  if (d.daily.date !== day) d.daily = { date: day, claimed: false, coins: 0, dist: 0, crashed: false };
  d.daily.coins += s.coins;
  d.daily.dist += s.dist;
  if (s.crashes > 0) d.daily.crashed = true;
  Save.historyPush({
    car: s.carId, dist: Math.round(s.dist), coins: s.coins, crashes: s.crashes,
    mode: s.mode.name, complete: s.complete, score: s.score, date: new Date().toISOString()
  });
  Save.save();
  checkAchievements();
  updateDailyToast();
}

function checkAchievements() {
  const d = Save.data;
  const tryU = (id) => {
    if (Save.unlockAch(id)) {
      const a = achById(id);
      Toast.show(a.ico, '🏆 ACHIEVEMENT · ' + a.name, a.desc);
      AUDIO.achieve();
    }
  };
  if (d.stats.sessions >= 1) tryU('first_drive');
  if (d.lifetimeCoins >= 100) tryU('coin_100');
  if (d.lifetimeCoins >= 1000) tryU('coin_1000');
  if (d.stats.parks >= 1) tryU('perfect_park');
  for (const m of MODES) if (m.goal && m.goal.noCrash && d.completedMissions[m.id]) { tryU('safe_driver'); break; }
  if (d.stats.distance >= 10000) tryU('long_distance');
  if (Object.keys(d.completedMissions).length >= 4) tryU('mission_master');
  if (d.stats.bestScore >= 5000) tryU('super_driver');
  if (d.ownedCars.length >= 4) tryU('garage_baron');
}

function showSummary(s) {
  inGame = false;
  Game.input.gas = Game.input.brake = Game.input.left = Game.input.right = Game.input.hb = false;
  $('#hud').hidden = true;
  $('#touch').hidden = true;
  $('#pause-menu').hidden = true;
  const m = s.mode;
  $('#sum-title').textContent = s.complete ? '🏆 ' + m.name + ' — COMPLETE' : '🏁 RUN COMPLETE';
  const rows = [
    ['Distance', fmtDist(s.dist)],
    ['Coins collected', '🪙 ' + s.coins],
    ['Crashes', s.crashes + (s.crashes === 0 ? ' 🛡️' : '')],
    ['Time', fmtTime(s.time)],
    ['Parking', s.park ? '✅ Parked' : '—']
  ];
  if (s.complete && s.reward) rows.push(['Mission reward', '🪙 +' + fmtN(s.reward)]);
  $('#sum-rows').innerHTML = rows.filter((r) => r[1] !== '—').map(
    (r) => '<div class="srow"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'
  ).join('');
  $('#sum-score').textContent = fmtN(s.score);
  $('#summary').hidden = false;
  AUDIO.go();
}

function dailyGoalMet(p, g) {
  return (!g.coins || p.coins >= g.coins) && (!g.dist || p.dist >= g.dist) && (!g.noCrash || !p.crashed);
}
function updateDailyToast() {
  const d = Save.data;
  const day = todayStr();
  if (d.daily.date !== day) {
    d.daily = { date: day, claimed: false, coins: 0, dist: 0, crashed: false };
    Save.save();
    return;
  }
  if (d.daily.claimed) return;
  const dc = DAILY_CHALLENGES.find((c) => dailyGoalMet(d.daily, c.goal));
  if (!dc) return;
  $('#daily-desc').textContent = dc.desc + '  →  🪙 +' + dc.reward;
  $('#daily-toast').hidden = false;
}
$('#btn-daily-claim').onclick = () => {
  const d = Save.data;
  const dc = DAILY_CHALLENGES.find((c) => dailyGoalMet(d.daily, c.goal));
  if (!dc || d.daily.claimed) return;
  d.daily.claimed = true;
  Save.earnCoins(dc.reward);
  Save.save();
  AUDIO.purchase();
  Toast.show('📅', 'DAILY CLAIMED', '+' + dc.reward + ' coins. Kal naya challenge milega!');
  $('#daily-toast').hidden = true;
  refreshMenu();
};

function renderGarage() {
  $('#garage-coins').textContent = fmtN(Save.data.coins);
  const list = $('#garage-list');
  list.innerHTML = '';
  CAR_DATA.forEach((c) => {
    const owned = Save.data.ownedCars.includes(c.id);
    const eq = Save.data.selectedCar === c.id;
    const el = document.createElement('button');
    el.className = 'car-item' + (c.id === garageSel ? ' sel' : '');
    el.innerHTML =
      '<span class="car-dot" style="background:' + c.color + '"></span>' +
      '<span class="ci-txt"><b>' + c.name + '</b><small>' + c.blurb + '</small></span>' +
      '<span class="ci-tag ' + (eq ? 'eq' : owned ? 'free' : 'price') + '">' + (eq ? 'EQUIPPED' : owned ? 'OWNED' : '🪙 ' + fmtN(c.price)) + '</span>';
    el.onclick = () => { AUDIO.select(); garageSel = c.id; renderGarage(); };
    list.appendChild(el);
  });
  updateGarageDetail();
}

function updateGarageDetail() {
  const c = carById(garageSel);
  const d = Save.data;
  const owned = d.ownedCars.includes(c.id);
  $('#garage-name').textContent = c.name;
  const st = $('#garage-status');
  st.className = 'badge ' + (d.selectedCar === c.id ? 'gold' : owned ? 'ok' : 'no');
  st.textContent = d.selectedCar === c.id ? 'EQUIPPED' : owned ? 'OWNED' : 'LOCKED';
  $('#st-speed').style.width = (c.stats.speed / 150 * 100) + '%';
  $('#st-speed-v').textContent = c.stats.speed + '';
  $('#st-acc').style.width = (c.stats.acc / 30 * 100) + '%';
  $('#st-acc-v').textContent = c.stats.acc + '';
  $('#st-hand').style.width = (c.stats.hand / 10 * 100) + '%';
  $('#st-hand-v').textContent = c.stats.hand + '/10';
  const buy = $('#btn-garage-buy');
  buy.disabled = owned || c.price === 0;
  buy.textContent = c.price === 0 ? 'FREE' : '🪙 ' + fmtN(c.price) + ' — BUY';
  $('#btn-garage-select').disabled = !owned;
  renderCust(c, owned);
}

function renderCust(c, owned) {
  const d = Save.data;
  const cust = d.custom[c.id] || (d.custom[c.id] = { paint: null, finish: 'glossy', wheels: c.model.wheels });
  $('#cust-lock').hidden = owned;
  const paints = $('#cust-paints');
  paints.innerHTML = '';
  PAINTS.forEach(([hex, name]) => {
    const sw = document.createElement('button');
    sw.className = 'sw' + ((cust.paint || c.color) === hex ? ' sel' : '') + (owned ? '' : ' locked');
    sw.style.background = hex;
    sw.title = name;
    sw.onclick = () => {
      if (!owned) return;
      cust.paint = hex; Save.save();
      Engine.setCar(c.id); AUDIO.select();
      renderGarage();
    };
    paints.appendChild(sw);
  });
  const fins = $('#cust-finishes');
  fins.innerHTML = '';
  FINISHES.forEach((f) => {
    const has = d.unlockedFinishes.includes(f.id);
    const b = document.createElement('button');
    b.className = 'ts' + ((cust.finish || 'glossy') === f.id ? ' sel' : '') + (!has ? ' locked' : '');
    b.textContent = f.name;
    b.onclick = () => {
      if (!owned) return;
      if (!has) {
        if (Save.spendCoins(FINISH_PRICE)) { d.unlockedFinishes.push(f.id); Save.save(); AUDIO.purchase(); Toast.show('🎨', f.name.toUpperCase() + ' UNLOCKED', 'Ab har car par use kar sakte ho'); }
        else { AUDIO.click(); Toast.show('😅', 'COINS NAHI', 'Unlock ke liye ' + FINISH_PRICE + ' coins chahiye'); return; }
      }
      cust.finish = f.id; Save.save();
      Engine.setCar(c.id); AUDIO.select();
      renderGarage();
    };
    fins.appendChild(b);
  });
  const wheels = $('#cust-wheels');
  wheels.innerHTML = '';
  WHEEL_STYLES.forEach((w) => {
    const has = d.unlockedWheels.includes(w.id);
    const b = document.createElement('button');
    b.className = 'ts' + (cust.wheels === w.id ? ' sel' : '') + (!has ? ' locked' : '');
    b.textContent = w.name;
    b.onclick = () => {
      if (!owned) return;
      if (!has) {
        if (Save.spendCoins(WHEEL_PRICE)) { d.unlockedWheels.push(w.id); Save.save(); AUDIO.purchase(); Toast.show('🛞', w.name.toUpperCase() + ' UNLOCKED', 'Ab har car par use kar sakte ho'); }
        else { AUDIO.click(); Toast.show('😅', 'COINS NAHI', 'Unlock ke liye ' + WHEEL_PRICE + ' coins chahiye'); return; }
      }
      cust.wheels = w.id; Save.save();
      Engine.setCar(c.id); AUDIO.select();
      renderGarage();
    };
    wheels.appendChild(b);
  });
}

function renderMyCars() {
  $('#mycars-coins').textContent = fmtN(Save.data.coins);
  const list = $('#mycars-list');
  list.innerHTML = '';
  CAR_DATA.filter((c) => Save.data.ownedCars.includes(c.id)).forEach((c) => {
    const eq = Save.data.selectedCar === c.id;
    const el = document.createElement('button');
    el.className = 'car-item' + (eq ? ' sel' : '');
    el.innerHTML =
      '<span class="car-dot" style="background:' + c.color + '"></span>' +
      '<span class="ci-txt"><b>' + c.name + '</b><small>' + c.blurb + '</small></span>' +
      '<span class="ci-tag ' + (eq ? 'eq' : 'free') + '">' + (eq ? 'EQUIPPED' : 'OWNED') + '</span>';
    el.onclick = () => {
      Save.data.selectedCar = c.id; Save.save();
      Engine.setCar(c.id);
      AUDIO.select(); refreshMenu(); renderMyCars();
    };
    list.appendChild(el);
  });
}

function totCell(ico, val, label, gold) {
  return '<div class="tot' + (gold ? ' gold' : '') + '"><b>' + ico + ' ' + val + '</b><span>' + label + '</span></div>';
}
function renderHistory() {
  const d = Save.data;
  $('#hist-totals').innerHTML =
    totCell('🪙', fmtN(d.lifetimeCoins), 'LIFETIME COINS', true) +
    totCell('🛣️', fmtDist(d.stats.distance), 'TOTAL DISTANCE') +
    totCell('🏁', d.stats.sessions, 'SESSIONS') +
    totCell('🏆', fmtN(d.stats.bestScore), 'BEST SCORE', true) +
    totCell('✅', Object.keys(d.completedMissions).length + '/' + MODES.length, 'MISSIONS') +
    totCell('🚗', d.ownedCars.length, 'CARS OWNED');
  const list = $('#hist-list');
  if (!d.history.length) { list.innerHTML = '<p class="hist-empty">Abhi koi session save nahi hua. Pehla drive karo! 🏁</p>'; return; }
  list.innerHTML = d.history.map((h) => {
    const dt = new Date(h.date);
    return '<div class="hitem">' +
      '<span class="h-ico">' + (h.complete ? '🏆' : '🚗') + '</span>' +
      '<span class="h-main"><b>' + h.mode + '</b><small>' + carById(h.car).name + ' · ' + h.crashes + ' crash' + (h.crashes === 1 ? '' : 'es') + '</small></span>' +
      '<span class="h-val">🪙 ' + h.coins + '<br>' + fmtN(h.score) + ' pts</span>' +
      '<span class="h-date">' + fmtDist(h.dist) + '<br>' + dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>' +
      '</div>';
  }).join('');
}

function renderProfile() {
  const hasP = !!Save.data.profile;
  $('#profile-guest').hidden = hasP;
  $('#profile-dash').hidden = !hasP;
  $('#profile-form').hidden = true;
  if (hasP) fillProfileDash();
}
function fillProfileDash() {
  const d = Save.data, p = d.profile;
  $('#pf-name').textContent = p.name;
  $('#pf-id').textContent = p.pid + '  ·  fav: ' + carById(p.favCar).name;
  $('#pf-avatar').textContent = p.avatar;
  $('#pf-banner').style.background = BANNERS[p.banner] || BANNERS[0];
  const xp = d.stats.sessions * 100 + Math.round(d.stats.distance / 100) + d.lifetimeCoins / 10 + Object.keys(d.completedMissions).length * 250;
  $('#pf-level').textContent = 'LVL ' + (1 + Math.floor(Math.sqrt(xp / 50)));
  $('#pf-stats').innerHTML =
    totCell('🪙', fmtN(d.lifetimeCoins), 'TOTAL COINS', true) +
    totCell('🛣️', fmtDist(d.stats.distance), 'DISTANCE') +
    totCell('🏁', d.stats.sessions, 'SESSIONS') +
    totCell('✅', Object.keys(d.completedMissions).length, 'MISSIONS') +
    totCell('🏆', fmtN(d.stats.bestScore), 'BEST SCORE', true) +
    totCell('🚗', d.ownedCars.length, 'CARS');
  let achWrap = document.getElementById('pf-achs');
  if (!achWrap) {
    achWrap = document.createElement('div');
    achWrap.id = 'pf-achs';
    achWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem';
    $('#profile-dash').appendChild(achWrap);
  }
  achWrap.innerHTML = ACH.map((a) => {
    const on = Save.hasAch(a.id);
    return '<span class="tot' + (on ? ' gold' : '') + '" style="flex:1 1 100px;opacity:' + (on ? '1' : '.4') + '"><b>' + a.ico + '</b><span>' + a.name.toUpperCase() + '</span></span>';
  }).join('');
}
function openProfileForm(edit) {
  pfDraft = edit && Save.data.profile
    ? Object.assign({}, Save.data.profile)
    : { name: '', pid: genPlayerId(), avatar: AVATARS[0], banner: 0, favCar: Save.data.selectedCar, favColor: PAINTS[0][0] };
  $('#pf-form-title').textContent = edit ? '✏️ EDIT PROFILE' : 'CREATE PROFILE';
  $('#pf-name-in').value = pfDraft.name;
  $('#profile-guest').hidden = true;
  $('#profile-dash').hidden = true;
  $('#profile-form').hidden = false;
  renderPFForm();
}
function renderPFForm() {
  const grid = $('#pf-avatar-grid');
  grid.innerHTML = '';
  AVATARS.forEach((a) => {
    const b = document.createElement('button');
    b.className = 'av' + (a === pfDraft.avatar ? ' sel' : '');
    b.textContent = a;
    b.onclick = () => { pfDraft.avatar = a; renderPFForm(); AUDIO.select(); };
    grid.appendChild(b);
  });
  const bg = $('#pf-banner-grid');
  bg.innerHTML = '';
  BANNERS.forEach((b, i) => {
    const s = document.createElement('div');
    s.className = 'bn' + (i === pfDraft.banner ? ' sel' : '');
    s.style.background = b;
    s.onclick = () => { pfDraft.banner = i; renderPFForm(); AUDIO.select(); };
    bg.appendChild(s);
  });
  const fc = $('#pf-favcar');
  fc.innerHTML = CAR_DATA.map((c) => '<option value="' + c.id + '"' + (c.id === pfDraft.favCar ? ' selected' : '') + '>' + c.name + '</option>').join('');
  fc.onchange = () => { pfDraft.favCar = fc.value; AUDIO.click(); };
  const fco = $('#pf-favcolor');
  fco.innerHTML = '';
  PAINTS.forEach(([hex, name]) => {
    const s = document.createElement('button');
    s.className = 'sw' + (pfDraft.favColor === hex ? ' sel' : '');
    s.style.background = hex; s.title = name;
    s.onclick = () => { pfDraft.favColor = hex; renderPFForm(); AUDIO.select(); };
    fco.appendChild(s);
  });
}

function loadSettings() {
  const s = Save.data.settings;
  $('#set-quality').value = s.quality;
  $('#set-time').value = s.timeOfDay;
  $('#set-sound').checked = s.sound;
  $('#set-volume').value = s.volume;
  $('#set-cam').value = s.cam;
  $('#set-ctrl').value = s.ctrl;
  $('#set-steer').value = s.steer;
}
const setDebouncedSave = debounce(() => { Save.save(); refreshMenu(); }, 250);

const H = {};
function bindHUD() {
  H.coins = $('#hud-coins'); H.speed = $('#hud-speed'); H.bar = $('#hud-speed-bar');
  H.dist = $('#hud-dist'); H.timer = $('#hud-timer'); H.prog = $('#hud-prog'); H.plabel = $('#hud-prog-label');

  Game.onCoin = () => { Save.earnCoins(COIN_VALUE); AUDIO.coin(); };
  Game.onCrash = () => {
    const f = $('#crash-flash');
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  };
  Game.onRunComplete = (s) => { finishRun(s); showSummary(s); };

  Game.onFrame = (dt) => {
    if (!Game.running) return;
    const r = Game.run, m = Game.mode, g = m.goal || {};
    const speed = Math.max(0, (r.dist - prevDist) / Math.max(dt, 1e-4));
    prevDist = r.dist;
    const kmh = Math.round(speed * 3.6);
    H.coins.textContent = fmtN(Save.data.coins);
    H.speed.textContent = kmh;
    H.bar.style.width = clamp(speed / (Game.car.stats.speed * 0.6) * 100, 0, 100) + '%';
    H.dist.textContent = fmtDist(r.dist);
    if (g.time) {
      const left = Math.max(0, Math.ceil(g.time - r.time));
      H.timer.textContent = left;
      H.timer.classList.toggle('warn', left <= 10);
    }
    const p = g.coins ? r.coins / g.coins : g.dist ? r.dist / g.dist : 0;
    H.prog.style.width = clamp(p * 100, 0, 100) + '%';
    H.plabel.textContent = g.coins ? (r.coins + ' / ' + g.coins + ' 🪙') : (fmtDist(r.dist) + ' / ' + g.dist + ' m');
  };
}

function togglePause() {
  if (!inGame) return;
  Game.paused = !Game.paused;
  Engine.setPaused(Game.paused);
  $('#pause-menu').hidden = !Game.paused;
}

function bindControls() {
  const keyMap = { w: 'gas', arrowup: 'gas', s: 'brake', arrowdown: 'brake', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', ' ': 'hb' };
  window.addEventListener('keydown', (e) => {
    AUDIO.unlock();
    const k = e.key.toLowerCase();
    if (keyMap[k] !== undefined) {
      if (inGame && !Game.paused) Game.input[keyMap[k]] = true;
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
    }
    if (k === 'escape') togglePause();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (keyMap[k] !== undefined) Game.input[keyMap[k]] = false;
  });

  $$('.tbtn').forEach((b) => {
    const a = b.dataset.a;
    const on = (e) => {
      e.preventDefault(); AUDIO.unlock();
      if (inGame && !Game.paused) Game.input[a] = true;
      b.classList.add('holding');
    };
    const off = () => { Game.input[a] = false; b.classList.remove('holding'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
  });

  window.addEventListener('blur', () => { if (inGame && !Game.paused) togglePause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && inGame && !Game.paused) togglePause(); });
}

function bindUI() {
  $$('.pbtn').forEach((b) => b.addEventListener('click', () => AUDIO.click()));

  $('#btn-start').onclick = () => { renderModes(); showScreen('missions'); };
  $('#btn-missions-back').onclick = () => showScreen('menu');
  $('#btn-garage').onclick = () => { renderGarage(); showScreen('garage'); };
  $('#btn-garage-back').onclick = () => showScreen('menu');
  $('#btn-mycars').onclick = () => { renderMyCars(); showScreen('mycars'); };
  $('#btn-mycars-back').onclick = () => showScreen('menu');
  $('#btn-history').onclick = () => { renderHistory(); showScreen('history'); };
  $('#btn-history-back').onclick = () => showScreen('menu');
  $('#btn-profile').onclick = () => { renderProfile(); showScreen('profile'); };
  $('#btn-settings').onclick = () => { loadSettings(); showScreen('settings'); };
  $('#btn-settings-back').onclick = () => showScreen('menu');
  $('#btn-about').onclick = () => showScreen('about');
  $('#btn-about-back').onclick = () => showScreen('menu');

  $('#btn-garage-buy').onclick = () => {
    const c = carById(garageSel);
    if (c.price === 0) return;
    if (Save.spendCoins(c.price)) {
      Save.data.ownedCars.push(c.id);
      Save.save();
      AUDIO.purchase();
      Toast.show('🏭', 'PURCHASED · ' + c.name, c.blurb);
      checkAchievements();
      renderGarage();
    } else {
      Toast.show('😅', 'NOT ENOUGH COINS', 'Chahiye: ' + fmtN(c.price) + ' · Paise: ' + fmtN(Save.data.coins));
    }
  };
  $('#btn-garage-select').onclick = () => {
    const c = carById(garageSel);
    if (!Save.data.ownedCars.includes(c.id)) return;
    Save.data.selectedCar = c.id; Save.save();
    Engine.setCar(c.id);
    AUDIO.select();
    Toast.show('🚗', c.name.toUpperCase(), 'Equipped. Ab isi me drive karo!');
    renderGarage(); refreshMenu();
  };

  $('#btn-reset-data').onclick = () => {
    if (!confirm('Pura game data reset karein? Coins, cars, history — SAB delete. Ye undo nahi ho sakta.')) return;
    Save.reset();
    garageSel = 'hatch';
    Engine.setCar('hatch');
    renderHistory(); refreshMenu();
    Toast.show('🗑️', 'DATA RESET', 'Nayi shuruaat. All the best!');
  };

  $('#btn-pf-create-open').onclick = () => openProfileForm(false);
  $('#btn-pf-back-guest').onclick = () => showScreen('menu');
  $('#btn-pf-back').onclick = () => showScreen('menu');
  $('#btn-pf-edit').onclick = () => openProfileForm(true);
  $('#btn-pf-form-cancel').onclick = () => renderProfile();
  $('#btn-pf-delete').onclick = () => {
    if (!confirm('Profile delete karein? Game progress (coins/cars/history) rahega, sirf profile naam/avatar hatega.')) return;
    Save.data.profile = null; Save.save();
    renderProfile();
    Toast.show('👤', 'PROFILE DELETED', 'Wapas guest mode.');
  };
  $('#btn-pf-form-submit').onclick = () => {
    const name = $('#pf-name-in').value.trim();
    if (name.length < 2) { Toast.show('✏️', 'NAME CHHOTA HAI', 'Kam se kam 2 characters'); return; }
    pfDraft.name = name;
    const isNew = !Save.data.profile;
    Save.data.profile = pfDraft; Save.save();
    AUDIO.purchase();
    Toast.show('👤', isNew ? 'PROFILE CREATED' : 'PROFILE UPDATED', name + ' · ' + pfDraft.pid + ' · saara progress isi me aa gaya');
    renderProfile();
  };

  $('#set-quality').onchange = (e) => {
    Save.data.settings.quality = e.target.value;
    Engine.setQuality(e.target.value);
    Save.save();
    Toast.show('🎨', 'GRAPHICS: ' + e.target.value.toUpperCase(), 'Instantly apply ho gaya');
  };
  $('#set-time').onchange = (e) => {
    Save.data.settings.timeOfDay = e.target.value;
    Engine.setTimeOfDay(e.target.value);
    Save.save();
  };
  $('#set-sound').onchange = (e) => {
    Save.data.settings.sound = e.target.checked;
    AUDIO.applyMaster();
    Save.save();
  };
  $('#set-volume').oninput = (e) => { Save.data.settings.volume = +e.target.value; AUDIO.applyMaster(); setDebouncedSave(); };
  $('#set-cam').oninput = (e) => { Save.data.settings.cam = +e.target.value; setDebouncedSave(); };
  $('#set-ctrl').oninput = (e) => { Save.data.settings.ctrl = +e.target.value; setDebouncedSave(); };
  $('#set-steer').oninput = (e) => { Save.data.settings.steer = +e.target.value; setDebouncedSave(); };

  $('#btn-resume').onclick = togglePause;
  $('#btn-restart').onclick = () => {
    Game.paused = false; Engine.setPaused(false);
    $('#pause-menu').hidden = true;
    prevDist = 0;
    Engine.startRun(Game.mode);
  };
  $('#btn-end-run').onclick = () => {
    Game.paused = false; Engine.setPaused(false);
    $('#pause-menu').hidden = true;
    Engine.endRun();
  };
  $('#btn-sum-again').onclick = () => { $('#summary').hidden = true; if (lastMode) beginRun(lastMode); };
  $('#btn-sum-menu').onclick = exitToMenu;
}

function init() {
  Save.load();
  if (typeof THREE !== 'undefined') {
    Engine.init($('canvas#gl'));
    setTimeout(() => {
      const l = $('#loading');
      l.classList.add('hide');
      setTimeout(() => l.remove(), 700);
    }, 1000);
  } else {
    $('#load-error').hidden = false;
  }
  bindUI();
  bindHUD();
  bindControls();
  refreshMenu();
  updateDailyToast();
  showScreen('menu');
}
window.addEventListener('load', init);
