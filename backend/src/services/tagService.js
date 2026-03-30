const vibeKeywords = {
  music: ["song", "playlist", "album", "beat", "concert", "vinyl"],
  fashion: ["outfit", "style", "fit", "look", "vintage", "streetwear"],
  travel: ["trip", "flight", "beach", "city", "hotel", "passport"],
  food: ["recipe", "coffee", "dinner", "brunch", "bake", "spicy"],
  gaming: ["game", "boss", "level", "quest", "console", "co-op"],
  art: ["sketch", "paint", "palette", "gallery", "design", "moodboard"],
  wellness: ["routine", "meditate", "workout", "yoga", "heal", "focus"],
  study: ["notes", "exam", "study", "class", "revision", "brainstorm"]
};

export function suggestTags(text = "") {
  const source = text.toLowerCase();
  const matched = Object.entries(vibeKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => source.includes(keyword)))
    .map(([tag]) => tag);

  const fallbackWords = source
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4);

  return [...new Set([...matched, ...fallbackWords.slice(0, 3)])].slice(0, 6);
}
