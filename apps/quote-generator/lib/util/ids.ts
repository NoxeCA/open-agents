import { customAlphabet, nanoid } from "nanoid";

// URL-safe alphabet, no look-alikes, for public-facing IDs.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const shortId = customAlphabet(alphabet, 12);

export function newId() {
  return nanoid();
}

export function newShortId() {
  return shortId();
}
