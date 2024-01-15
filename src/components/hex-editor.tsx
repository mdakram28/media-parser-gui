import { DataNode } from "../types/parser.types";
import "./hex-editor.scss";
import { Fragment, MouseEvent, MouseEventHandler, UIEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Card, colors } from '@mui/material';
import { BitRange, ByteRange } from "../bitstream/range";
import { BitstreamExplorerContext, BitstreamSelectionContext } from "../bitstream/bitstream-explorer";


const byteToHex: string[] = [];
const byteToBin: string[] = [];
const byteToAscii: string[] = [];



for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
    const bin = n.toString(2).padStart(8, "0");
    byteToBin.push(bin);
    byteToAscii.push(n >= 32 && n <= 127 ? String.fromCharCode(n) : '.');
}


const NUM_COLS = 16;
const NUM_ROWS = 25;
const CELL_HEIGHT = 25;
const CELL_WIDTH = 25;
const EXTRA_RENDER_ROWS = 10;
const NUM_BYTES_IN_INSPECT = 4;

function ByteInspector({ range }: { range: ByteRange }) {

    const { buffer } = useContext(BitstreamExplorerContext);
    const { getBitColor } = useContext(BitstreamSelectionContext);

    const inspectBytes = range.first(NUM_BYTES_IN_INSPECT);
    const inspectValue = inspectBytes.map(1, i => buffer[i]).reduce((prev, val) => prev << 8 | val);

    return <Card variant="outlined" sx={{ padding: 1 }}>
        Selected: {range.start}:{range.end - 1} <br />
        Showing (First {inspectBytes.count()} bytes) <br />
        Hex: {inspectValue.toString(16).padStart(inspectBytes.count() * 2, '0')}  <br />
        Decimal: {inspectValue}  <br />
        Binary: {
            inspectBytes.map(1, i => <span key={i} style={{ marginRight: CELL_WIDTH / 2 }}>{
                [...byteToBin[buffer[i]]].map(
                    (bit, j) => <span key={i * 8 + j} style={{ width: CELL_WIDTH / 2, backgroundColor: getBitColor(i * 8 + j) }}>{bit}</span>
                )
            }</span>)
        }
    </Card>
}

export function HexEditor({ }: {}) {
    const { buffer } = useContext(BitstreamExplorerContext);
    const { ranges, setRanges, getByteColor } = useContext(BitstreamSelectionContext);
    const [offset, setOffset] = useState(0);
    const [dragStart, setDragStart] = useState<number>();
    const scrollViewRef = useRef<HTMLDivElement>(null);

    console.log("Hex editor rendered");

    useEffect(() => {
        if (!ranges[0] || dragStart || !scrollViewRef.current) return;
        const { scrollTop, clientHeight } = scrollViewRef.current;

        const top = Math.floor(ranges[0].start / (NUM_COLS * 8)) * CELL_HEIGHT;
        // Scroll only if not in view
        if (top < scrollTop || top > (scrollTop + clientHeight)) {
            scrollViewRef.current?.scrollTo({
                top,
                behavior: "smooth"
            });
        }
    }, [ranges, dragStart]);

    const renderBytes = useMemo(() => new ByteRange(
        Math.max(offset - EXTRA_RENDER_ROWS * NUM_COLS, 0),
        Math.min(offset + (NUM_ROWS + EXTRA_RENDER_ROWS) * NUM_COLS, buffer.length)
    ), [buffer, offset]);

    return <div className="hex-editor" style={{ position: "relative", fontFamily: "monospace", height: "100%", minWidth: "min-content", display: "flex", flexDirection: "column" }}>
        
        {/* <div style={{ position: "absolute", zIndex: 8, right: 0, height: "100%", width: 50, backgroundColor: "grey" }}>
            <div style={{border: "black", height}}></div>
        </div> */}
        <div className="infinite" ref={scrollViewRef} style={{ flex: "1 1 auto", height: 0, overflowY: "auto", paddingRight: 50 }}
            onScroll={(e: any) => {
                const { scrollTop } = e.target;
                setOffset(NUM_COLS * Math.floor(scrollTop / CELL_HEIGHT));
            }}
        >
            <div style={{ height: (buffer.length / NUM_COLS) * CELL_HEIGHT }}>
                <div className="infinite-render" style={{ position: "relative", top: CELL_HEIGHT * (renderBytes.start / NUM_COLS) }}>

                    <div className="hex-positions">{
                        renderBytes.map(NUM_COLS,
                            i => <div key={i}>{
                                byteToHex[(i & 0xFF0000) >> 16] + 
                                byteToHex[(i & 0xFF00) >> 8] + 
                                byteToHex[i & 0xFF]
                            }</div>
                        )
                    }</div>
                    <div className="hex-bytes"
                        onMouseDown={({ target }: any) => {
                            if (!target.hasAttribute("data-pos")) return;
                            const pos = parseInt(target.getAttribute("data-pos"));
                            setDragStart(pos);
                            const newRange = new BitRange(pos * 8, (pos + 1) * 8);
                            if (ranges.length == 1 && newRange.equals(ranges[0])) return;
                            setRanges([newRange]);
                        }}
                        onMouseUp={({ target }: any) => {
                            if (!target.hasAttribute("data-pos")) return;
                            const pos = parseInt(target.getAttribute("data-pos"));
                            setDragStart(undefined);
                        }}
                        onMouseMove={({ target }: any) => {
                            if (!target.hasAttribute("data-pos") || dragStart === undefined) return;
                            const pos = parseInt(target.getAttribute("data-pos"));
                            const start = Math.min(dragStart, pos) * 8;
                            const end = (Math.max(dragStart, pos) + 1) * 8;
                            const newRange = new BitRange(start, end);
                            if (ranges.length == 1 && newRange.equals(ranges[0])) return;
                            setRanges([newRange]);
                        }}
                    >{
                            renderBytes.map(NUM_COLS,
                                (i) => <div key={i}>
                                    {
                                        new ByteRange(i, i + NUM_COLS).map(1, (j) =>
                                            <span
                                                key={j}
                                                data-pos={j}
                                                style={{ backgroundColor: getByteColor(j) }}>
                                                {byteToHex[buffer[j]]}
                                            </span>)
                                    }
                                </div>
                            )
                        }</div>
                    <div className="hex-ascii">{
                        renderBytes.map(NUM_COLS, ((i) =>
                            <div key={i} style={{ height: CELL_HEIGHT }}>
                                {
                                    new ByteRange(i, i + NUM_COLS).map(1, (j) =>
                                        <span key={j} style={{ backgroundColor: getByteColor(j) }}>
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
        <div style={{  width: "100%", marginTop: 10 }}>
            {ranges[0] && <ByteInspector range={ranges[0].toByteRange()} />}
        </div>
    </div>
}