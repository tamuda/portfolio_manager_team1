/** Name of the httpOnly cookie that holds the backend's JWT access token. */
export const AUTH_COOKIE_NAME = "access_token";

/**
 * Matches the backend's ACCESS_TOKEN_EXPIRE_MINUTES default (7 days), in seconds.
 * Kept in sync manually since the two apps don't share config.
 */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
