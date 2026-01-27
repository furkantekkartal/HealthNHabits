/**
 * Returns the appropriate meal type based on current time of day
 * - 5am-10am → breakfast
 * - 10am-3pm → lunch
 * - 3pm-8pm → dinner
 * - 8pm-5am → snack
 */
export function getMealTypeFromTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 20) return 'dinner';
    return 'snack';
}
