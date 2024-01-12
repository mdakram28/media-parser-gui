import { DataNode } from "../types/parser.types";
import "./hex-editor.scss";
import { Fragment, MouseEvent, MouseEventHandler, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, colors } from '@mui/material';


const byteToHex: string[] = [];
const byteToBin: string[] = [];
const byteToAscii: string[] = [];

class Range {
    start: number
    end: number
    constructor(start: number, end: number) {
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

    subRange(start: number, end: number) {
        const newStart = Math.max(start, this.start);
        const newEnd = Math.max(newStart, Math.min(end, this.end));
        return new Range(newStart, newEnd);
    }

    first(count: number) {
        return this.subRange(this.start, this.start + count);
    }

    count() {
        return this.end - this.start;
    }

    bitToByte() {
        return new Range(
            Math.floor(this.start / 8), // Including
            Math.floor((this.end - 1) / 8) + 1 // Excluding
        );
    }
}


for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
    const bin = n.toString(2).padStart(8, "0");
    byteToBin.push(bin);
    byteToAscii.push(n >= 32 && n <= 127 ? String.fromCharCode(n) : '.');
}

const COLORS = [colors.purple[700], colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];

const NUM_COLS = 16;
const NUM_ROWS = 25;
const CELL_HEIGHT = 25;
const CELL_WIDTH = 25;
const EXTRA_RENDER_ROWS = 10;
const NUM_BYTES_IN_INSPECT = 4;

function ByteInspector({ range, buffer, bitColors }: { range: Range, buffer: Uint8Array, bitColors: string[] }) {

    const inspectBytes = range.first(NUM_BYTES_IN_INSPECT);
    const inspectValue = inspectBytes.map(1, i => buffer[i]).reduce((prev, val) => prev << 8 | val);

    return <Card variant="outlined" sx={{ padding: 1 }}>
        Selected: {range.start}:{range.end-1} <br />
        Showing (First {inspectBytes.count()} bytes) <br />
        Hex: {inspectValue.toString(16).padStart(inspectBytes.count() * 2, '0')}  <br />
        Decimal: {inspectValue}  <br />
        Binary: {
            inspectBytes.map(1, i => <span key={i} style={{ marginRight: CELL_WIDTH / 2 }}>{
                [...byteToBin[buffer[i]]].map(
                    (bit, j) => <span key={i * 8 + j} style={{ width: CELL_WIDTH / 2, backgroundColor: bitColors[i * 8 + j] }}>{bit}</span>
                )
            }</span>)
        }
    </Card>
}

