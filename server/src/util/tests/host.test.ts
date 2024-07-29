import { extractHostname } from 'server/src/util/host.ts';

test('should extract hostname without port', () => {
  expect(extractHostname('example.io')).toBe('example.io');
});

test('should extract hostname with port', () => {
  expect(extractHostname('example.io:443')).toBe('example.io');
});

test('should extract subdomain and hostname without port', () => {
  // Default value for SLACK_APP_REDIRECT_HOST when on local dev
  expect(extractHostname('api.staging.cord.com')).toBe('api.staging.cord.com');
  expect(extractHostname('api.example.io')).toBe('api.example.io');
});

test('should extract subdomain and hostname with port', () => {
  expect(extractHostname('api.example.io:443')).toBe('api.example.io');
});

test('should handle invalid hostname', () => {
  expect(extractHostname('')).toBe(null);
  expect(extractHostname(':443')).toBe(null);
  expect(extractHostname('invalid-host:')).toBe('invalid-host');
});

test('should handle hostname with path', () => {
  expect(extractHostname('example.io/path')).toBe('example.io');
  expect(extractHostname('example.io:443/path')).toBe('example.io');
});

test('should handle complex subdomains', () => {
  expect(extractHostname('sub.subdomain.example.io')).toBe('sub.subdomain.example.io');
  expect(extractHostname('sub.subdomain.example.io:8080')).toBe('sub.subdomain.example.io');
});

test('should handle null and undefined', () => {
  expect(extractHostname(undefined)).toBe(null);
});
