/*
  every user agent string quotes the ones before it: Chrome calls itself Safari, Edge
  calls itself Chrome. so each list below runs most specific first and the first match
  wins
*/

export type ParsedUserAgent = {
  /** the browser's marketing name */
  browser: string;
  /** major and minor only */
  version: string;
  /** what actually draws the page */
  engine: string;
  /** the operating system, with its version when the string carries one */
  os: string;
  /** phones and tablets */
  isMobile: boolean;
};

/** what a field falls back to when the string did not say */
export const UNKNOWN = 'unknown';

type NamedPattern = { name: string; pattern: RegExp };

const BROWSER_PATTERNS: NamedPattern[] = [
  // Edg, EdgA and EdgiOS across its platforms, plus the legacy EdgeHTML Edge
  { name: 'Edge', pattern: /Edge?(?:A|iOS)?\/([\d.]+)/ },
  { name: 'Opera', pattern: /(?:OPR|OPiOS|Opera)\/([\d.]+)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/([\d.]+)/ },
  { name: 'Firefox', pattern: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { name: 'Chrome', pattern: /(?:Chrome|Chromium|CriOS)\/([\d.]+)/ },
  // Safari/ carries a build number, so the version comes off the Version/ token
  { name: 'Safari', pattern: /Version\/([\d.]+).*\bSafari\// },
];

const ENGINE_PATTERNS: NamedPattern[] = [
  // every other engine says "like Gecko" in parentheses; only Gecko says "Gecko/"
  { name: 'Gecko', pattern: /Gecko\/\d/ },
  { name: 'Blink', pattern: /(?:Chrome|Chromium)\/\d/ },
  // the iOS browsers land here, since the platform gives them all one engine
  { name: 'WebKit', pattern: /AppleWebKit\/\d/ },
];

/** the NT numbering, translated back to what the release is called */
const WINDOWS_RELEASES: Record<string, string> = {
  '10.0': '10/11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
};

type OsPattern = {
  pattern: RegExp;
  format: (version: string) => string;
};

/** Apple writes its versions with underscores */
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

/** 119.0.6045.109 reads as 119.0 */
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
 * best effort by design: anything it cannot name comes back as `unknown`
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
