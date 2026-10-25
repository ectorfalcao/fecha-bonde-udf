// DOM mínimo SÓ para testes em Node. Não substitui o navegador.
// Imita um comportamento real importante: append/replaceChildren com valor que não é nó
// (null, undefined, array) vira TEXTO ("null", "undefined", "[object ...]"), como nos navegadores.
export class No {
  constructor() { this.filhos = []; this.pai = null; }
  append(...ns) {
    for (const n of ns) {
      const x = n instanceof No ? n : new Texto(String(n));
      x.remove(); x.pai = this; this.filhos.push(x);
    }
  }
  replaceChildren(...ns) { this.filhos.forEach((f) => { f.pai = null; }); this.filhos = []; this.append(...ns); }
  remove() { if (this.pai) { this.pai.filhos = this.pai.filhos.filter((f) => f !== this); this.pai = null; } }
  get textContent() { return this.filhos.map((f) => f.textContent).join(""); }
  set textContent(v) { this.replaceChildren(...(v === "" ? [] : [String(v)])); }
}
export class Texto extends No {
  constructor(t) { super(); this.t = t; }
  get textContent() { return this.t; }
  set textContent(v) { this.t = String(v); }
}
export class Elemento extends No {
  constructor(tag) { super(); this.tagName = tag.toUpperCase(); this.attrs = new Map(); this.ouvintes = {}; this._valor = null; this._marcado = null; this.returnValue = ""; }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  removeAttribute(k) { this.attrs.delete(k); }
  hasAttribute(k) { return this.attrs.has(k); }
  get id() { return this.getAttribute("id") ?? ""; }
  get className() { return this.getAttribute("class") ?? ""; }
  set className(v) { this.setAttribute("class", v); }
  get hidden() { return this.attrs.has("hidden"); }
  set hidden(v) { v ? this.setAttribute("hidden", "") : this.removeAttribute("hidden"); }
  get value() {
    if (this._valor !== null) return this._valor;
    if (this.tagName === "SELECT") {
      const ops = this.filhos.filter((f) => f.tagName === "OPTION");
      const sel = ops.find((o) => o.hasAttribute("selected")) ?? ops[0];
      return sel ? (sel.getAttribute("value") ?? sel.textContent) : "";
    }
    return this.getAttribute("value") ?? "";
  }
  set value(v) { this._valor = String(v); }
  get checked() { return this._marcado ?? this.hasAttribute("checked"); }
  set checked(v) { this._marcado = Boolean(v); }
  addEventListener(t, fn) { (this.ouvintes[t] ??= []).push(fn); }
  dispatchEvent(ev) { ev.target ??= this; ev.preventDefault ??= () => {}; for (const fn of this.ouvintes[ev.type] ?? []) fn.call(this, ev); return true; }
  click() { this.dispatchEvent({ type: "click" }); }
  focus() { globalThis.document.activeElement = this; }
  showModal() { this.setAttribute("open", ""); }
  close(v) { this.returnValue = v ?? ""; this.removeAttribute("open"); this.dispatchEvent({ type: "close" }); }
  toString() { return "[object HTMLElement]"; }
  querySelectorAll(sel) { return acharTodos(this, (e) => corresponde(e, sel)).filter((e) => e !== this); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
}

function corresponde(e, sel) {
  const m = sel.match(/^([a-z0-9]*)((?:[#.][\w-]+|\[[^\]]+\])*)$/i);
  if (!m) throw new Error(`seletor não suportado no DOM falso: ${sel}`);
  if (m[1] && e.tagName !== m[1].toUpperCase()) return false;
  for (const p of m[2].match(/[#.][\w-]+|\[[^\]]+\]/g) ?? []) {
    if (p[0] === "#") { if (e.id !== p.slice(1)) return false; }
    else if (p[0] === ".") { if (!e.className.split(/\s+/).includes(p.slice(1))) return false; }
    else {
      const [k, v] = p.slice(1, -1).split("="), val = e.getAttribute(k);
      if (v === undefined) { if (val == null) return false; } else if (val !== v.replace(/^"|"$/g, "")) return false;
    }
  }
  return true;
}

export function acharTodos(raiz, pred) {
  const r = [];
  const visitar = (n) => { if (n instanceof Elemento) { if (pred(n)) r.push(n); n.filhos.forEach(visitar); } };
  visitar(raiz);
  return r;
}
export const achar = (raiz, pred) => acharTodos(raiz, pred)[0] ?? null;
export const textoDe = (n) => n.textContent;
// Botão ou link pelo texto exato OU pelo início do nome acessível (aria-label).
export const botao = (raiz, nome) => achar(raiz, (e) => ["BUTTON", "A"].includes(e.tagName) && (e.textContent.trim() === nome || (e.getAttribute("aria-label") ?? "").startsWith(nome)));
export const dialogoAberto = () => achar(globalThis.document.body, (e) => e.tagName === "DIALOG" && e.hasAttribute("open"));
export const esperar = () => new Promise((r) => setTimeout(r, 0));

export function instalarAmbiente() {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: (k) => { mem.delete(k); } };
  const doc = { body: new Elemento("body"), activeElement: null, title: "", createElement: (t) => new Elemento(t), getElementById: (id) => achar(doc.body, (e) => e.id === id) };
  globalThis.document = doc;
  globalThis.location = { hash: "" };
  return mem;
}
