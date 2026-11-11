import { customElement } from "./element";
import { css, html, LitElement } from "lit";
import type { TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";

interface ConfirmationParams {
  title?: string;
  text?: string | TemplateResult;
  confirmText?: string;
  dismissText?: string;
  destructive?: boolean;
}
@customElement("emad-ui-confirmation")
export class EmadConfirmation extends LitElement {
  @property({ attribute: false }) public params: ConfirmationParams = {};
  public finish: (confirmed: boolean) => void = () => undefined;
  @query("dialog") private _dialog!: HTMLDialogElement;
  protected firstUpdated() {
    this._dialog.showModal();
  }
  private _answered = false;
  public answer(confirmed: boolean) {
    if (this._answered) return;
    this._answered = true;
    if (this._dialog?.open) this._dialog.close();
    this.finish(confirmed);
    this.remove();
  }
  public disconnectedCallback() {
    super.disconnectedCallback();
    this.answer(false);
  }
  protected render() {
    return html`<dialog
      aria-labelledby="title"
      @cancel=${(event: Event) => {
        event.preventDefault();
        this.answer(false);
      }}
    >
      <h2 id="title">${this.params.title}</h2>
      <p>${this.params.text}</p>
      <footer>
        <button autofocus @click=${() => this.answer(false)}>
          ${this.params.dismissText}</button
        ><button class="confirm" @click=${() => this.answer(true)}>
          ${this.params.confirmText}
        </button>
      </footer>
    </dialog>`;
  }
  static styles = css`
    :host {
      font-family: "Emad Dashboard Sans", "Emad Dashboard Arabic", sans-serif;
    }
    dialog {
      max-inline-size: min(480px, calc(100vw - 48px));
      box-sizing: border-box;
      padding: 24px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #181715);
      border: 1px solid var(--divider-color, #dce6e0);
      border-radius: 12px 3px 12px 3px;
    }
    dialog::backdrop {
      background: #0008;
    }
    h2 {
      margin: 0 0 16px;
      font-size: 22px;
    }
    p {
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    footer {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: flex-end;
    }
    button {
      min-inline-size: 88px;
      min-block-size: 48px;
      padding: 10px 16px;
      font: inherit;
      cursor: pointer;
      color: inherit;
      background: transparent;
      border: 1px solid var(--divider-color, #dce6e0);
    }
    .confirm {
      background: #69e1b7;
      color: #15362c;
    }
    button:focus-visible {
      outline: 3px solid #409778;
      outline-offset: 2px;
    }
  `;
}

const ownedDialogs = new WeakMap<HTMLElement, Set<EmadConfirmation>>();
export function closeOwnedDialogs(owner: HTMLElement) {
  for (const dialog of ownedDialogs.get(owner) ?? []) dialog.answer(false);
  ownedDialogs.delete(owner);
}
export function showConfirmationDialog(
  owner: HTMLElement,
  params: ConfirmationParams,
): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = new EmadConfirmation();
    dialog.params = params;
    dialog.dir = getComputedStyle(owner).direction;
    const style = getComputedStyle(owner);
    for (const name of [
      "--card-background-color",
      "--primary-text-color",
      "--divider-color",
    ])
      dialog.style.setProperty(name, style.getPropertyValue(name));
    const dialogs = ownedDialogs.get(owner) ?? new Set<EmadConfirmation>();
    ownedDialogs.set(owner, dialogs);
    dialogs.add(dialog);
    dialog.finish = (confirmed) => {
      dialogs.delete(dialog);
      resolve(confirmed);
    };
    document.body.append(dialog);
  });
}
declare global {
  interface HTMLElementTagNameMap {
    "emad-ui-confirmation": EmadConfirmation;
  }
}
