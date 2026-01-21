/**
 * Centralized GitHub color palette
 *
 * Language colors from GitHub Linguist:
 * https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
 *
 * Contribution graph colors from GitHub's dark theme.
 */

// GitHub Language Colors (hex format)
export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Java: '#B07219',
  Ruby: '#CC342D',
  'C++': '#F34B7D',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Other: '#8B8B8B',
};

// Pre-computed RGB tuples for performance (avoids parsing on every render)
export const LANGUAGE_COLORS_RGB: Record<string, [number, number, number]> = {
  Python: [53, 114, 165],
  JavaScript: [247, 223, 30],
  TypeScript: [49, 120, 198],
  Go: [0, 173, 216],
  Rust: [222, 165, 132],
  Java: [176, 114, 25],
  Ruby: [204, 52, 45],
  'C++': [243, 75, 125],
  PHP: [79, 93, 149],
  Swift: [240, 81, 56],
  Kotlin: [169, 123, 255],
  Other: [139, 139, 139],
};

// GitHub Contribution Graph Colors (dark theme)
export const CONTRIBUTION_COLORS = {
  level0: '#161b22', // No activity (dark gray)
  level1: '#0e4429', // Low activity (1-2 commits)
  level2: '#006d32', // Medium activity (3-9 commits)
  level3: '#26a641', // High activity (10-29 commits)
  level4: '#39d353', // Very high activity (30+ commits)
} as const;

// Ordered list of supported languages for UI
export const SUPPORTED_LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Java',
  'Ruby',
  'C++',
  'PHP',
  'Swift',
  'Kotlin',
  'Other',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Get hex color for a programming language
 */
export function getLanguageHex(language: string | null | undefined): string {
  return LANGUAGE_COLORS[language || 'Other'] || LANGUAGE_COLORS.Other;
}

/**
 * Get RGB tuple for a programming language
 */
export function getLanguageRgb(
  language: string | null | undefined
): [number, number, number] {
  return LANGUAGE_COLORS_RGB[language || 'Other'] || LANGUAGE_COLORS_RGB.Other;
}

/**
 * Get RGBA color string for a programming language with opacity
 */
export function getLanguageRgba(
  language: string | null | undefined,
  opacity: number
): string {
  const [r, g, b] = getLanguageRgb(language);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get contribution graph color based on activity count
 */
export function getContributionColor(activityCount: number): string {
  if (activityCount === 0) return CONTRIBUTION_COLORS.level0;
  if (activityCount < 3) return CONTRIBUTION_COLORS.level1;
  if (activityCount < 10) return CONTRIBUTION_COLORS.level2;
  if (activityCount < 30) return CONTRIBUTION_COLORS.level3;
  return CONTRIBUTION_COLORS.level4;
}

/**
 * Get contribution graph altitude based on activity count
 * Used for extruded hex polygons
 */
export function getContributionAltitude(activityCount: number): number {
  if (activityCount === 0) return 0.005; // Flat baseline
  if (activityCount < 3) return 0.01; // Low activity
  if (activityCount < 10) return 0.02; // Medium activity
  if (activityCount < 30) return 0.035; // High activity
  return 0.05; // Very high activity
}
