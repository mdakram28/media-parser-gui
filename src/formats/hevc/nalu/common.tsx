const t = [
    0xFFFFFFFF00000000,
    0x00000000FFFF0000,
    0x000000000000FF00,
    0x00000000000000F0,
    0x000000000000000C,
    0x0000000000000002
];

export function ceil_log2(x: number): number {

    let y = (((x & (x - 1)) == 0) ? 0 : 1);
    let j = 32;

    for (let i = 0; i < 6; i++) {
        const k = (((x & t[i]) == 0) ? 0 : j);
        y += k;
        x = x >> k;
        j = j >> 1;
    }

    return y;
}
