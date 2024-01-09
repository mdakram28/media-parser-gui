
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

abstract class BitBuffer {
    public byteLength;
    
    
    protected bytePos = 0;
    protected bitPos = 0;
    protected buffer;
    
    
    constructor(data: Uint8Array) {
        this.buffer = data;
        this.byteLength = data.byteLength;
    }

    gotoPos(p: number) {
        this.bytePos = Math.floor(p / 8);
        this.bitPos = p % 8;
    }

    getPos() {
        return this.bytePos * 8 + this.bitPos;
    }
    
    assertByteAlign() {
        if (this.bitPos != 0) {
            throw Error("Not byte aligned");
        }
    }
    
    abstract readByte(): number;
    abstract readBit(): number;
    abstract readBits(bits: number): number;

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

}


// Reads MSB from byte first
export class MSBBuffer extends BitBuffer {
    
    readByte() {
        return this.buffer[this.bytePos++];
    }

    readBit() {
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
        const endBitPos = this.getPos() + bits;
        const endBytePos = Math.floor(endBitPos / 8);
        let ret = 0;

        if (endBytePos === this.bytePos) {
            // Does not cross byte
            ret = (this.buffer[this.bytePos] >> (8 - this.bitPos - bits)) & ((1 << bits) - 1);
            this.bitPos += bits;
        } else {
            // crosses byte

            // Step 1: Align to byte
            if (this.bitPos > 0) {
                const bitsToRead = 8 - this.bitPos;
                ret = this.buffer[this.bytePos] & ((1 << bitsToRead) - 1);
                this.bitPos = 0;
                this.bytePos++;
            }

            // Step 2: Fast Read full bytes
            while ((this.bytePos + 1) * 8 <= endBitPos) {
                ret = ret << 8 | this.buffer[this.bytePos++];
            }

            // Step 3: Read tail
            const bitsToRead = endBitPos - this.getPos();
            ret = ret << bitsToRead | (this.buffer[this.bytePos] >> (8 - bitsToRead));
            this.bitPos += bitsToRead;
        }
        return ret;
    }

}

// Reads LSB from byte first
export class LSBBuffer extends BitBuffer {
    
    readByte() {
        return REV8(this.buffer[this.bytePos++]);
    }

    readBit() {
        const ret = (this.buffer[this.bytePos] >> this.bitPos) & 1;
        this.bitPos++;
        if (this.bitPos === 8) {
            this.bitPos = 0;
            this.bytePos++;
        }
        return ret;
    }

    readBits(bits: number) {
        const endBitPos = this.getPos() + bits;
        const endBytePos = Math.floor(endBitPos / 8);
        let ret = 0;

        if (endBytePos === this.bytePos) {
            // Does not cross byte
            ret = (this.buffer[this.bytePos] >> this.bitPos) & ((1 << bits) - 1);
            this.bitPos += bits;
            ret = REV[ret];
        } else {
            // crosses byte

            // Step 1: Align to byte
            if (this.bitPos > 0) {
                ret = this.buffer[this.bytePos] >> this.bitPos;
                this.bitPos = 0;
                this.bytePos++;
                ret = REV[ret];
            }

            // Step 2: Fast Read full bytes
            while ((this.bytePos + 1) * 8 <= endBitPos) {
                ret = ret << 8 | this.readByte();
            }

            // Step 3: Read tail
            const bitsToRead = endBitPos - this.getPos();
            ret = ret << bitsToRead | REV[this.buffer[this.bytePos] & ((1<<bitsToRead)-1)];
            this.bitPos += bitsToRead;
        }
        
        return ret;
    }
}