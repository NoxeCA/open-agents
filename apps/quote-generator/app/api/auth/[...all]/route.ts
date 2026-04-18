// TODO: wire Better Auth handler. Something like:
//   import { auth } from "@/lib/auth";
//   import { toNextJsHandler } from "better-auth/next-js";
//   export const { GET, POST } = toNextJsHandler(auth.handler);

export async function GET() {
  return new Response("Not Implemented", { status: 501 });
}

export async function POST() {
  return new Response("Not Implemented", { status: 501 });
}
