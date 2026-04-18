import { customAlphabet, nanoid as _nanoid } from "nanoid";

// URL-safe alphabet, no look-alikes, for public-facing IDs.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const shortId = customAlphabet(alphabet, 12);

export function nanoid(size = 16) {
  return _nanoid(size);
}

export function newId() {
  return _nanoid();
}

export function newShortId() {
  return shortId();
}
