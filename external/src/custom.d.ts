declare module '*.svg' {
  const content: (props: React.HTMLProps<SVGElement>) => JSX.Element;
  export default content;
}

declare module '*.graphql' {
  import type { DocumentNode } from 'graphql';
  const content: DocumentNode;
  export default content;
}

declare module 'jwt-encode' {
  export default function sign(data: object, key: string): string;
}

declare namespace Express {
  export interface Request {
    appID?: string;
    customerID?: string;
  }
}

declare module '*.txt' {
  const content: string;
  export default content;
}
