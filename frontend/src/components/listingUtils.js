export const ROOM_TYPE_LABELS = {
  bed: 'Bed in shared room',
  room: 'Private room',
  apartment: 'Apartment',
  other: 'Other',
};

export function roomTypeLabel(value) {
  return ROOM_TYPE_LABELS[value] || 'Room';
}

export function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Price on request';
  }
  const numeric = Number(price);
  if (Number.isNaN(numeric)) {
    return `${price} KGS`;
  }
  return `${numeric.toLocaleString('ru-RU')} KGS`;
}

/**
 * Build the most-native contact link for an owner.
 * Prefers a Telegram chat, then a Telegram deep link by id, then a phone call.
 */
export function buildContactLink({ telegramUsername, telegramId, phone }) {
  if (telegramUsername) {
    const handle = String(telegramUsername).replace(/^@/, '');
    return { href: `https://t.me/${handle}`, label: 'Contact on Telegram' };
  }
  if (telegramId) {
    return { href: `tg://user?id=${telegramId}`, label: 'Contact on Telegram' };
  }
  if (phone) {
    return { href: `tel:${phone}`, label: `Call ${phone}` };
  }
  return null;
}

export function mapLink(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
