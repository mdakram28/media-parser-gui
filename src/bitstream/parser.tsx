import { DataNode } from "../types/parser.types";
import { BitBuffer } from "./buffer";
import { ByteRange } from "./range";

export const MAX_ITER = 10000;

export function syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
    return (bs: Bitstream<any>, ...args: T) => bs.syntax(title, fn)(...args);
}

export class ParserCtx {
    SeenFrameHeader = 0;
}


export class Bitstream<T extends {} = ParserCtx> {
    private buffer: BitBuffer;
    private current: DataNode = {
        title: "ROOT",
        key: "root",
        varName: "root",
        children: [],
        start: 0,
        size: 0
    };
    readonly ctx: T;

    constructor(buffer: BitBuffer) {
        this.buffer = buffer;
        this.ctx = {} as T;
    }

    updateBuffer(buffer: BitBuffer) {
        this.buffer = buffer;
    }

    updateCtx(newCtx: Partial<T>) {
        Object.assign(this.ctx, newCtx);
    }

    getCurrent() {
        return this.current;
    }

    getEndPos() {
        return this.buffer.getEndPos();
    }

    slice(range: ByteRange) {
        return this.buffer.slice(range);
    }

    addSyntaxValue(varPath: string, title: string, value: number | string, startBitPos: number, hidden: boolean) {
        const names = varPath.split("[") as string[];
        if (names.length == 1) {
            this.ctx[names[0] as keyof T] = value as any;
            this.current.children?.push({
                varName: varPath,
                key: Math.floor(Math.random() * 1909000000).toString(),
                title,
                start: startBitPos,
                size: this.getPos() - startBitPos,
                skip: 0,
                value,
                hidden
            });
        } else {
            const varName = names[0] as keyof T;
            if (!Array.isArray(this.ctx[varName])) {
                (this.ctx[varName] as any[]) = [];
            }

            let syntaxDataNode = this.current.children?.find(child => child.title === varName);
            if (!syntaxDataNode) {
                syntaxDataNode = {
                    key: Math.floor(Math.random() * 1909000000).toString(),
                    varName: varName.toString(),
                    title: varName.toString(),
                    start: startBitPos,
                    size: this.getPos() - startBitPos,
                    skip: 0,
                    value: [],
                    hidden
                };
                this.current.children?.push(syntaxDataNode);
            } else {
                if (!syntaxDataNode.skip) {
                    syntaxDataNode.skip = startBitPos - (syntaxDataNode.start + syntaxDataNode.size);
                }
                syntaxDataNode.size += this.getPos() - startBitPos;
            }

            let arr = this.ctx[varName] as any[];
            let syntaxArr = syntaxDataNode.value as any[];

            for (let i = 1; i < names.length - 1; i++) {
                const index = parseInt(names[i] as string);
                if (!Array.isArray(arr[index])) {
                    arr[index] = [];
                }
                arr = arr[index];
                if (!Array.isArray(syntaxArr[index])) {
                    syntaxArr[index] = [];
                }
                syntaxArr = syntaxArr[index];
            }
            const index = parseInt(names[names.length - 1] as string);
            if (!Array.isArray(arr[index])) {
                arr[index] = [];
            }
            arr[index] = value;
            if (!Array.isArray(syntaxArr[index])) {
                syntaxArr[index] = [];
            }
            syntaxArr[index] = value;
        }
    }

    f(varPath: string, bits: number, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const startBitPos = this.getPos();
        const value = bits === 1 ? this.buffer.readBit() : this.buffer.readBits(bits);
        this.addSyntaxValue(
            varPath,
            `${varPath.toString()}(${bits})` + (e ? `: (${e[value]})` : ''),
            value,
            startBitPos,
            hidden
        );
        return value;
    }

    ns(varPath: string, n: number, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const startBitPos = this.getPos();
        const value = this.buffer.readURanged(n);
        this.addSyntaxValue(
            varPath,
            `${varPath.toString()}  ns(${n})` + (e ? `: (${e[value]})` : ''),
            value,
            startBitPos,
            hidden
        );
        return value;
    }

