import { expect } from "vitest";

export function expectNoCsvControls(text: string) {
  expect(text.toLowerCase()).not.toMatch(/\bcsv\b|import csv|export csv|upload spreadsheet|download spreadsheet/);
}

