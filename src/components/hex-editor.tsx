import { DataNode } from "../types/parser.types";
import "./hex-editor.scss";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Card, colors } from '@mui/material';


const byteToHex: string[] = [];
const hexToBin: { [k: string]: string } = {};

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
    const bin = n.toString(2).padStart(8, "0");
    hexToBin[hexOctet] = bin;
}

const range = (start: number, end: number, step: number = 1) => {
    const ret = [];
    for (let i = start; i < end; i += step) {
        ret.push(i);
    }
    return ret;
}

const COLORS = [colors.purple[700], colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];

export const HexEditor = ({ buffer, highlight, setHighlight, setBoxColor }: {
    buffer: Uint8Array,
    highlight: DataNode[],
    setHighlight: (h: DataNode[]) => void,
    boxColor: {[k: string]: string},
    setBoxColor: (c: {[k: string]: string}) => void
}) => {

    const [byteColors, setByteColors] = useState<string[]>([]);
    const [bitColors, setBitColors] = useState<string[]>([]);
    const [selected, setSelected] = useState<number>(0);

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

    const numBytesInRow = 16;
    const hex = useMemo<string[]>(() => {
        const hexOctets = [];
        for (let i = 0; i < buffer.length; i += 1)
            hexOctets.push(byteToHex[buffer[i]]);
        return hexOctets;
    }, [buffer]);

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
        if (highlight.length == 0 || selected >= hex.length) {
            setBitColors([]);
            return;
        }
        const newBitColors: string[] = [];
        const newBoxColors: {[k: string]: string} = {};
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
        document.getElementById("hex-bytes")?.getElementsByClassName("hex-byte")[selected].scrollIntoView({ behavior: "smooth", block: "center" });
    }, [selected, highlight]);

    const [dragStart, setDragStart] = useState<number>();
    const [dragEnd, setDragEnd] = useState<number>();

    return <div style={{ fontFamily: "monospace" }}>
        <Card variant="outlined" sx={{ padding: 1 }}>
            {
                selected < hex.length && <>
                    Drag: {dragStart}:{dragEnd}<br />
                    Position: {selected} <br />
                    Decimal: {hex[selected]} <br />
                    Binary: {[...hexToBin[hex[selected]]].map((bit, i) => <span key={i} style={{ backgroundColor: bitColors[i] }}>{bit}</span>)}
                </>
            }
        </Card>
        <div style={{ display: "inline-block" }}>{
            range(0, hex.length, numBytesInRow)
                .map(i => <Fragment key={i}>{byteToHex[(i & 0xFF00) >> 8] + byteToHex[i & 0xFF]}<br /></Fragment>)
        }</div>
        <div style={{ display: "inline-block", paddingLeft: 30 }} id="hex-bytes">{
            hex.map((byte, i) => {
                return <Fragment key={i}>
                    {i % numBytesInRow == 0 && <br />}
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
                        {byte}
                    </span>
                </Fragment>
            })
        }</div>
        <div style={{ display: "inline-block", paddingLeft: 10 }} id="hex-bytes">{
            hex.map((byte, i) => {
                return <Fragment key={i}>
                    {i % numBytesInRow == 0 && <br />}
                    <span style={{ backgroundColor: byteColors[i] }}>{String.fromCharCode(buffer[i])}</span>
                </Fragment>
            })
        }</div>
    </div>
}