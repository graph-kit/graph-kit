/*
  every user agent string quotes the ones that came before it: Chrome calls itself
  Safari, Edge calls itself Chrome, and all of them open with Mozilla. so each list
  below runs most specific first and the first rule that matches wins, which is the
  only thing that keeps Edge from reading as Chrome and Chrome from reading as Safari
*/

export type ParsedUserAgent = {
  /** the browser's marketing name, which is what a bug gets filed against */
  browser: string;
  /** major and minor only; the raw string on the panel still carries the patch level */
  version: string;
  /** what actually draws the page, which is what a rendering bug tracks */
  engine: string;
  /** the operating system, with its version when the string carries one */
  os: string;
  /** phones and tablets, where the pointer and touch paths differ from the desktop */
  isMobile: boolean;
};

/** what a field falls back to when the string did not say, so a readout never goes blank */
export const UNKNOWN = 'unknown';

type NamedPattern = { name: string; pattern: RegExp };

const BROWSER_PATTERNS: NamedPattern[] = [
  // Edg, EdgA and EdgiOS across its platforms, plus the legacy EdgeHTML Edge
  { name: 'Edge', pattern: /Edge?(?:A|iOS)?\/([\d.]+)/ },
  { name: 'Opera', pattern: /(?:OPR|OPiOS|Opera)\/([\d.]+)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/([\d.]+)/ },
  { name: 'Firefox', pattern: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { name: 'Chrome', pattern: /(?:Chrome|Chromium|CriOS)\/([\d.]+)/ },
  /*
    Safari's own Safari/ token carries a build number rather than a version, so the
    version comes off the Version/ token that only Safari puts in front of it
  */
  { name: 'Safari', pattern: /Version\/([\d.]+).*\bSafari\// },
];

const ENGINE_PATTERNS: NamedPattern[] = [
  // every other engine says "like Gecko" in parentheses; only Gecko says "Gecko/"
  { name: 'Gecko', pattern: /Gecko\/\d/ },
  { name: 'Blink', pattern: /(?:Chrome|Chromium)\/\d/ },
  // the iOS browsers land here, since the platform gives them all one engine
  { name: 'WebKit', pattern: /AppleWebKit\/\d/ },
];

/** the NT numbering says nothing to anyone, so the rules translate it back */
const WINDOWS_RELEASES: Record<string, string> = {
  '10.0': '10/11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
};

type OsPattern = {
  pattern: RegExp;
  /** what to print, given whatever version the pattern captured */
  format: (version: string) => string;
};

/** Apple writes its versions with underscores, and nobody reads them that way */
const dotted = (version: string) => version.replaceAll('_', '.');

const OS_PATTERNS: OsPattern[] = [
  {
    pattern: /Windows NT ([\d.]+)/,
    format: (version) =>
      `Windows ${WINDOWS_RELEASES[version] ?? `NT ${version}`}`,
  },
  // Android says Linux too, so it has to be asked about first
  { pattern: /Android ([\d.]+)/, format: (version) => `Android ${version}` },
  { pattern: /CrOS/, format: () => 'ChromeOS' },
  // as does iOS, which says "like Mac OS X"
  {
    pattern: /iPhone OS ([\d._]+)/,
    format: (version) => `iOS ${dotted(version)}`,
  },
  {
    pattern: /iPad.*CPU OS ([\d._]+)/,
    format: (version) => `iPadOS ${dotted(version)}`,
  },
  {
    pattern: /Mac OS X ([\d._]+)/,
    format: (version) => `macOS ${dotted(version)}`,
  },
  // desktop Safari stopped moving this number at 10.15.7, so bare Macs land here too
  { pattern: /Macintosh/, format: () => 'macOS' },
  { pattern: /Linux/, format: () => 'Linux' },
];

const MOBILE_PATTERN = /\b(?:Mobi|Android|iPhone|iPad|iPod)/;

/** 119.0.6045.109 reads as 119.0, which is all a panel this narrow has room for */
const toMajorMinor = (version: string) =>
  version.split('.').slice(0, 2).join('.');

const firstMatch = (userAgent: string, patterns: NamedPattern[]) => {
  for (const { name, pattern } of patterns) {
    const match = pattern.exec(userAgent);
    if (match) return { name, version: match[1] ?? '' };
  }
  return undefined;
};

const parseOs = (userAgent: string) => {
  for (const { pattern, format } of OS_PATTERNS) {
    const match = pattern.exec(userAgent);
    if (match) return format(match[1] ?? '');
  }
  return UNKNOWN;
};

/**
 * pulls the handful of fields a bug report is triaged on out of a user agent string.
 *
 * the string is a pile of compatibility lies rather than a format, so this is a best
 * effort by design: anything it cannot name comes back as `unknown`, and the panel
 * prints the raw string alongside the parse so nothing here is the only record of it
 */
export const parseUserAgent = (userAgent: string): ParsedUserAgent => {
  const browser = firstMatch(userAgent, BROWSER_PATTERNS);
  const engine = firstMatch(userAgent, ENGINE_PATTERNS);

  return {
    browser: browser?.name ?? UNKNOWN,
    version: browser?.version ? toMajorMinor(browser.version) : UNKNOWN,
    engine: engine?.name ?? UNKNOWN,
    os: parseOs(userAgent),
    isMobile: MOBILE_PATTERN.test(userAgent),
  };
};
