import type { Database } from "@/lib/types";

export type ContactType = Database["public"]["Enums"]["contact_type"];

export const CONTACT_TYPES: {
  value: ContactType;
  label: string;
  color: string;
}[] = [
  { value: "gebeld", label: "Gebeld", color: "#2E6FD8" },
  { value: "gemaild", label: "Gemaild", color: "#5B2D90" },
  { value: "gesprek", label: "Gesprek", color: "#1E8E5A" },
  { value: "overig", label: "Overig", color: "#6B6580" },
];

const BY_VALUE = new Map(CONTACT_TYPES.map((t) => [t.value, t]));

export function contactType(value: ContactType) {
  return BY_VALUE.get(value) ?? CONTACT_TYPES[3];
}

/** Date → "YYYY-MM-DDTHH:mm" in lokale tijd, voor <input type="datetime-local">. */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
