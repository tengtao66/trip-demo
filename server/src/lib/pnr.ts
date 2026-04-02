import db from "../services/db.js";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded I, O, 0, 1 for readability

function randomChars(len: number): string {
  let result = "";
  for (let i = 0; i < len; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export function generateBookingReference(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const ref = `TERRA-${randomChars(4)}`;
    const existing = db
      .prepare("SELECT 1 FROM bookings WHERE booking_reference = ?")
      .get(ref);
    if (!existing) return ref;
  }
  // Fallback with longer suffix
  return `TERRA-${randomChars(6)}`;
}