    su(varPath: string, n: number, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const startBitPos = this.getPos();
        let value = this.buffer.readBits(n);
        const signMask = 1 << (n - 1)
        if (value & signMask)
            value = value - 2 * signMask;

        this.addSyntaxValue(
            varPath,
            `${varPath.toString()}  su(${n})` + (e ? `: (${e[value]})` : ''),
            value,
            startBitPos,
            hidden
        );
        return value;
    }

    le(varPath: string, numBytes: number, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const startBitPos = this.getPos();
        let value = 0;
        for (let i=0; i<numBytes; i++) {
            value |= this.buffer.readByte() << (i*8);
        }

        this.addSyntaxValue(
            varPath,
            `${varPath.toString()}  le(${numBytes} bytes)` + (e ? `: (${e[value]})` : ''),
            value,
            startBitPos,
            hidden
        );
        return value;
    }

    uvlc(varPath: string, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const start = this.getPos();
        const value = this.buffer.readUvlc();
        this.addSyntaxValue(
            varPath,
            (typeof varPath === "string" && e) ? (`${varPath.toString()}` + (e ? `: (${e[value]})` : '')) : varPath,
            value,
            start,
            hidden
        );
        return value;
    }

    svlc(varPath: string, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const start = this.getPos();
        const value = this.buffer.readSvlc();
        this.addSyntaxValue(
            varPath,
            (typeof varPath === "string" && e) ? (`${varPath.toString()}` + (e ? `: (${e[value]})` : '')) : varPath,
            value,
            start,
            hidden
        );
        return value;
    }

    leb128(varPath: string, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        // console.log(`Reading leb128 ${title.toString()} from ${this.getPos()}`);
        const start = this.getPos();
        const value = this.buffer.readLeb128();
        this.addSyntaxValue(
            varPath,
            (typeof varPath === "string" && e) ? (`${varPath.toString()}` + (e ? `: (${e[value]})` : '')) : varPath,
            value,
            start,
            hidden
        );
        return value;
    }


    nullEndedString(varPath: string, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const start = this.getPos();
        const value = this.buffer.readNullEndedString();
        this.addSyntaxValue(
            varPath,
            (typeof varPath === "string" && e) ? (`${varPath.toString()}` + (e ? `: (${e[value]})` : '')) : varPath,
            value,
            start,
            hidden
        );
        return value;
    }


    fixedWidthString(varPath: string, len: number, { e, hidden = false }: { e?: any, hidden?: boolean } = {}) {
        const start = this.getPos();
        const value = this.buffer.readString(len);
        this.addSyntaxValue(
            varPath,
            (typeof varPath === "string" && e) ? (`${varPath.toString()}` + (e ? `: (${e[value]})` : '')) : varPath,
            value,
            start,
            hidden
        );
        return value;
    }
    error(msg: string) {
        this.current.children?.push({
            varName: "error",
            key: Math.floor(Math.random() * 1909000000).toString(),
            title: <>Error: {msg}</>,
            start: this.getPos(),
            size: 0
        });
    }

    setTitle(title: string) {
        this.current.title = title;
    }
    setVarName(varName: string) {
        this.current.varName = varName;
    }

    dropSyntax() {
        this.current.title += " (DROPPED)";
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
        if (this.buffer.getPos() % 8 != 0) {
            return this.f("byte_align", (8 - this.buffer.getPos() % 8) % 8, {hidden: true});
        }
    }

    syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
        return (...args: T) => {
            const parent = this.current;
            this.current = {
                key: title + Math.floor(Math.random() * 1909000000),
                varName: title,
                title,
                children: [],
                start: this.getPos(),
                size: 0
            }
            let ret = undefined;
            try {
                ret = fn(this as any, ...args);
            } catch(e: any) {
                // console.error(e);
                this.current.title = <>{this.current.title}&nbsp;<span className="error">{e.toString()}</span></>;
            } finally {
                this.current.size = this.getPos() - this.current.start;
                parent.children?.push(this.current);
                this.current = parent;
                return ret;
            }
        }
    }

}