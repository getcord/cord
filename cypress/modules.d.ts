declare module 'mochawesome-merge' {
  export function merge(options?: { files?: string[] }): any;
}

declare module 'mochawesome-report-generator' {
  export function create(data: any, opts: any): any;
}
