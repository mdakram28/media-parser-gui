import { DataNode } from "../types/av1.types";
import "./av1-analyzer.scss";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Card, colors } from '@mui/material';


const byteToHex: string[] = [];
const hexToBin: {[k:string]: string} = {};

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

const COLORS = [colors.purple[700],colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];

export const HexEditor = (props: { buffer: ArrayBuffer, highlight: DataNode[] }) => {
    const { buffer, highlight } = props;

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
            const start = Math.floor(node.start/8);
            const end = Math.ceil((node.start+node.size)/8);
            const col = COLORS[highlight.length - nodeIdx - 1];
            // console.log(start, end, COLORS[nodeI]);
            for (let i=start; i<end; i++) {
                newByteColors[i] = col;
            }
        })
        setSelected(Math.floor(highlight[highlight.length-1].start/8));
        setByteColors(newByteColors);
    }, [highlight]);

    const numBytesInRow = 16;
    const hex = useMemo<string[]>(() => {
        const buff = new Uint8Array(buffer);
        const hexOctets = [];
        for (let i = 0; i < buff.length; i += 1)
            hexOctets.push(byteToHex[buff[i]]);
        return hexOctets;
    }, [buffer]);

    useEffect(() => {
        const bitStart = selected*8;
        const bitEnd = (selected+1)*8; // Not including
        if (highlight.length == 0 || selected >= hex.length) {
            setBitColors([]);
            return;
        }
        const newBitColors: string[] = [];
        highlight.forEach((node, nodeIdx) => {
            const col = COLORS[highlight.length - nodeIdx - 1];
            for(let i=bitStart; i<bitEnd; i++) {
                if (i >= node.start && i < (node.start + node.size)) {
                    newBitColors[i-bitStart] = col;
                }
            }
        });
        setBitColors(newBitColors);
        document.getElementById("hex-bytes")?.getElementsByClassName("hex-byte")[selected].scrollIntoView({behavior: "smooth", block: "center"});
    }, [selected, highlight]);


    return <div style={{ fontFamily: "monospace" }}>
        <Card variant="outlined" sx={{padding: 1}}>
            {
                selected < hex.length && <>
                    Position: {selected} <br/>
                    Decimal: {hex[selected]} <br/>
                    Binary: {[...hexToBin[hex[selected]]].map((bit,i) => <span style={{backgroundColor: bitColors[i]}}>{bit}</span>)}
                </>
            }
        </Card>
        <div style={{display: "inline-block"}}>{
            range(0, hex.length, numBytesInRow)
                .map(i => <Fragment key={i}>{byteToHex[(i & 0xFF00) >> 8] + byteToHex[i & 0xFF]}<br/></Fragment>)
        }</div>
        <div style={{display: "inline-block", paddingLeft: 30}} id="hex-bytes">{
            hex.map((byte, i) => {
                return <Fragment key={i}>
                    {i%numBytesInRow==0 && <br/>}
                    <span onClick={() => setSelected(i)} className="hex-byte" style={{backgroundColor: byteColors[i]}}>{byte}</span>
                </Fragment>
            })  
        }</div>
    </div>
}