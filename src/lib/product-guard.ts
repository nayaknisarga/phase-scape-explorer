const CLINICAL = [/contracept/i, /birth control/i, /\bpill/i, /prescription/i, /\brx\b/i, /tablet/i, /medicine/i, /hormon/i, /emergency/i, /i-?pill/i, /tranexamic/i, /mefenamic/i];

/** Product search is never run for contraceptives or prescription medicine. */
export function isClinicalQuery(q: string) {
  return CLINICAL.some((r) => r.test(q));
}
