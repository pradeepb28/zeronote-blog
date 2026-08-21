const GLOBAL_PARAMS = new Set([
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "gclsrc",
  "gad_source",
  "srsltid",
  "fbclid",
  "msclkid",
  "twclid",
  "ttclid",
  "li_fat_id",
  "yclid",
  "tbclid",
  "mc_eid",
  "mc_cid",
  "affiliate_id",
  "aff_id",
  "aff_click_id",
  "clickid",
  "click_id",
  "irclickid",
  "ranmid",
  "raneaid",
  "ransiteid",
]);

const AMAZON_PARAMS = new Set(["tag", "linkcode", "camp", "creative", "ascsubtag", "ref"]);
const YOUTUBE_PARAMS = new Set(["si", "feature", "pp"]);
const INSTAGRAM_PARAMS = new Set(["igshid", "igsh", "ig_rid"]);
const TIKTOK_PARAMS = new Set(["is_from_webapp", "sender_device", "share_app_name", "_r", "_t"]);
const TWITTER_PARAMS = new Set(["s", "t", "twclid"]);
const LINKEDIN_PARAMS = new Set(["trk", "li_fat_id", "rc", "lipi"]);
const SPOTIFY_PARAMS = new Set(["si", "context", "nd"]);

function hostnameOf(url) {
  return (url.hostname || "").toLowerCase();
}

function hostEndsWith(host, suffix) {
  return host === suffix || host.endsWith("." + suffix);
}

function isAmazon(host) {
  return host === "amzn.to" || hostEndsWith(host, "amzn.to") || /(^|\.)amazon\.[a-z.]+$/.test(host);
}

function isYouTube(host) {
  return (
    hostEndsWith(host, "youtube.com") ||
    hostEndsWith(host, "youtu.be") ||
    hostEndsWith(host, "youtube-nocookie.com")
  );
}

function isInstagram(host) {
  return hostEndsWith(host, "instagram.com");
}

function isTikTok(host) {
  return hostEndsWith(host, "tiktok.com");
}

function isTwitter(host) {
  return hostEndsWith(host, "twitter.com") || hostEndsWith(host, "x.com");
}

function isLinkedIn(host) {
  return hostEndsWith(host, "linkedin.com") || hostEndsWith(host, "lnkd.in");
}

function isSpotify(host) {
  return hostEndsWith(host, "spotify.com");
}

function isGoogle(host) {
  return /(^|\.)google\.[a-z.]+$/.test(host);
}

function isFacebookClick(host, pathname) {
  return (host === "l.facebook.com" || host === "lm.facebook.com") && pathname.startsWith("/l.php");
}

function shouldDropParam(name, host) {
  const n = name.toLowerCase();
  if (n.startsWith("utm_")) return true;
  if (GLOBAL_PARAMS.has(n)) return true;
  if (isAmazon(host)) {
    if (AMAZON_PARAMS.has(n) || n.startsWith("ref_") || n.startsWith("pd_rd_") || n.startsWith("pf_rd_")) {
      return true;
    }
  }
  if (isYouTube(host) && YOUTUBE_PARAMS.has(n)) return true;
  if (isInstagram(host) && INSTAGRAM_PARAMS.has(n)) return true;
  if (isTikTok(host) && TIKTOK_PARAMS.has(n)) return true;
  if (isTwitter(host) && TWITTER_PARAMS.has(n)) return true;
  if (isLinkedIn(host) && LINKEDIN_PARAMS.has(n)) return true;
  if (isSpotify(host) && SPOTIFY_PARAMS.has(n)) return true;
  return false;
}

function stripSearchParams(url, removed) {
  const host = hostnameOf(url);
  const names = [...url.searchParams.keys()];
  names.forEach((name) => {
    if (!shouldDropParam(name, host)) return;
    if (!removed.includes(name)) removed.push(name);
    url.searchParams.delete(name);
  });
  const qs = url.searchParams.toString();
  url.search = qs ? "?" + qs : "";
}

function stripAmazonPath(url, removed) {
  if (!isAmazon(hostnameOf(url))) return;
  const parts = url.pathname.split("/");
  const next = parts.filter((part) => !/^ref=/i.test(part));
  if (next.length === parts.length) return;
  if (!removed.includes("ref")) removed.push("ref");
  url.pathname = next.join("/") || "/";
}

function parseHash(hash) {
  if (!hash || hash === "#") {
    return { kind: "empty", path: "", params: new URLSearchParams() };
  }
  const raw = hash.slice(1);
  if (raw.startsWith("/")) {
    const q = raw.indexOf("?");
    if (q === -1) {
      return { kind: "path", path: raw, params: new URLSearchParams() };
    }
    return {
      kind: "path",
      path: raw.slice(0, q),
      params: new URLSearchParams(raw.slice(q + 1)),
    };
  }
  if (raw.includes("=")) {
    const query = raw.startsWith("?") ? raw.slice(1) : raw;
    return { kind: "query", path: "", params: new URLSearchParams(query) };
  }
  return { kind: "opaque", path: raw, params: new URLSearchParams() };
}

function applyHash(url, parsed) {
  if (parsed.kind === "empty") {
    url.hash = "";
    return;
  }
  if (parsed.kind === "opaque") {
    url.hash = parsed.path ? "#" + parsed.path : "";
    return;
  }
  const qs = parsed.params.toString();
  if (parsed.kind === "path") {
    url.hash = qs ? "#" + parsed.path + "?" + qs : "#" + parsed.path;
    return;
  }
  url.hash = qs ? "#" + qs : "";
}

function stripHashParams(url, removed) {
  const parsed = parseHash(url.hash);
  if (parsed.kind === "opaque" || parsed.kind === "empty") return;
  const host = hostnameOf(url);
  const names = [...parsed.params.keys()];
  names.forEach((name) => {
    if (!shouldDropParam(name, host)) return;
    if (!removed.includes(name)) removed.push(name);
    parsed.params.delete(name);
  });
  applyHash(url, parsed);
}

function unwrap(url) {
  const host = hostnameOf(url);
  const path = url.pathname || "";
  if (isFacebookClick(host, path)) {
    const dest = url.searchParams.get("u");
    if (!dest) return null;
    try {
      return new URL(dest);
    } catch {
      return null;
    }
  }
  if (isGoogle(host) && (path === "/url" || path === "/url/")) {
    const dest = url.searchParams.get("q") || url.searchParams.get("url");
    if (!dest) return null;
    try {
      return new URL(dest);
    } catch {
      return null;
    }
  }
  return null;
}

function cleanParsed(url, depth, removed, unwrapped) {
  if (depth > 3) {
    return { url, removed, unwrapped };
  }

  const dest = unwrap(url);
  if (dest) {
    return cleanParsed(dest, depth + 1, removed, true);
  }

  stripAmazonPath(url, removed);
  stripSearchParams(url, removed);
  stripHashParams(url, removed);
  return { url, removed, unwrapped };
}

export function parseInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return { empty: true };

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "Paste a full http(s) link." };
    }
    return { url };
  } catch {
    try {
      const url = new URL("https://" + trimmed);
      if (!url.hostname || !url.hostname.includes(".")) {
        return { error: "Paste a full http(s) link." };
      }
      return { url };
    } catch {
      return { error: "Paste a full http(s) link." };
    }
  }
}

export function cleanLink(text) {
  const parsed = parseInput(text);
  if (parsed.empty) return { empty: true };
  if (parsed.error) return { error: parsed.error };

  const result = cleanParsed(parsed.url, 0, [], false);
  return {
    href: result.url.href,
    removed: result.removed,
    unwrapped: result.unwrapped,
  };
}
