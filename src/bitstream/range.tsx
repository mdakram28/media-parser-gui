
abstract class AbstractRange {
    start: number
    end: number
    
    constructor(start: number, end: number) {
        console.assert(start <= end);
        this.start = start;
        this.end = end;
    }

    map<T>(step: number, cb: (val: number) => T): T[] {
        const ret = []
        for (let i = this.start; i < this.end; i += step) {
            ret.push(cb(i));
        }
        return ret;
    }

    count() {
        return this.end - this.start;
    }

    equals(range: AbstractRange) {
        return range.start == this.start && range.end == this.end;
    }
}


export class ByteRange extends AbstractRange {

    subRange(start: number, end: number) {
        const newStart = Math.max(start, this.start);
        const newEnd = Math.max(newStart, Math.min(end, this.end));
        return new ByteRange(newStart, newEnd);
    }
    
    intersect(range: ByteRange) {
        const newStart = Math.max(range.start, this.start);
        const newEnd = Math.max(newStart, Math.min(range.end, this.end));
        return new ByteRange(newStart, newEnd);
    }

    first(count: number) {
        return this.subRange(this.start, this.start + count);
    }

    toBitRange() {
        return new BitRange(
            this.start * 8, // Including
            this.end * 8 // Excluding
        );
    }

    inRange(pos: number) {
        return pos >= this.start && pos < this.end;
    }
}

export class BitRange extends AbstractRange {

    subRange(start: number, end: number) {
        const newStart = Math.max(start, this.start);
        const newEnd = Math.max(newStart, Math.min(end, this.end));
        return new BitRange(newStart, newEnd);
    }

    intersect(range: BitRange) {
        const newStart = Math.max(range.start, this.start);
        const newEnd = Math.max(newStart, Math.min(range.end, this.end));
        return new BitRange(newStart, newEnd);
    }

    first(count: number) {
        return this.subRange(this.start, this.start + count);
    }

    toByteRange() {
        return new ByteRange(
            Math.floor(this.start / 8), // Including
            Math.floor((this.end - 1) / 8) + 1 // Excluding
        );
    }
    
    inRange(pos: number) {
        return pos >= this.start && pos < this.end;
    }
}