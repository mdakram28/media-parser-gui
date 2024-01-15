import { Bitstream } from "bitstream/parser";

export function assert(val: any, msg: string = "Assertion failed") {
    if (!val) throw Error(msg);
}

export function assertNums(...vals: any[]) {
    for(let i in vals)
        assert(typeof vals[i] === "number", `vals[${i}] not a number, ${typeof vals[i]} found`);
}

export function tile_log2(blkSize: number, target: number) {
    let k;
    for (k = 0; (blkSize << k) < target; k++) {
    }
    return k;
}

export function Clip3(x: number, y: number, z: number) {
    if (z < x) {
        return x;
    } else if (z > y) {
        return y;
    } else {
        return z;
    }
}

export function get_relative_dist(bs: Bitstream<any>, a: number, b: number) {
    const c: any = bs.ctx;
    if (!c.enable_order_hint)
        return 0
    let diff = a - b
    const m = 1 << (c.OrderHintBits - 1)
    diff = (diff & (m - 1)) - (diff & m)
    return diff;
}
export function decode_subexp(bs: Bitstream<any>, numSyms: number) {
    const c: any = bs.ctx;
    let i = 0
    let mk = 0
    const k = 3
    while (1) {
        const b2 = i ? k + i - 1 : k
        const a = 1 << b2
        if (numSyms <= mk + 3 * a) {
            bs.ns("subexp_final_bits", numSyms - mk);
            return c.subexp_final_bits + mk
        } else {
            bs.f("subexp_more_bits", 1);
            if (c.subexp_more_bits) {
                i++
                mk += a
            } else {
                bs.f("subexp_bits", b2);
                return c.subexp_bits + mk;
            }
        }
    }
}

export function inverse_recenter(r: number, v: number) {
    if (v > 2 * r)
        return v
    else if (v & 1)
        return r - ((v + 1) >> 1)
    else
        return r + (v >> 1)
}

export function decode_unsigned_subexp_with_ref(bs: Bitstream<any>, mx: number, r: number) {

    const v = decode_subexp(bs, mx);
    if ((r << 1) <= mx) {
        return inverse_recenter(r, v)
    } else {
        return mx - 1 - inverse_recenter(mx - 1 - r, v)
    }
}

export function decode_signed_subexp_with_ref(bs: Bitstream<any>, low: number, high: number, r: number) {
    const x = decode_unsigned_subexp_with_ref(bs, high - low, r - low);
    return x + low
}