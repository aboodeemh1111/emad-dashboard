/** A connected HA tab can import an updated hashed module before a full reload.
 * Keep the existing element until reload, without duplicate-registry exceptions.
 */
export function customElement(name: string) {
  return <T extends CustomElementConstructor>(constructor: T): T => {
    if (!customElements.get(name)) customElements.define(name, constructor);
    return constructor;
  };
}
