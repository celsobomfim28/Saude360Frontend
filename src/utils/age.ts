export function formatPatientAge(age?: number, ageMonths?: number): string {
    const years = age ?? 0;
    if (ageMonths !== undefined && years < 1) {
        if (ageMonths <= 0) return 'menos de 1 mês';
        return `${ageMonths} ${ageMonths === 1 ? 'mês' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}