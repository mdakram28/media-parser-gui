import { DataNode } from "../types/parser.types";
import { LSBBuffer, MSBBuffer } from "./buffer";

export const MAX_ITER = 50;

export function syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
    return (bs: Bitstream<any>, ...args: T) => bs.syntax(title, fn)(...args);
}

export class ParserCtx {
    SeenFrameHeader = 0;
}


export class Bitstream<T extends {}> {
    private buffer: LSBBuffer | MSBBuffer;
    private current: DataNode = {
        title: "ROOT",
        key: "root",
        children: [],
        start: 0,
        size: 0
    };
    readonly ctx: T;

    constructor(buffer: LSBBuffer | MSBBuffer) {
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
        if (title.endsWith("]")) {
            const ind = parseInt(title.substring(title.lastIndexOf('[') + 1, title.length - 1));
            const name = title.substring(0, title.lastIndexOf('['));
            if (!Array.isArray(this.ctx[name as keyof T]))
                (this.ctx[name as keyof T] as any[]) = [];
            (this.ctx[name as keyof T] as any[])[ind] = value as any;
        } else {
            this.ctx[title as keyof T] = value as any;
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

    uvlc(title: keyof T | string) {
        const start = this.getPos();
        const val = this.buffer.readUvlc();
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