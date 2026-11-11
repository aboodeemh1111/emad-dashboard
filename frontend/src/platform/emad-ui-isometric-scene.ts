import { customElement } from "./element";
import type { TemplateResult } from "lit";
import { css, html, LitElement, svg } from "lit";

// Decorative brand illustration. It never represents actual building telemetry.
@customElement("emad-ui-isometric-scene")
export class EmadIsometricScene extends LitElement {
  protected render(): TemplateResult {
    return html`
      <svg
        viewBox="0 0 540 350"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="emad-roof"
            x1="180"
            y1="85"
            x2="340"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#9AF0D0" />
            <stop offset="1" stop-color="#4CC797" />
          </linearGradient>
          <linearGradient
            id="emad-front"
            x1="220"
            y1="130"
            x2="260"
            y2="305"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#294B3B" />
            <stop offset="1" stop-color="#152C22" />
          </linearGradient>
          <pattern
            id="emad-grid"
            width="56"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0 56 16 28 32 0 16Z"
              stroke="#69E1B7"
              stroke-opacity=".09"
              stroke-width=".7"
            />
          </pattern>
        </defs>
        <path d="M268 124 510 260 268 397 26 260Z" fill="url(#emad-grid)" />
        <path
          d="m109 264 172-99 172 99-172 100Z"
          fill="#08160F"
          fill-opacity=".5"
        />
        <path d="m109 249 172-99 172 99v15L281 364 109 264Z" fill="#153A29" />
        <path
          d="m109 249 172-99 172 99-172 100Z"
          fill="#1C392C"
          stroke="#69E1B7"
          stroke-opacity=".3"
        />
        <path
          d="m131 249 150-86 150 86-150 87Z"
          stroke="#69E1B7"
          stroke-opacity=".16"
        />
        <path d="m264 78 95 55v143l-95 55-95-55V133Z" fill="#244A36" />
        <path
          d="m169 133 95 55v143l-95-55Z"
          fill="url(#emad-front)"
          stroke="#69E1B7"
          stroke-opacity=".35"
        />
        <path
          d="m264 188 95-55v143l-95 55Z"
          fill="#10291D"
          stroke="#69E1B7"
          stroke-opacity=".4"
        />
        <path d="m169 133 95-55 95 55-95 55Z" fill="url(#emad-roof)" />
        <path
          d="m182 133 82-47 82 47-82 48Z"
          stroke="#C9FFE9"
          stroke-opacity=".65"
        />
        <path d="m218 124 45-26 45 26-45 26Z" fill="#2E8864" />
        <path
          d="m218 124 45 26v10l-45-26Zm45 26 45-26v10l-45 26Z"
          fill="#1C6044"
        />
        <path d="m229 124 34-20 34 20-34 19Z" fill="#82DAB5" />
        <g transform="matrix(.866 .5 0 1 169 133)">
          ${[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3].map(
              (column) => svg`
              <rect x=${14 + column * 24} y=${25 + row * 27} width="13" height="15" rx="1"
                fill=${(row + column) % 4 === 0 ? "#81DDB8" : "#456753"}
                fill-opacity=${(row + column) % 4 === 0 ? ".85" : ".6"} />
            `,
            ),
          )}
        </g>
        <g transform="matrix(.866 -.5 0 1 264 188)">
          ${[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3].map(
              (column) => svg`
              <rect x=${14 + column * 24} y=${25 + row * 27} width="13" height="15" rx="1"
                fill=${(row + column) % 3 === 0 ? "#69E1B7" : "#31513E"}
                fill-opacity=${(row + column) % 3 === 0 ? ".7" : ".8"} />
            `,
            ),
          )}
        </g>
        <path
          d="m169 174 95 55 95-55m-190 29 95 55 95-55m-190 29 95 55 95-55"
          stroke="#79C7A2"
          stroke-opacity=".2"
        />
        <path d="m126 200 42-24 42 24v82l-42 24-42-24Z" fill="#2B5940" />
        <path d="m126 200 42 24v82l-42-24Z" fill="#326B4D" />
        <path d="m168 224 42-24v82l-42 24Z" fill="#1B4530" />
        <path d="m126 200 42-24 42 24-42 24Z" fill="#8BE7BD" />
        <path
          d="m136 225 21 12v13l-21-12Zm0 26 21 12v13l-21-12Zm42-14 21-12v13l-21 12Zm0 26 21-12v13l-21 12Z"
          fill="#92C4A7"
          fill-opacity=".65"
        />
        <path
          d="m355 224 46 27v-88l-46-26M169 134l-48-28-39 22"
          stroke="#69E1B7"
          stroke-opacity=".5"
          stroke-dasharray="4 5"
        />
        <path
          d="m264 78 0-30 51-29"
          stroke="#69E1B7"
          stroke-opacity=".5"
          stroke-dasharray="4 5"
        />
        <g transform="translate(315 18)">
          <path
            d="m-21-12 21-12 21 12v24L0 24l-21-12Z"
            fill="#214831"
            stroke="#69E1B7"
            stroke-opacity=".55"
          />
          <path
            d="m-8-4 8-5 8 5v10L0 11l-8-5Z"
            stroke="#A1F1CC"
            stroke-width="1.5"
          />
          <path d="M0 1v10m-8-15 8 5 8-5" stroke="#A1F1CC" stroke-width="1.5" />
        </g>
        <g transform="translate(401 149)">
          <path
            d="m-21-12 21-12 21 12v24L0 24l-21-12Z"
            fill="#214831"
            stroke="#69E1B7"
            stroke-opacity=".55"
          />
          <path d="m-5-9-4 12h8l-3 9 13-15H1l4-6Z" fill="#A1F1CC" />
        </g>
        <g transform="translate(81 129)">
          <path
            d="m-21-12 21-12 21 12v24L0 24l-21-12Z"
            fill="#214831"
            stroke="#69E1B7"
            stroke-opacity=".55"
          />
          <circle r="7" stroke="#A1F1CC" stroke-width="1.5" />
          <path
            d="M0-12v5m0 14v5M-12 0h5m14 0h5"
            stroke="#A1F1CC"
            stroke-width="1.5"
          />
        </g>
        <path
          d="m347 304 18-10 18 10-18 11Z"
          fill="#69E1B7"
          fill-opacity=".45"
        />
        <path d="m206 334 12-7 12 7-12 7Z" fill="#69E1B7" fill-opacity=".3" />
      </svg>
    `;
  }

  static styles = css`
    :host {
      display: block;
      pointer-events: none;
    }
    svg {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      overflow: visible;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "emad-ui-isometric-scene": EmadIsometricScene;
  }
}
