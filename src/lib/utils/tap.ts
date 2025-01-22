const tap = <T>(tapFn: (y: T) => void) => (x: T): T => {
    tapFn(x);
    return x;
}

export { tap }