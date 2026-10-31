// src/chain-expression.ts
var GALLERY = [
  { family: "curious", name: "Ear perk & head tilt", zh: "\u8C4E\u8033\u6B6A\u982D" },
  { family: "curious", name: "Peek & sniff", zh: "\u63A2\u982D\u55C5\u55C5" },
  { family: "curious", name: "Stand & wave", zh: "\u633A\u8EAB\u63EE\u722A" },
  { family: "pleased", name: "Paw claps & shoulders", zh: "\u62CD\u722A\u626D\u80A9" },
  { family: "pleased", name: "Bounce & soft landing", zh: "\u8F15\u8DF3\u843D\u5730" },
  { family: "pleased", name: "Cheek paws & sway", zh: "\u6367\u9830\u6416\u64FA" },
  { family: "celebrate", name: "Quarter twirl & return", zh: "\u8F49\u8EAB\u56DE\u671B" },
  { family: "celebrate", name: "Victory & happy paws", zh: "\u52DD\u5229\u52D5\u722A" },
  { family: "celebrate", name: "Two-step dance & bow", zh: "\u5169\u6B65\u821E\u97A0\u8EAC" },
  { family: "join", name: "Tiny high-five", zh: "\u5C0F\u722A\u64CA\u638C" },
  { family: "join", name: "Cheek nuzzle", zh: "\u9760\u8FD1\u8E6D\u8E6D" },
  { family: "join", name: "Shy dip & wave", zh: "\u5BB3\u7F9E\u4F4E\u982D\u63EE\u722A" }
];
var CAPTIONS = [["A new request! Pip perks up and tilts its head.", "\u6709\u65B0\u8ACB\u6C42\uFF01Pip \u8C4E\u8033\u6B6A\u982D\u6253\u62DB\u547C\u3002"], ["Something new? Pip peeks and sniffs.", "\u6709\u65B0\u52D5\u975C\uFF1FPip \u63A2\u982D\u805E\u805E\u3002"], ["A new request! Pip stands tall and waves.", "\u6709\u65B0\u8ACB\u6C42\uFF01Pip \u633A\u8D77\u8EAB\u5B50\u63EE\u722A\u3002"], ["Batch settled. Time for tiny paw claps.", "\u6279\u6B21\u5DF2\u7D50\u7B97\uFF0C\u5C0F\u722A\u722A\u62CD\u4E00\u62CD\u3002"], ["Batch settled. A little bounce, a soft landing.", "\u6279\u6B21\u5DF2\u7D50\u7B97\uFF0C\u8F15\u8F15\u8DF3\u8D77\u518D\u843D\u5730\u3002"], ["Batch settled. Happy paws and a gentle sway.", "\u6279\u6B21\u5DF2\u7D50\u7B97\uFF0C\u6367\u8457\u81C9\u9830\u6416\u4E00\u6416\u3002"], ["Completed blocks! A tiny twirl and back to you.", "\u5B8C\u6574\u5340\u584A\u5B8C\u6210\uFF01\u8F49\u500B\u5C0F\u5708\u518D\u770B\u5411\u4F60\u3002"], ["Completed blocks! Pip raises a victory paw.", "\u5B8C\u6574\u5340\u584A\u5B8C\u6210\uFF01Pip \u8209\u722A\u6176\u795D\u3002"], ["Completed blocks! Two little steps and a bow.", "\u5B8C\u6574\u5340\u584A\u5B8C\u6210\uFF01\u5C0F\u8DF3\u5169\u6B65\u518D\u97A0\u8EAC\u3002"], ["Paw to palm. A tiny high-five!", "\u722A\u722A\u78B0\u624B\u5FC3\uFF0C\u5C0F\u5C0F\u64CA\u638C\uFF01"], ["A little closer for a cheek nuzzle.", "\u9760\u8FD1\u4E00\u9EDE\uFF0C\u8F15\u8F15\u8E6D\u8E6D\u81C9\u9830\u3002"], ["A shy little dip, then a returning wave.", "\u5BB3\u7F9E\u4F4E\u4E0B\u982D\uFF0C\u518D\u8F15\u8F15\u63EE\u722A\u56DE\u61C9\u3002"]];
var smooth = (n) => {
  n = Math.max(0, Math.min(1, n));
  return n * n * (3 - 2 * n);
};
function expressionPose(index, age, stage = "baby", lively = false, reduced = false, energy = 100) {
  const o = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, head: 0, paw: 0, hands: 0, cheek: 0, ear: 0, sniff: 0, headYaw: 0, headPitch: 0 };
  if (age < 0 || age >= 3.6) return o;
  if (reduced) {
    o.ear = 0.25;
    o.paw = 0.2;
    return o;
  }
  const a = (stage === "baby" ? 0.56 : stage === "young" ? 0.72 : 1) * (lively ? 1 : 0.72) * (energy < 30 ? 0.6 : 1), t = Math.max(0, age - 0.35), e = smooth(age / 0.4) * (1 - smooth((age - 2.75) / 0.85)), s = Math.sin(t * 6), pulse = Math.max(0, Math.sin(t * 5));
  o.headPitch = -0.12 * e;
  switch (index) {
    case 0:
      o.ear = 0.85 * e;
      o.head = 0.9 * e * Math.sin(t * 2);
      o.headPitch = 0.3 * e;
      break;
    case 1:
      o.headYaw = 0.9 * e * Math.sin(t * 3);
      o.sniff = e * (0.4 + 0.4 * Math.sin(t * 17));
      o.z = 0.04 * e;
      break;
    case 2:
      o.sy = 1 + 0.025 * e;
      o.paw = e * (0.5 + 0.4 * Math.sin(t * 10));
      o.ear = 0.35 * e;
      break;
    case 3:
      o.hands = 0.85 * e * Math.max(0, Math.sin(t * 7));
      o.rz = 0.035 * e * s;
      o.sx = 1 + 0.015 * e * s;
      break;
    case 4:
      o.y = 0.09 * e * Math.max(0, Math.sin(Math.min(Math.PI, t * 2.4)));
      o.sy = 1 - 0.035 * e * Math.max(0, -Math.cos(t * 4));
      o.ear = 0.4 * e;
      break;
    case 5:
      o.hands = 0.75 * e;
      o.cheek = 0.45 * e;
      o.rz = 0.07 * e * Math.sin(t * 2.7);
      break;
    case 6:
      o.ry = Math.PI / 2 * e * Math.sin(Math.min(Math.PI, t * 1.3));
      o.paw = 0.3 * e;
      o.ear = 0.65 * e;
      break;
    case 7:
      o.paw = 0.85 * e;
      o.head = -0.5 * e;
      o.rz = 0.035 * e;
      o.hands = 0.3 * e * pulse;
      break;
    case 8:
      o.x = 0.045 * e * Math.sin(t * 4);
      o.rz = 0.08 * e * Math.sin(t * 4);
      o.headPitch = 0.8 * e * smooth((t - 1.3) / 0.5);
      o.hands = 0.35 * e;
      break;
    case 9:
      o.paw = e * (0.8 + 0.15 * Math.sin(t * 5));
      o.head = -0.45 * e;
      o.z = 0.045 * e;
      break;
    case 10:
      o.z = 0.09 * e;
      o.head = 0.8 * e;
      o.cheek = 0.55 * e;
      o.headPitch = 0.3 * e;
      break;
    case 11:
      o.headPitch = 0.8 * e * Math.sin(t * 1.5);
      o.paw = 0.65 * e * smooth((t - 0.7) / 0.6);
      o.ear = 0.35 * e;
      break;
  }
  if (lively) {
    o.ear += 0.12 * e * Math.sin(t * 9);
    o.sniff += 0.12 * e * (0.5 + 0.5 * Math.sin(t * 15));
  }
  for (const k of Object.keys(o)) if (k === "sx" || k === "sy") o[k] = 1 + (o[k] - 1) * a;
  else o[k] *= a;
  return o;
}
var ExpressionDirector = class {
  active = null;
  invitation = null;
  previous = {};
  seed;
  joinUntil = 0;
  lastJoinKind = 9;
  constructor(seed = 20261031) {
    this.seed = seed >>> 0;
  }
  choose(family) {
    const start = { curious: 0, pleased: 3, celebrate: 6, join: 9 }[family];
    this.seed = 1664525 * this.seed + 1013904223 >>> 0;
    let n = start + this.seed % 3;
    if (this.previous[family] === n) n = start + (n - start + 1) % 3;
    this.previous[family] = n;
    return n;
  }
  start(group, now, index) {
    if (group.family !== "join") this.joinUntil = 0;
    this.invitation = null;
    this.active = { index: index ?? this.choose(group.family), start: now, group };
    return this.active;
  }
  tick(now) {
    if (this.invitation && now > this.invitation.until) this.invitation = null;
    if (this.active && now - this.active.start >= 3600) {
      const old = this.active;
      this.active = null;
      if (old.index < 9) this.invitation = { kind: this.choose("join"), until: now + 8e3 };
    }
    return this.active;
  }
  cancel() {
    this.active = null;
    this.invitation = null;
    this.joinUntil = 0;
  }
  respond(now, zone) {
    const invitation = this.invitation || (this.joinUntil > now ? { kind: this.lastJoinKind, until: this.joinUntil } : null);
    if (!zone || !invitation || now > invitation.until) return false;
    const kind = invitation.kind;
    this.joinUntil = invitation.until;
    this.lastJoinKind = kind;
    if (kind === 9 && zone !== "paw" || kind !== 9 && !["head", "cheek", "nose", "ear"].includes(zone)) return false;
    this.start({ family: "join", events: [], simulated: false }, now, kind);
    return true;
  }
};
export {
  CAPTIONS,
  ExpressionDirector,
  GALLERY,
  expressionPose
};
