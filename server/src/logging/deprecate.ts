import type { UUID } from 'common/types/index.ts';
import { Counter } from 'server/src/logging/prometheus.ts';

const counter = Counter({
  name: 'DeprecatedCode',
  help: 'Tracks how often deprecated code is executed',
  labelNames: ['label', 'appID'],
});

export function deprecated(label: string, appID?: UUID) {
  counter.inc({ label, appID: appID ?? 'unspecified' });
}

export function deprecatedFunction<Args extends any[], ReturnType>(
  func: (...args: Args) => ReturnType,
  label: string,
) {
  return (...args: Args) => {
    deprecated(
      label,
      // If this is a GraphQL resolver (very common), try to extract the appID
      // from the viewer
      args[2]?.session?.viewer?.platformApplicationID ?? undefined,
    );
    return func(...args);
  };
}
