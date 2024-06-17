export function ThreadIcon({ darkMode }: { darkMode: boolean }) {
  return darkMode ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.5" clipPath="url(#clip0_332_2360)">
        <path
          d="M11.3218 14.4331L8.66645 11.7778H2.55534C2.14278 11.7778 1.74712 11.6139 1.45539 11.3222C1.16367 11.0304 0.999783 10.6348 0.999783 10.2222V8.55556C0.999783 8.143 1.16367 7.74733 1.45539 7.45561C1.74712 7.16389 2.14278 7 2.55534 7H13.3331C13.7457 7 14.1413 7.16389 14.4331 7.45561C14.7248 7.74733 14.8887 8.143 14.8887 8.55556V10.2222C14.8887 10.6348 14.7248 11.0304 14.4331 11.3222C14.1413 11.6139 13.7457 11.7778 13.3331 11.7778H11.7776V14.8889L11.3218 14.4331Z"
          stroke="#F5F5F5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="1"
          y="1"
          width="14"
          height="4"
          rx="1.5"
          stroke="#F5F5F5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_332_2360">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.5" clipPath="url(#clip0_332_2331)">
        <path
          d="M11.3218 14.4331L8.66645 11.7778H2.55534C2.14278 11.7778 1.74712 11.6139 1.45539 11.3222C1.16367 11.0304 0.999783 10.6348 0.999783 10.2222V8.55556C0.999783 8.143 1.16367 7.74733 1.45539 7.45561C1.74712 7.16389 2.14278 7 2.55534 7H13.3331C13.7457 7 14.1413 7.16389 14.4331 7.45561C14.7248 7.74733 14.8887 8.143 14.8887 8.55556V10.2222C14.8887 10.6348 14.7248 11.0304 14.4331 11.3222C14.1413 11.6139 13.7457 11.7778 13.3331 11.7778H11.7776V14.8889L11.3218 14.4331Z"
          stroke="#2E2E2E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="1"
          y="1"
          width="14"
          height="4"
          rx="1.5"
          stroke="#2E2E2E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_332_2331">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
