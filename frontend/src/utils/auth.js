/**
 * Utility for Auth Token Management
 * 
 * Implements "Lazy Migration":
 * On first access, if 'token' is missing but legacy 'authToken' exists,
 * it migrates the value to 'token' and cleans up the legacy key.
 */

const TOKEN_KEY = 'token';
const LEGACY_TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

/**
 * Retrieves the authentication token.
 * Automatically migrates legacy 'authToken' if found.
 * @returns {string|null} The JWT token or null if not found.
 */
export const getToken = () => {
    let token = localStorage.getItem(TOKEN_KEY);

    // Migration Logic: If no standard token, check legacy
    if (!token) {
        const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
        if (legacyToken) {
            console.warn('[Auth] Migrating legacy authToken to standard token key.');
            token = legacyToken;
            setToken(token); // Save to new key
            localStorage.removeItem(LEGACY_TOKEN_KEY); // Clean legacy
        }
    }

    return token;
};

/**
 * Saves the authentication token.
 * Ensures legacy key is removed to avoid confusion.
 * @param {string} token 
 */
export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY); // Ensure legacy key is gone
};

/**
 * Clears all authentication data.
 * Removes token, legacy token, and user data.
 */
export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Checks if the user is authenticated.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    return !!getToken();
};