export function HexEditor({ buffer, highlight, setHighlight, setBoxColor }: {
    buffer: Uint8Array,
    highlight: DataNode[],
    setHighlight: (h: DataNode[]) => void,
    boxColor: { [k: string]: string },
    setBoxColor: (c: { [k: string]: string }) => void
}) {

    const [byteColors, setByteColors] = useState<string[]>([]);
    const [bitColors, setBitColors] = useState<string[]>([]);
    const [selected, setSelected] = useState<Range>();
    const [offset, setOffset] = useState(0);
    const [dragStart, setDragStart] = useState<number>();
    const scrollViewRef = useRef<HTMLDivElement>(null);


    // Set byte colors and box colors and selection range on highlight change
    useEffect(() => {
        if (highlight.length == 0) {
            setByteColors([]);
            return;
        }
        const newByteColors: string[] = [];
        const newBoxColors: { [k: string]: string } = {};
        highlight.forEach((node, nodeIdx) => {
            const start = Math.floor(node.start / 8);
            const end = Math.ceil((node.start + node.size) / 8);
            const col = COLORS[highlight.length - nodeIdx - 1];
            newBoxColors[node.key] = col;
            // console.log(start, end, COLORS[nodeI]);
            for (let i = start; i < end; i++) {
                newByteColors[i] = col;
            }
        });
        const { start: selectStart, size: selectSize } = highlight[highlight.length - 1];
        setSelected(new Range(selectStart, selectStart + selectSize));
        setByteColors(newByteColors);
        setBoxColor(newBoxColors);
    }, [highlight]);

    // Drag listeners
    const hexBytesDragged = useCallback((ev: any) => {
        // if (dragStart === undefined || dragEnd === undefined) {
        //     setDragStart(undefined);
        //     setDragEnd(undefined);
        //     return;
        // }
        console.log(ev);
    }, []);

    // Set bit colors for first NUM_BYTES_IN_BITVIEW
    useEffect(() => {
        if (!selected) {
            setBitColors([]);
            return;
        }

        const bitStart = selected.start - selected.start % 8;
        const bitEnd = bitStart + NUM_BYTES_IN_INSPECT * 8; // Not including
        // if (highlight.length == 0 || selected >= buffer.length) {
        //     setBitColors([]);
        //     return;
        // }
        const newBitColors: string[] = [];
        highlight.forEach((node, nodeIdx) => {
            const col = COLORS[highlight.length - nodeIdx - 1];
            for (let i = bitStart; i < bitEnd; i++) {
                if (i >= node.start && i < (node.start + node.size)) {
                    newBitColors[i] = col;
                }
            }
        });
        setBitColors(newBitColors);

        // if (dragStart === undefined) {
        //     console.log(dragStart);
            scrollViewRef.current?.scrollTo({
                top: Math.floor(selected.start / (NUM_COLS * 8)) * CELL_HEIGHT,
                behavior: "smooth"
            });
        // }
        // getElementsByClassName("hex-byte")[selected].scrollIntoView({ behavior: "smooth", block: "center" });
    }, [selected, highlight]);

    const renderBytes = new Range(
        Math.max(offset - EXTRA_RENDER_ROWS * NUM_COLS, 0),
        Math.min(offset + (NUM_ROWS + EXTRA_RENDER_ROWS) * NUM_COLS, buffer.length)
    );

    return <div style={{ position: "relative", fontFamily: "monospace", height: "100%", minWidth: "min-content" }}>
        <div style={{ position: "absolute", zIndex: 10, bottom: 0, width: "100%" }}>
            {selected && <ByteInspector range={selected.bitToByte()} buffer={buffer} bitColors={bitColors}/>}
        </div>
        <div ref={scrollViewRef} style={{ height: "100%", overflowY: "auto" }}
            onScroll={(e: any) => {
                const { scrollTop } = e.target;
                setOffset(NUM_COLS * Math.floor(scrollTop / CELL_HEIGHT));
            }}
        >
            <div style={{ height: (buffer.length / NUM_COLS) * CELL_HEIGHT }}>
                <div style={{ position: "relative", top: CELL_HEIGHT * (renderBytes.start / NUM_COLS) }}>

                    <div style={{ display: "inline-block" }}>{
                        renderBytes.map(NUM_COLS,
                            i => <div key={i} className="hex-pos">{byteToHex[(i & 0xFF00) >> 8] + byteToHex[i & 0xFF]}</div>
                        )
                    }</div>
                    <div 
                        style={{ display: "inline-block", paddingLeft: 30 }} 
                        id="hex-bytes" 
                        onMouseDown={({target}: any) => {
                            if (!target.hasAttribute("data-pos")) return;
                            const pos = target.getAttribute("data-pos");
                            setDragStart(pos);
                        }}
                        onMouseUp={({target}: any) => {
                            if (!target.hasAttribute("data-pos")) return;
                            const pos = target.getAttribute("data-pos");
                            setDragStart(undefined);
                        }}
                        onMouseMove={({target}: any) => {
                            if (!target.hasAttribute("data-pos") || dragStart === undefined) return;
                            const pos = target.getAttribute("data-pos");
                            setSelected(new Range(dragStart, pos+1));
                        }}
                    >{
                        renderBytes.map(1,
                            (i) => <Fragment key={i}>
                                {i % NUM_COLS == 0 && <br />}
                                <span
                                    data-pos={i}
                                    // onClick={() => setSelected(i)}
                                    // onMouseDown={() => { setDragStart(i); setDragEnd(i); }}
                                    // onMouseEnter={() => {
                                    //     if (dragStart !== undefined) {
                                    //         setDragEnd(i);
                                    //         const h = {
                                    //             key: "selection",
                                    //             size: (i - dragStart + 1) * 8,
                                    //             start: dragStart * 8,
                                    //             title: "Selection"
                                    //         };
                                    //         setHighlight([h]);
                                    //     }
                                    // }}
                                    // onMouseLeave={() => { if (dragStart !== undefined) setDragEnd(undefined); }}
                                    className="hex-byte"
                                    style={{ backgroundColor: byteColors[i] }}>
                                    {byteToHex[buffer[i]]}
                                </span>
                            </Fragment>
                        )
                    }</div>
                    <div style={{ display: "inline-block", paddingLeft: 10 }} id="ascii-bytes">{
                        renderBytes.map(NUM_COLS, ((i) =>
                            <div key={i} style={{ height: CELL_HEIGHT }}>
                                {
                                    new Range(i, i + NUM_COLS).map(1, (j) =>
                                        <span key={j} style={{ backgroundColor: byteColors[j] }}>
                                            {byteToAscii[buffer[j]]}
                                        </span>
                                    )
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
}