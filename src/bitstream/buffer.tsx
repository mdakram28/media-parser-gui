import { BitRange, ByteRange } from "./range";
import { assert } from "./util";

function REV64(x: number) {
    x = ((x >> 1) & 0x55555555) | ((x & 0x55555555) << 1);
    x = ((x >> 2) & 0x33333333) | ((x & 0x33333333) << 2);
    x = ((x >> 4) & 0x0F0F0F0F) | ((x & 0x0F0F0F0F) << 4);
    x = ((x >> 8) & 0x00FF00FF) | ((x & 0x00FF00FF) << 8);
    x = (x >>> 16) | (x << 16);
    
    return x >>> 0;
}


function REV8(b: number) {
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
    return b;
}

// Less than 8 bits
const REV: number[] = [];

for (let i=0; i<=0xFF; i++) {
    REV[i] = parseInt([...i.toString(2)].reverse().join(""), 2);
}

function FloorLog2( x: number ) {
    let s = 0
    while ( x != 0 ) {
      x = x >> 1
      s++
    }
    return s - 1
}

export class BitBuffer {
    private buffer;
    private startBytePos: number;
    private endBytePos: number;

    // State
    private bytePos;
    private bitPos;

    
    constructor(data: Uint8Array, range: ByteRange = new ByteRange(0, data.byteLength)) {
        this.buffer = data;
        this.startBytePos = range.start;
        this.endBytePos = range.end;

        // Starting state
        this.bytePos = this.startBytePos;
        this.bitPos = 0;
    }

    setEscapeCode(escapeCode: Uint8Array) {
        this.checkEscapeCode = () => {
            const start = this.bytePos-(escapeCode.byteLength-1);
            if (this.bitPos == 0 && start >= this.startBytePos) {
                if (escapeCode.every((val, i) => this.buffer[start+i] == val)) {
                    this.bytePos++;
                }
            }
        }
    }

    slice(range: ByteRange) {
        return this.buffer.slice(range.start, range.end);
    }

    getByteLength() {
        return this.endBytePos - this.startBytePos;
    }

    getEndPos() {
        return this.endBytePos * 8;
    }

    checkEscapeCode() {}

    gotoPos(p: number) {
        const toByte = Math.floor(p / 8);
        assert(toByte >= this.startBytePos && toByte <= this.endBytePos);
        this.bytePos = toByte;
        this.bitPos = p % 8;
        this.checkEscapeCode();
    }

    getPos() {
        return this.bytePos * 8 + this.bitPos;
    }
    
    assertByteAlign() {
        if (this.bitPos != 0) {
            throw Error("Not byte aligned");
        }
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

    readSvlc() {
        const k = this.readUvlc();
        if (k%2 == 0) {
            return Math.ceil(k/2);
        } else {
            return -Math.ceil(k/2);
        }
    }

    
    readNullEndedString() {
        let str = "";
        while (true) {
            const byte = this.readByte();
            if (byte == 0) break;
            str += String.fromCharCode(byte);
        }
        return str;
    }

    readString(len: number) {
        let str = "";
        for(let i=0; i<len; i++) {
            const byte = this.readByte();
            str += String.fromCharCode(byte);
        }
        return str;
    }

    findNextBytes(needle: Uint8Array, endBitPos: number) {
        const endBytePos = Math.floor(endBitPos/8);
        for(let i=this.bytePos; i<endBytePos-needle.byteLength; i++) {
            let matched = true;
            for(let j=0; j<needle.byteLength; j++) {
                if (needle[j] != this.buffer[i+j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) return i*8;
        }
        return endBitPos;
    }


    readURanged(n: number) {
        const w = FloorLog2(n) + 1;
        const m = (1 << w) - n;
        const v = this.readBits(w-1);
        if ( v < m )	 
            return v	 
        const extra_bit = this.readBit();
        return (v << 1) - m + extra_bit	 ;
    }
    
    readByte() {
        this.checkEscapeCode();
        return this.buffer[this.bytePos++];
    }

    readBit() {
        this.checkEscapeCode();
        if (this.bitPos === 7) {
            const ret = this.buffer[this.bytePos++] & 1;
            this.bitPos = 0;
            return ret;
        } else {
            const ret = (this.buffer[this.bytePos] >> (8 - this.bitPos - 1)) & 1;
            this.bitPos++;
            return ret;
        }
    }

    readBits(bits: number) {
        let val = 0;
        for(let i=0; i<bits; i++) {
            val = val<<1 | this.readBit();
        }
        return val;
    }
}