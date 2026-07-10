/** Hulpfuncties voor de maandkalender (maandag als eerste dag, nl). */

export const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const maandFormatter = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});

export function monthLabel(year: number, month: number): string {
  return maandFormatter.format(new Date(year, month, 1));
}

/** 42 dagen (6 weken) vanaf de maandag op/vóór de 1e van de maand. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // maandag = 0
  return Array.from(
    { length: 42 },
    (_, i) => new Date(year, month, 1 - offset + i)
  );
}

/** Begin (incl.) en einde (excl.) van het zichtbare grid, voor de DB-query. */
export function monthGridRange(year: number, month: number) {
  const grid = buildMonthGrid(year, month);
  const start = grid[0];
  const end = new Date(grid[41]);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Lokale sleutel "YYYY-MM-DD" om momenten per dag te groeperen. */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Vorige/volgende maand als "YYYY-MM"-string voor navigatie. */
export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Parseert ?maand=YYYY-MM; valt terug op de huidige maand. */
export function parseMonthParam(value: string | undefined): {
  year: number;
  month: number;
} {
  const now = new Date();
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}
