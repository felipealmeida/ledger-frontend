import Decimal from "decimal.js";

export interface DecimalFormatRule {
  locale?: string;           // e.g. "pt-BR" | "en-US" (default "en-US")
  currency?: string;         // ISO code to place currency correctly (e.g. "BRL", "USD")
  symbol?: string;           // If not using currency style, plain symbol (e.g., "₿")
  minFraction?: number;      // pad with zeros to at least this many digits
  maxFraction?: number;      // truncate to at most this many digits; use Infinity for no cap
}

const RULES: DecimalRules = {
  "BRL":  { locale: "pt-BR", currency: "BRL",  minFraction: 2, maxFraction: Infinity },
  "USD":  { locale: "pt-BR", currency: "USD",  minFraction: 2, maxFraction: Infinity },
  "BTC":  { locale: "pt-BR", currency: "BTC",  minFraction: 2, maxFraction: Infinity },
  "USDT": { locale: "pt-BR", symbol: "USDT", minFraction: 2, maxFraction: Infinity },
  "CET": { locale: "pt-BR", symbol: "CET", minFraction: 2, maxFraction: 2 },
  "GBP": { locale: "pt-BR", currency: "GBP", minFraction: 2, maxFraction: Infinity },
  "KRW": { locale: "pt-BR", currency: "KRW", minFraction: 2, maxFraction: Infinity },
  "Loop": { locale: "pt-BR", symbol: "Loop", minFraction: 0, maxFraction: 0 },
  "MUSD": { locale: "pt-BR", symbol: "MUSD", minFraction: 2, maxFraction: Infinity },
};

export type Commodity = string;
export type DecimalRules = Record<Commodity, DecimalFormatRule>;

/** Learn separators, prefix/suffix, minus sign, and grouping sizes for a locale/currency. */
function detectLocalePattern(locale: string, currency?: string) {
  const nf = new Intl.NumberFormat(locale, currency ? { style: "currency", currency: currency } : { style: "decimal" });

  const partsBig = nf.formatToParts(123_456_789.5);
  const decimalSep = partsBig.find(p => p.type === "decimal")?.value ?? ".";
  const groupSep   = partsBig.find(p => p.type === "group")?.value ?? ",";

  const partsSmall = nf.formatToParts(1.1);
  const firstIntIdx = partsSmall.findIndex(p => p.type === "integer");
  let lastNumIdx = -1;
  for (let i = 0; i < partsSmall.length; i++) {
    if (["integer","decimal","fraction","group"].includes(partsSmall[i].type)) lastNumIdx = i;
  }
  const prefix = partsSmall.slice(0, firstIntIdx).map(p => p.value).join("");
  const suffix = partsSmall.slice(lastNumIdx + 1).map(p => p.value).join("");

  const minusSign = new Intl.NumberFormat(locale, { signDisplay: "always" })
    .formatToParts(-1)
    .find(p => p.type === "minusSign")?.value ?? "-";

  // derive grouping sizes from the big sample’s integer
  const intParts = partsBig.filter(p => p.type === "integer" || p.type === "group");
  const segments: number[] = [];
  let cur = 0;
  for (const p of intParts) {
    if (p.type === "integer") cur += p.value.length;
    if (p.type === "group") { segments.push(cur); cur = 0; }
  }
  segments.push(cur);
  const rtl = segments.slice().reverse();
  return {
    decimalSep, groupSep, prefix, suffix, minusSign,
    primaryGroup: rtl[0] ?? 0,
    secondaryGroup: rtl[1] ?? rtl[0] ?? 0,
  };
}

function groupInteger(intStr: string, primary: number, secondary: number, sep: string): string {
  if (!primary || intStr.length <= primary) return intStr;
  const out: string[] = [];
  let i = intStr.length;
  out.unshift(intStr.slice(i - primary, i));
  i -= primary;
  const sec = secondary || primary;
  while (i > 0) {
    const size = Math.min(sec, i);
    out.unshift(intStr.slice(i - size, i));
    i -= size;
  }
  return out.join(sep);
}

/** Core: format a decimal.js Decimal with no rounding (only truncation + zero padding). */
export function formatDecimalByCommodity(
  commodity: Commodity,
  value: Decimal,
  rules: DecimalRules = RULES
): string {
  const r = rules[commodity] ?? {};
  const locale = r.locale ?? "en-US";
  const { decimalSep, groupSep, prefix, suffix, minusSign, primaryGroup, secondaryGroup } =
    detectLocalePattern(locale, r.currency);

  const negative = value.isNegative();
  const abs = value.abs();

  // decide how many fraction digits to show from the original value
  const origDp = abs.decimalPlaces(); // exact digits present
  const minF = r.minFraction ?? 0;
  const maxF = Number.isFinite(r.maxFraction as number) ? (r.maxFraction as number) : Infinity;

  // NO ROUNDING:
  // - if maxF is finite, use toFixed(maxF, ROUND_DOWN) to TRUNCATE
  // - else, keep all existing digits via toFixed(origDp, ROUND_DOWN)
  const dpToKeep = Number.isFinite(maxF) ? Math.min(origDp, maxF) : origDp;
  const raw = abs.toFixed(dpToKeep, Decimal.ROUND_DOWN); // string like "12345.6789" or "0" or "123"

  // split into integer / fraction (no commas)
  const dotIdx = raw.indexOf(".");
  const intRaw = dotIdx >= 0 ? raw.slice(0, dotIdx) : raw;
  let fracRaw = dotIdx >= 0 ? raw.slice(dotIdx + 1) : "";

  // trim trailing zeros but keep at least minF
  if (fracRaw) {
    let i = fracRaw.length - 1;
    while (i >= minF && fracRaw[i] === "0") i--;
    fracRaw = fracRaw.slice(0, i + 1);
  }
  if (!fracRaw && minF > 0) fracRaw = "0".repeat(minF);

  // group integer per locale pattern
  const groupedInt = groupInteger(intRaw, primaryGroup, secondaryGroup, groupSep);

  const body = fracRaw ? `${groupedInt}${decimalSep}${fracRaw}` : groupedInt;

  // currency style uses locale prefix/suffix; otherwise use manual symbol (if provided)
  const pre  = r.currency ? prefix : (r.symbol ? `${r.symbol} ` : "");
  const post = r.currency ? suffix : "";

  return negative ? `${minusSign}${pre}${body}${post}` : `${pre}${body}${post}`;
}
