import { html } from "lit";

/** Decorative device illustrations; geometry follows only reported entity state. */
export const doorVisual = (open: boolean, locked: boolean) =>
  html` <svg
    class="door-visual ${open ? "door-open" : ""} ${locked ? "door-locked" : ""}"
    viewBox="0 0 180 132"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M27 110 94 72 158 109 91 145Z" fill="currentColor" opacity=".05" />
    <path
      d="m60 29 43-16 26 13v87l-44 17-25-14Z"
      fill="currentColor"
      opacity=".12"
    />
    <path d="m62 27 41-15 24 13-42 16Z" fill="currentColor" opacity=".28" />
    <path d="M62 27v85l23 13V40Z" fill="currentColor" opacity=".15" />
    <path
      d="m85 40 42-15v86l-42 15Z"
      fill="var(--card-background-color,#fff)"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <g class="door-leaf">
      <path
        d="m89 43 34-12v77l-34 12Z"
        fill="currentColor"
        opacity=".2"
        stroke="currentColor"
      />
      <path
        d="m94 49 24-8v29l-24 9Z"
        fill="var(--card-background-color,#fff)"
        opacity=".55"
      />
      <path d="m94 85 24-9v24l-24 9Z" stroke="currentColor" opacity=".32" />
      <path
        d="M115 78v9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <g class="lock-mark" transform="translate(31 68)">
      <rect
        x="0"
        y="13"
        width="29"
        height="24"
        rx="4"
        fill="var(--card-background-color,#fff)"
        stroke="currentColor"
        stroke-width="2"
      />
      <path
        class="shackle"
        d="M7 13V8a7.5 7.5 0 0 1 15 0v5"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
      <circle cx="14.5" cy="24" r="2.5" fill="currentColor" />
    </g>
  </svg>`;

export const vacuumVisual = (cleaning: boolean) =>
  html` <svg
    class="vacuum-visual ${cleaning ? "cleaning" : ""}"
    viewBox="0 0 200 130"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse
      cx="100"
      cy="105"
      rx="63"
      ry="15"
      fill="currentColor"
      opacity=".08"
    />
    <g class="robot">
      <g class="robot-brush" style="transform-origin:48px 84px">
        <path
          d="m33 76 30 16M32 90l31-12M47 67l2 32"
          stroke="currentColor"
          stroke-width="2"
          opacity=".6"
        />
      </g>
      <g class="robot-brush" style="transform-origin:151px 84px">
        <path
          d="m136 76 30 16m-31-2 31-12m-16-11 2 32"
          stroke="currentColor"
          stroke-width="2"
          opacity=".6"
        />
      </g>
      <path
        d="M42 65v18c0 23 26 38 58 38s58-15 58-38V65Z"
        fill="currentColor"
        opacity=".25"
      />
      <ellipse
        cx="100"
        cy="65"
        rx="58"
        ry="37"
        fill="var(--card-background-color,#fff)"
        stroke="currentColor"
        stroke-width="2"
      />
      <ellipse
        cx="100"
        cy="65"
        rx="48"
        ry="30"
        fill="currentColor"
        opacity=".12"
      />
      <path
        d="M52 77c20 22 74 22 96 0"
        stroke="currentColor"
        opacity=".5"
        stroke-width="2"
      />
      <ellipse
        cx="100"
        cy="56"
        rx="19"
        ry="12"
        fill="currentColor"
        opacity=".3"
      />
      <path
        d="M81 49v7c0 7 8 12 19 12s19-5 19-12v-7Z"
        fill="currentColor"
        opacity=".18"
      />
      <ellipse
        cx="100"
        cy="49"
        rx="19"
        ry="12"
        fill="var(--card-background-color,#fff)"
        stroke="currentColor"
      />
      <ellipse
        cx="100"
        cy="49"
        rx="9"
        ry="5"
        fill="currentColor"
        opacity=".7"
      />
      <path
        d="M93 85h14"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
  </svg>`;

export const speakerVisual = (playing: boolean) =>
  html` <div
    class="speaker-scene ${playing ? "playing" : ""}"
    aria-hidden="true"
  >
    <div class="speaker-box">
      <span class="speaker-tweeter"></span
      ><span class="speaker-cone"><i></i></span
      ><span class="speaker-led"></span>
    </div>
    <div class="equalizer">
      ${[0, 1, 2, 3, 4, 5, 6].map((n) => html`<i style=${`--n:${n}`}></i>`)}
    </div>
  </div>`;
