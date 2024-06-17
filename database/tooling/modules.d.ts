declare module 'pg-formatter' {
  export type UserConfigurationType = {
    anonymize?: boolean;
    functionCase?: 'unchanged' | 'lowercase' | 'uppercase' | 'capitalize';
    keywordCase?: 'unchanged' | 'lowercase' | 'uppercase' | 'capitalize';
    noRcFile?: boolean;
    placeholder?: string;
    spaces?: number;
    stripComments?: boolean;
    tabs?: boolean;
  };

  export function format(
    sql: string,
    userConfiguration?: UserConfigurationType,
  ): string;
}
