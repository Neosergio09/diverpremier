export const extractNumber = (val: string | number | undefined | null): number => {
    return parseInt(val?.toString().replace(/\D/g, "") || "0", 10) || 0;
};

export const formatCOP = (val: string | number | undefined | null): string => {
    const num = extractNumber(val);
    return num === 0 && !val ? "" : "$ " + num.toLocaleString("es-CO");
};
