export const inc = (x: number) => x + 1;
export const double = (x: number) => x * 2;

export const incUnit = <T>(unitFn: (x: number) => T) => (x: number) => unitFn(inc(x));
export const doubleUnit = <T>(unitFn: (x: number) => T) => (x: number) => unitFn(double(x));
