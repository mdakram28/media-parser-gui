import { DataNode } from "../types/parser.types";
import "./hex-editor.scss";
import { Fragment, UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { Card, colors } from '@mui/material';


const byteToHex: string[] = [];
const byteToBin: string[] = [];
const byteToAscii: string[] = [];

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
    const bin = n.toString(2).padStart(8, "0");
    byteToBin.push(bin);
    byteToAscii.push(n>=32 && n<= 127 ? String.fromCharCode(n) : '.');
}

const range = (start: number, end: number, step: number = 1) => {
    const ret = [];
    for (let i = start; i < end; i += step) {
        ret.push(i);
    }
    return ret;
}

function mapRange<T>(start: number, end: number, step: number = 1, cb: (val: number) => T): T[] {
    const ret = []
    for (let i = start; i < end; i += step) {
        ret.push(cb(i));
    }
    return ret;
}

const COLORS = [colors.purple[700], colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];

const NUM_COLS = 16;
const NUM_ROWS = 30;
const CELL_HEIGHT = 25;
const CELL_WIDTH = 25;

const EXTRA_RENDER_ROWS = 10;

export const HexEditor = ({ buffer, highlight, setHighlight, setBoxColor }: {
    buffer: Uint8Array,
    highlight: DataNode[],
    setHighlight: (h: DataNode[]) => void,
    boxColor: { [k: string]: string },
    setBoxColor: (c: { [k: string]: string }) => void
}) => {

    const [byteColors, setByteColors] = useState<string[]>([]);
    const [bitColors, setBitColors] = useState<string[]>([]);
    const [selected, setSelected] = useState<number>(0);
    const [offset, setOffset] = useState(0);
    const [dragStart, setDragStart] = useState<number>();
    const [dragEnd, setDragEnd] = useState<number>();
    const scrollViewRef = useRef<HTMLDivElement>(null);

    // const bufferSlice = useMemo(() => buffer.slice(offset, offset + NUM_COLS * NUM_ROWS), [buffer, offset]);

    useEffect(() => {
        if (highlight.length == 0) {
            setByteColors([]);
            return;
        }
        const newByteColors: string[] = [];
        highlight.forEach((node, nodeIdx) => {
            const start = Math.floor(node.start / 8);
            const end = Math.ceil((node.start + node.size) / 8);
            const col = COLORS[highlight.length - nodeIdx - 1];
            // console.log(start, end, COLORS[nodeI]);
            for (let i = start; i < end; i++) {
                newByteColors[i] = col;
            }
        })
        setSelected(Math.floor(highlight[highlight.length - 1].start / 8));
        setByteColors(newByteColors);
    }, [highlight]);


    useEffect(() => {
        const listener = () => {
            if (dragStart === undefined || dragEnd === undefined) {
                setDragStart(undefined);
                setDragEnd(undefined);
                return;
            }
        };
        document.addEventListener("mouseup", listener);
        return () => document.removeEventListener("mouseup", listener);
    }, []);

    useEffect(() => {
        const bitStart = selected * 8;
        const bitEnd = (selected + 1) * 8; // Not including
        if (highlight.length == 0 || selected >= buffer.length) {
            setBitColors([]);
            return;
        }
        const newBitColors: string[] = [];
        const newBoxColors: { [k: string]: string } = {};
        highlight.forEach((node, nodeIdx) => {
            const col = COLORS[highlight.length - nodeIdx - 1];
            newBoxColors[node.key] = col;
            for (let i = bitStart; i < bitEnd; i++) {
                if (i >= node.start && i < (node.start + node.size)) {
                    newBitColors[i - bitStart] = col;
                }
            }
        });
        setBitColors(newBitColors);
        setBoxColor(newBoxColors);
        scrollViewRef.current?.scrollTo({
            top: Math.floor(selected / NUM_COLS) * CELL_HEIGHT,
            behavior: "smooth"
        });
        // getElementsByClassName("hex-byte")[selected].scrollIntoView({ behavior: "smooth", block: "center" });
    }, [selected, highlight]);

    const renderFrom = Math.max(offset - EXTRA_RENDER_ROWS * NUM_COLS, 0);
    const renderTo = Math.min(offset + (NUM_ROWS + EXTRA_RENDER_ROWS) * NUM_COLS, buffer.length)


    return <div style={{ fontFamily: "monospace" }}>
        <Card variant="outlined" sx={{ padding: 1 }}>
            {
                selected < buffer.length && <>
                    Drag: {dragStart}:{dragEnd}<br />
                    Position: {selected} <br />
                    Decimal: {buffer[selected]} <br />
                    Binary: {[...byteToBin[buffer[selected]]].map((bit, i) => <span key={i} style={{ backgroundColor: bitColors[i] }}>{bit}</span>)}
                </>
            }
        </Card>
        <div ref={scrollViewRef} style={{ height: "800px", overflow: "scroll" }}
            onScroll={(e: any) => {
                const { scrollTop } = e.target;
                setOffset(NUM_COLS * Math.floor(scrollTop / CELL_HEIGHT));
            }}
        >
            <div style={{ height: (buffer.length / NUM_COLS) * CELL_HEIGHT }}>
                <div style={{ position: "relative", top: CELL_HEIGHT * (renderFrom / NUM_COLS) }}>

                    <div style={{ display: "inline-block" }}>{
                        mapRange(renderFrom, renderTo, NUM_COLS,
                            i => <div key={i} className="hex-pos">{byteToHex[(i & 0xFF00) >> 8] + byteToHex[i & 0xFF]}</div>
                        )
                    }</div>
                    <div style={{ display: "inline-block", paddingLeft: 30 }} id="hex-bytes">{
                        mapRange(renderFrom, renderTo, 1,
                            (i) => <Fragment key={i}>
                                {i % NUM_COLS == 0 && <br />}
                                <span
                                    onClick={() => setSelected(i)}
                                    onMouseDown={() => { setDragStart(i); setDragEnd(i); }}
                                    onMouseEnter={() => {
                                        if (dragStart !== undefined) {
                                            setDragEnd(i);
                                            const h = {
                                                key: "selection",
                                                size: (i - dragStart + 1) * 8,
                                                start: dragStart * 8,
                                                title: "Selection"
                                            };
                                            setHighlight([h]);
                                        }
                                    }}
                                    onMouseLeave={() => { if (dragStart !== undefined) setDragEnd(undefined); }}
                                    className="hex-byte"
                                    style={{ backgroundColor: byteColors[i] }}>
                                    {byteToHex[buffer[i]]}
                                </span>
                            </Fragment>
                        )
                    }</div>
                    <div style={{ display: "inline-block", paddingLeft: 10 }} id="ascii-bytes">{
                        mapRange(renderFrom, renderTo, 1, ((i) => 
                            <Fragment key={i}>
                                {i % NUM_COLS == 0 && <br />}
                                <span style={{ backgroundColor: byteColors[i] }}>{byteToAscii[buffer[i]]}</span>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
}