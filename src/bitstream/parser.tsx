import { DataNode } from "../types/parser.types";

export function syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
    return (bs: Bitstream<any>, ...args: T) => bs.syntax(title, fn)(...args);
}

export class Bitstream<T extends {}> {
    pos = 0;
    bitPos = 0;
    private buffer: ArrayBuffer;
    private current: DataNode = {
        title: "ROOT",
        key: "root",
        children: [],
        start: 0,
        size: 0
    };
    readonly ctx: T;

    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.ctx = {} as T;
    }

    updateCtx(newCtx: Partial<T>) {
        Object.assign(this.ctx, newCtx);
    }

    getCurrent() {
        return this.current;
    }

    getEndPos() {
        return this.buffer.byteLength * 8;
    }

    readByte() {
        const ret = new Uint8Array(this.buffer.slice(this.pos, this.pos + 1))[0];
        this.pos += 1;
        return ret;
    }

    readLeb128() {
        let value = 0;
        for (let i = 0; i < 8; i++) {
            const leb128_byte = this.readByte();
            value |= ((leb128_byte & 0x7f) << (i * 7));
            if (!(leb128_byte & 0x80)) {
                break
            }
        }
        return value
    }

    readUvlc() {
        let leadingZeros = 0
        while (true) {
            const done = this.readBits(1)
            if (done)
                break
            leadingZeros++
        }
        if (leadingZeros >= 32) {
            return (1 << 32) - 1
        }
        const value = this.readBits(leadingZeros)
        return value + (1 << leadingZeros) - 1
    }



    readBits(bits: number) {
        let i = this.pos * 8 + this.bitPos;
        const data = new Uint8Array(this.buffer.slice(this.pos, Math.ceil((i + bits) / 8)));
        let binStr = "";
        data.forEach(byte => binStr += byte.toString(2).padStart(8, '0'));
        binStr = binStr.slice(this.bitPos, this.bitPos + bits);
        i += bits;
        this.pos = Math.floor(i / 8);
        this.bitPos = this.pos % 8;
        return parseInt(binStr, 2);
    }

    setCtx(_title: keyof T | string, value: any) {
        const title = _title as string;
        if (title.endsWith("]")) {
            const ind = parseInt(title.substring(title.lastIndexOf('[') + 1, title.length - 1));
            const name = title.substring(0, title.lastIndexOf('['));
            if (this.ctx[name as keyof T] === undefined)
                (this.ctx[name as keyof T] as any[]) = [];
            (this.ctx[name as keyof T] as any[])[ind] = value as any;
        } else {
            this.ctx[title as keyof T] = value as any;
        }
    }

    f(title: keyof T | string, bits: number, e?: any) {
        let i = this.getPos();
        const startBitPos = i;
        // console.log(`Reading binary ${title.toString()} from ${i}`);
        const data = new Uint8Array(this.buffer.slice(Math.floor(i / 8), Math.ceil((i + bits) / 8)));
        let binStr = "";
        data.forEach(byte => binStr += byte.toString(2).padStart(8, '0'));
        const start = i - Math.floor(i / 8) * 8;
        i += bits;
        this.pos = Math.floor(i / 8);
        this.bitPos = i % 8;
        binStr = binStr.slice(start, start + bits)
        const value = parseInt(binStr, 2);
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}: ${value}` + (e ? ` (${e[value]})` : ''),
            start: startBitPos,
            size: bits
        });
        this.setCtx(title, value);
        return value;
    }

    uvlc(title: keyof T | string) {
        const start = this.getPos();
        const val = this.readUvlc();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 100000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos()-start
        });
        this.setCtx(title, val);
        return val;
    }

    error(msg: string) {
        this.current.children?.push({
            key: Math.floor(Math.random() * 100000).toString(),
            title: <>Error: {msg}</>,
            start: this.getPos(),
            size: 0
        });
    }

    setTitle(title: string) {
        this.current.title = title;
    }

    dropSyntax() {
        this.current.title += " (DROPPED)";
    }

    leb128(title: keyof T) {
        // console.log(`Reading leb128 ${title.toString()} from ${this.getPos()}`);
        const start = this.getPos();
        const val = this.readLeb128();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 100000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos()-start
        });
        this.setCtx(title, val);
        return val;
    }

    gotoPos(p: number) {
        this.pos = p;
        this.bitPos = 0;
    }

    getPos() {
        return this.pos * 8 + this.bitPos;
    }

    byte_alignment() {
        if (this.bitPos > 0) {
            this.bitPos = 0;
            this.pos++;
        }
    }


    syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
        return (...args: T) => {
            const parent = this.current;
            this.current = {
                key: title + Math.floor(Math.random() * 100000),
                title,
                children: [],
                start: this.getPos(),
                size: 0
            }
            const ret = fn(this as any, ...args);
            this.current.size = this.getPos()-this.current.start;
            parent.children?.push(this.current);
            this.current = parent;
            return ret;
        }
    }
}