/**
 * inferRoomShortName — derive a short room code from its full name.
 *
 * If the full name starts with 2+ digits (optionally followed by a Cyrillic/Latin letter),
 * returns the numeric prefix wrapped in dashes to match the manual naming convention.
 * Otherwise returns null (no auto-generation possible).
 *
 * Examples:
 *   "228А математика"   → "-228А-"
 *   "114 Кабинет"       → "-114-"
 *   "22а Химия"         → "-22а-"
 *   "ГИМ зал"           → null
 *   "3б кабинет"        → null  (single digit — likely a class label)
 */
export function inferRoomShortName(fullName: string): string | null {
  const match = fullName.trim().match(/^(\d{2,}[А-Яа-яёA-Za-z]?)/);
  return match ? `-${match[1]}-` : null;
}
