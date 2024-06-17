import fs from 'fs';
import os from 'os';
import path from 'path';

const KEYS = [
  'VERSION_LAST_CHECKED',
  'CORD_PROJECT_ID',
  'CORD_PROJECT_SECRET',
  'CORD_CUSTOMER_ID',
  'CORD_CUSTOMER_SECRET',
  'CORD_API_URL',
] as const;
type EnvKey = (typeof KEYS)[number];
type Env = Partial<{ [key in EnvKey]: string }>;

function isEnvKey(input: string): input is EnvKey {
  return KEYS.includes(input as EnvKey);
}

export function buildQueryParams(
  args: {
    field: string;
    value: string | number | undefined;
  }[],
) {
  const params = new URLSearchParams();
  args.forEach(({ field, value }) => {
    if (value) {
      params.set(field, value.toString());
    }
  });
  return '?' + params.toString();
}

export const cordConfigPath =
  process.env.CORD_CONFIG_PATH ?? path.join(os.homedir(), '.cord');
const asyncFs = fs.promises;

export async function getEnvVariables() {
  const env: Env = {};
  const data = await asyncFs.readFile(cordConfigPath, 'utf-8');
  if (data) {
    data
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .forEach((entry) => {
        const [key, value] = entry.split('=');
        const trimmedKey = key.trim();
        if (isEnvKey(trimmedKey)) {
          env[trimmedKey] = value.trim();
        }
      });
  }
  return env;
}

export async function updateEnvVariables(newVariables: Env) {
  const existingVariables = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  const updatedVariables = {
    ...existingVariables,
    ...newVariables,
  };
  const envString = Object.entries(updatedVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(cordConfigPath, envString);
}

/**
 * Checks if `a` is a later version than `b`.
 * This will only work for versions in the format of NUMBER.NUMBER.NUMBER
 * We are okay with that here as we are always checking for this format.
 */
export function isLaterCliVersion(a: string, b: string) {
  const first = a.split('.');
  const second = b.split('.');

  for (let i = 0; i < first.length; i++) {
    if (+first[i] > +second[i]) {
      return true;
    }
    if (+first[i] < +second[i]) {
      return false;
    }
  }
  return false;
}

/**
 * For values that may be specified multiple times, converts either a single
 * invocation or multiple invocations into an array of values.
 */
export function makeArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}
