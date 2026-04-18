export const DEFAULT_LOCAL_APP_URL = "http://localhost:3001";
export const DEV_AUTH_USER_ID = "dev-local-user";
export const DEV_AUTH_USER_EMAIL = "local@noxe.ca";
export const DEV_AUTH_USER_NAME = "Local Dev";

export function isDevAuthBypassed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_SKIP_AUTH === "true"
  );
}
