export function MessageIcon({ darkMode }: { darkMode: boolean }) {
  return darkMode ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.5" clipPath="url(#clip0_332_2358)">
        <path
          d="M4.88889 6.25H4.89667M8 6.25H8.00778M11.1111 6.25H11.1189M5.66667 11.1765H2.55556C2.143 11.1765 1.74733 11.0153 1.45561 10.7285C1.16389 10.4417 1 10.0527 1 9.64706V2.52941C1 2.12379 1.16389 1.73477 1.45561 1.44795C1.74733 1.16113 2.143 1 2.55556 1H13.4444C13.857 1 14.2527 1.16113 14.5444 1.44795C14.8361 1.73477 15 2.12379 15 2.52941V9.64706C15 10.0527 14.8361 10.4417 14.5444 10.7285C14.2527 11.0153 13.857 11.1765 13.4444 11.1765H9.55556L5.66667 15V11.1765Z"
          stroke="#F5F5F5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_332_2358">
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
      <g opacity="0.5" clipPath="url(#clip0_332_2329)">
        <path
          d="M4.88889 6.25H4.89667M8 6.25H8.00778M11.1111 6.25H11.1189M5.66667 11.1765H2.55556C2.143 11.1765 1.74733 11.0153 1.45561 10.7285C1.16389 10.4417 1 10.0527 1 9.64706V2.52941C1 2.12379 1.16389 1.73477 1.45561 1.44795C1.74733 1.16113 2.143 1 2.55556 1H13.4444C13.857 1 14.2527 1.16113 14.5444 1.44795C14.8361 1.73477 15 2.12379 15 2.52941V9.64706C15 10.0527 14.8361 10.4417 14.5444 10.7285C14.2527 11.0153 13.857 11.1765 13.4444 11.1765H9.55556L5.66667 15V11.1765Z"
          stroke="#2E2E2E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_332_2329">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
