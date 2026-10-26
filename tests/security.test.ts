import { it, expect } from 'vitest';
import { isLoopback, assertLocalMutation } from '../src/lib/security/local';
it('recusa hosts externos e DNS rebinding', () => {
  expect(isLoopback('localhost:3000')).toBe(true);
  expect(isLoopback('127.0.0.1:3000')).toBe(true);
  expect(isLoopback('[::1]:3000')).toBe(true);
  expect(isLoopback('localhost.evil.test')).toBe(false);
  expect(isLoopback('evil.test')).toBe(false);
});
it('recusa escrita sem origem ou de outra origem', () => {
  expect(() =>
    assertLocalMutation(
      new Request('http://localhost:3000/api/snapshots', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
        },
      }),
    ),
  ).not.toThrow();
  for (const origin of [null, 'https://evil.test', 'http://localhost:4000']) {
    const headers: Record<string, string> = {
      host: 'localhost:3000',
      'content-type': 'application/json',
    };
    if (origin) headers.origin = origin;
    expect(() =>
      assertLocalMutation(
        new Request('http://localhost:3000/api/snapshots', { method: 'POST', headers }),
      ),
    ).toThrow();
  }
});
it('usa Host público local mesmo quando Next monta URL interna com 127.0.0.1', () => {
  expect(() =>
    assertLocalMutation(
      new Request('http://127.0.0.1:3000/api/snapshots', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
        },
      }),
    ),
  ).not.toThrow();
});
