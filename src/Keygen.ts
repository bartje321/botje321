
const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";

/** Get a ranfom key */
export function keygen(): string {
    let result = "";
    while (result.length < 32) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
