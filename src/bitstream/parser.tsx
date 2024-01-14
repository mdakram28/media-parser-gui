import { DataNode } from "../types/parser.types";
import { MSBBuffer } from "./buffer";

export const MAX_ITER = 100;

export function syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
    return (bs: Bitstream<any>, ...args: T) => bs.syntax(title, fn)(...args);
}

export class ParserCtx {
    SeenFrameHeader = 0;
}


export class Bitstream<T extends {}> {
    private buffer: MSBBuffer;
    private current: DataNode = {
        title: "ROOT",
        key: "root",
        children: [],
        start: 0,
        size: 0
    };
    readonly ctx: T;

    constructor(buffer: MSBBuffer) {
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


    setCtx(_title: keyof T | string, value: any) {
        const title = _title as string;
        const names = title.split("[") as string[];
        if (names.length == 1) {
            this.ctx[names[0] as keyof T] = value as any;
        } else {
            if (!Array.isArray(this.ctx[names[0] as keyof T])) {
                (this.ctx[names[0] as keyof T] as any[]) = [];
            }
            let arr = this.ctx[names[0] as keyof T] as any[];
            for(let i=1; i<names.length-1; i++) {
                const index = parseInt(names[i] as string);
                if (!Array.isArray(arr[index])) {
                    arr[index] = [];
                }
                arr = arr[index];
            }
            const index = parseInt(names[names.length-1] as string);
            if (!Array.isArray(arr[index])) {
                arr[index] = [];
            }
            arr[index] = value;
        }
    }

    f(title: keyof T | string, bits: number, e?: any) {
        const startBitPos = this.getPos();
        const value = bits === 1 ? this.buffer.readBit() : this.buffer.readBits(bits);
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}(${bits}):    ${value}` + (e ? ` (${e[value]})` : ''),
            start: startBitPos,
            size: bits
        });
        this.setCtx(title, value);
        return value;
    }

    uvlc(title: keyof T | string, e?: any) {
        const start = this.getPos();
        const val = this.buffer.readUvlc();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}:    ${val}` + (e ? ` (${e[val]})` : ''),
            start,
            size: this.getPos() - start
        });
        this.setCtx(title, val);
        return val;
    }

    svlc(title: keyof T | string) {
        const start = this.getPos();
        const val = this.buffer.readSvlc();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}:    ${val}`,
            start,
            size: this.getPos() - start
        });
        this.setCtx(title, val);
        return val;
    }

    error(msg: string) {
        this.current.children?.push({
            key: Math.floor(Math.random() * 1909000000).toString(),
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
        const val = this.buffer.readLeb128();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos() - start
        });
        this.setCtx(title, val);
        return val;
    }


    nullEndedString(title: keyof T | string) {
        const start = this.getPos();
        const val = this.buffer.readNullEndedString();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos() - start
        });
        this.setCtx(title, val);
        return val;
    }


    fixedWidthString(title: keyof T | string, len: number) {
        const start = this.getPos();
        const val = this.buffer.readString(len);
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos() - start
        });
        this.setCtx(title, val);
        return val;
    }



    gotoPos(p: number) {
        this.buffer.gotoPos(p);
    }

    getPos() {
        return this.buffer.getPos();
    }

    assertByteAlign() {
        this.buffer.assertByteAlign();
    }

    findNextBytes(needle: Uint8Array, endBitPos: number = this.getEndPos()) {
        return this.buffer.findNextBytes(needle, endBitPos);
    }

    byteAlign() {
        if (this.buffer.getPos()%8 != 0) {
            return this.f("byte_align", (8 - this.buffer.getPos()%8) % 8);
        }
    }

    syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
        return (...args: T) => {
            const parent = this.current;
            this.current = {
                key: title + Math.floor(Math.random() * 1909000000),
                title,
                children: [],
                start: this.getPos(),
                size: 0
            }
            const ret = fn(this as any, ...args);
            this.current.size = this.getPos() - this.current.start;
            parent.children?.push(this.current);
            this.current = parent;
            return ret;
        }
    }

}