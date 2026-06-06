export function buildSourceMetadata(
    raw: Record<string, unknown> | null | undefined,
    promotedKeys: readonly string[],
    extra?: Record<string, unknown>,
): Record<string, unknown> {
    const promoted = new Set(promotedKeys);
    const out: Record<string, unknown> = {};
    if (raw && typeof raw === 'object') {
        for (const [key, value] of Object.entries(raw)) {
            if (!promoted.has(key)) out[key] = value;
        }
    }
    if (extra) {
        for (const [key, value] of Object.entries(extra)) {
            if (value !== undefined) out[key] = value;
        }
    }
    return out;
}
