import { describe, expect, test } from 'vitest';

import { parseUserAgent } from './parseUserAgent.ts';

/** real strings, since the point of the parser is surviving what browsers actually send */
const USER_AGENTS = {
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  firefoxMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  operaWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  firefoxIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15',
  safariIpad:
    'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  firefoxLinux:
    'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  chromeOs:
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
} as const;

describe(parseUserAgent, () => {
  test('names the browser Chrome rather than the Safari it claims to be', () => {
    expect(parseUserAgent(USER_AGENTS.chromeMac)).toEqual({
      browser: 'Chrome',
      version: '131.0',
      engine: 'Blink',
      os: 'macOS 10.15.7',
      isMobile: false,
    });
  });

  test('names the browser Edge rather than the Chrome it claims to be', () => {
    expect(parseUserAgent(USER_AGENTS.edgeWindows)).toMatchObject({
      browser: 'Edge',
      version: '131.0',
      engine: 'Blink',
      os: 'Windows 10/11',
    });
  });

  test('names the browser Opera rather than the Chrome it claims to be', () => {
    expect(parseUserAgent(USER_AGENTS.operaWindows)).toMatchObject({
      browser: 'Opera',
      version: '115.0',
      engine: 'Blink',
    });
  });

  test('names Samsung Internet ahead of the Chrome it is built on', () => {
    expect(parseUserAgent(USER_AGENTS.samsung)).toMatchObject({
      browser: 'Samsung Internet',
      version: '27.0',
      engine: 'Blink',
      isMobile: true,
    });
  });

  test('reads Safari off the Version token, not the Safari build number', () => {
    expect(parseUserAgent(USER_AGENTS.safariMac)).toEqual({
      browser: 'Safari',
      version: '18.1',
      engine: 'WebKit',
      os: 'macOS 10.15.7',
      isMobile: false,
    });
  });

  test('reads Firefox as the one browser actually running Gecko', () => {
    expect(parseUserAgent(USER_AGENTS.firefoxMac)).toMatchObject({
      browser: 'Firefox',
      version: '133.0',
      engine: 'Gecko',
      os: 'macOS 10.15',
    });
  });

  test('reads Linux from a Firefox that never mentions a distribution', () => {
    expect(parseUserAgent(USER_AGENTS.firefoxLinux)).toMatchObject({
      engine: 'Gecko',
      os: 'Linux',
      isMobile: false,
    });
  });

  test('reads Windows from its NT numbering', () => {
    expect(parseUserAgent(USER_AGENTS.chromeWindows).os).toBe('Windows 10/11');
  });

  test('reads ChromeOS ahead of the X11 it shares with Linux', () => {
    expect(parseUserAgent(USER_AGENTS.chromeOs).os).toBe('ChromeOS');
  });

  test('reads Android ahead of the Linux it is built on', () => {
    expect(parseUserAgent(USER_AGENTS.chromeAndroid)).toMatchObject({
      browser: 'Chrome',
      os: 'Android 14',
      isMobile: true,
    });
  });

  test('reads iOS ahead of the Mac OS X it says it is like', () => {
    expect(parseUserAgent(USER_AGENTS.safariIphone)).toMatchObject({
      browser: 'Safari',
      version: '18.1',
      os: 'iOS 18.1',
      isMobile: true,
    });
  });

  test('tells an iPad apart from an iPhone', () => {
    expect(parseUserAgent(USER_AGENTS.safariIpad).os).toBe('iPadOS 18.1');
  });

  test('keeps Chrome on iOS branded Chrome but engined WebKit', () => {
    expect(parseUserAgent(USER_AGENTS.chromeIos)).toMatchObject({
      browser: 'Chrome',
      version: '131.0',
      engine: 'WebKit',
      os: 'iOS 18.1',
    });
  });

  test('keeps Firefox on iOS branded Firefox but engined WebKit', () => {
    expect(parseUserAgent(USER_AGENTS.firefoxIos)).toMatchObject({
      browser: 'Firefox',
      version: '133.0',
      engine: 'WebKit',
    });
  });

  test('falls back to unknown rather than guessing at an unrecognized string', () => {
    expect(parseUserAgent('some-crawler/1.0')).toEqual({
      browser: 'unknown',
      version: 'unknown',
      engine: 'unknown',
      os: 'unknown',
      isMobile: false,
    });
  });

  test('survives an empty string', () => {
    expect(parseUserAgent('').browser).toBe('unknown');
  });
});
