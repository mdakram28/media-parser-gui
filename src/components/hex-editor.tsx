import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BitRange, ByteRange } from "../bitstream/range";
import { BitstreamExplorerContext, BitstreamSelectionContext } from "../bitstream/bitstream-explorer";

const byteToHex: string[] = [];
const byteToBin: string[] = [];
const byteToAscii: string[] = [];

for (let n = 0; n <= 0xff; ++n) {
    byteToHex.push(n.toString(16).padStart(2, "0"));
    byteToBin.push(n.toString(2).padStart(8, "0"));
    byteToAscii.push(n >= 32 && n <= 127 ? String.fromCharCode(n) : ".");
}

const NUM_COLS = 16;
const NUM_ROWS = 25;
const CELL_HEIGHT = 25;
const CELL_WIDTH = 25;
const EXTRA_RENDER_ROWS = 10;
const NUM_BYTES_IN_INSPECT = 4;

function ByteInspector({ range }: { range: ByteRange }) {
    const { fileBuffer } = useContext(BitstreamExplorerContext);
    const { getBitColor } = useContext(BitstreamSelectionContext);

    const inspectBytes = range.first(NUM_BYTES_IN_INSPECT);
    const inspectValue = inspectBytes.map(1, (i) => fileBuffer[i]).reduce((prev, val) => prev << 8 | val);

    return (
        <div style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-2)",
            padding: 12,
        }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "var(--gray-a11)" }}>Selected</span>
                <span>{range.start} : {range.end - 1} ({inspectBytes.count()} bytes)</span>
                <span style={{ color: "var(--gray-a11)" }}>Hex</span>
                <span style={{ fontFamily: "var(--code-font-family)" }}>{inspectValue.toString(16).padStart(inspectBytes.count() * 2, "0")}</span>
                <span style={{ color: "var(--gray-a11)" }}>Decimal</span>
                <span style={{ fontFamily: "var(--code-font-family)" }}>{inspectValue}</span>
                <span style={{ color: "var(--gray-a11)" }}>Binary</span>
                <span style={{ fontFamily: "var(--code-font-family)" }}>
                    {inspectBytes.map(1, (i) => (
                        <span key={i} style={{ marginRight: CELL_WIDTH / 2 }}>
                            {[...byteToBin[fileBuffer[i]]].map((bit, j) => (
                                <span key={i * 8 + j} style={{ width: CELL_WIDTH / 2, backgroundColor: getBitColor(i * 8 + j) }}>
                                    {bit}
                                </span>
                            ))}
                        </span>
                    ))}
                </span>
            </div>
        </div>
    );
}

export function HexEditor() {
    const { fileBuffer } = useContext(BitstreamExplorerContext);
    const { ranges, setRanges, getByteColor } = useContext(BitstreamSelectionContext);
    const [offset, setOffset] = useState(0);
    const [dragStart, setDragStart] = useState<number>();
    const [cursor, setCursor] = useState(-1);
    const [anchor, setAnchor] = useState(-1);
    const scrollViewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ranges[0] || dragStart || !scrollViewRef.current) return;
        const { scrollTop, clientHeight } = scrollViewRef.current;
        const top = Math.floor(ranges[0].start / (NUM_COLS * 8)) * CELL_HEIGHT;
        if (top < scrollTop || top > scrollTop + clientHeight) {
            scrollViewRef.current.scrollTo({ top, behavior: "smooth" });
        }
    }, [ranges, dragStart]);

    const scrollToCursor = useCallback((pos: number) => {
        if (!scrollViewRef.current) return;
        const { scrollTop, clientHeight } = scrollViewRef.current;
        const top = Math.floor(pos / NUM_COLS) * CELL_HEIGHT;
        if (top < scrollTop) {
            scrollViewRef.current.scrollTo({ top, behavior: "smooth" });
        } else if (top + CELL_HEIGHT > scrollTop + clientHeight) {
            scrollViewRef.current.scrollTo({ top: top - clientHeight + CELL_HEIGHT, behavior: "smooth" });
        }
    }, []);

    const renderBytes = useMemo(() => new ByteRange(
        Math.max(offset - EXTRA_RENDER_ROWS * NUM_COLS, 0),
        Math.min(offset + (NUM_ROWS + EXTRA_RENDER_ROWS) * NUM_COLS, fileBuffer.length),
    ), [fileBuffer, offset]);

    const handleMouseDown = ({ target }: any) => {
        if (!target.hasAttribute("data-pos")) return;
        const pos = parseInt(target.getAttribute("data-pos"));
        setDragStart(pos);
        setCursor(pos);
        setAnchor(pos);
        const newRange = new BitRange(pos * 8, (pos + 1) * 8);
        if (ranges.length === 1 && newRange.equals(ranges[0])) return;
        setRanges([newRange]);
    };

    const handleMouseUp = ({ target }: any) => {
        if (!target.hasAttribute("data-pos")) return;
        setDragStart(undefined);
    };

    const handleMouseMove = ({ target }: any) => {
        if (!target.hasAttribute("data-pos") || dragStart === undefined) return;
        const pos = parseInt(target.getAttribute("data-pos"));
        setCursor(pos);
        const start = Math.min(dragStart, pos) * 8;
        const end = (Math.max(dragStart, pos) + 1) * 8;
        const newRange = new BitRange(start, end);
        if (ranges.length === 1 && newRange.equals(ranges[0])) return;
        setRanges([newRange]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const maxPos = fileBuffer.length - 1;
        if (maxPos < 0) return;

        let newCursor = cursor;
        switch (e.key) {
            case "ArrowLeft":
                newCursor = Math.max(0, cursor - 1);
                break;
            case "ArrowRight":
                newCursor = Math.min(maxPos, cursor + 1);
                break;
            case "ArrowUp":
                newCursor = Math.max(0, cursor - NUM_COLS);
                break;
            case "ArrowDown":
                newCursor = Math.min(maxPos, cursor + NUM_COLS);
                break;
            case "Home":
                newCursor = cursor - (cursor % NUM_COLS);
                break;
            case "End":
                newCursor = Math.min(maxPos, cursor - (cursor % NUM_COLS) + NUM_COLS - 1);
                break;
            default:
                return;
        }
        e.preventDefault();

        setCursor(newCursor);
        scrollToCursor(newCursor);

        if (e.shiftKey) {
            const start = Math.min(anchor, newCursor) * 8;
            const end = (Math.max(anchor, newCursor) + 1) * 8;
            setRanges([new BitRange(start, end)]);
        } else {
            setAnchor(newCursor);
            setRanges([new BitRange(newCursor * 8, (newCursor + 1) * 8)]);
        }
    };

    return (
        <div style={{ position: "relative", fontFamily: "var(--code-font-family)", height: "100%", minWidth: "min-content", display: "flex", flexDirection: "column", width: "100%" }}>
            <div
                style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 48 }}
                ref={scrollViewRef}
                onScroll={(e: any) => setOffset(NUM_COLS * Math.floor(e.target.scrollTop / CELL_HEIGHT))}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                <div style={{ height: (fileBuffer.length / NUM_COLS) * CELL_HEIGHT }}>
                    <div style={{ position: "relative", display: "flex", gap: 16, paddingRight: 20, top: CELL_HEIGHT * (renderBytes.start / NUM_COLS) }}>
                        {/* Byte offsets */}
                        <div style={{ color: "var(--gray-a11)", fontSize: 13 }}>
                            {renderBytes.map(NUM_COLS, (i) => (
                                <div key={i} style={{ lineHeight: CELL_HEIGHT + "px" }}>
                                    {byteToHex[(i & 0xFF0000) >> 16] + byteToHex[(i & 0xFF00) >> 8] + byteToHex[i & 0xFF]}
                                </div>
                            ))}
                        </div>
                        {/* Hex bytes */}
                        <div
                            style={{ userSelect: "none", cursor: "text" }}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                        >
                            {renderBytes.map(NUM_COLS, (i) => (
                                <div key={i} style={{ lineHeight: CELL_HEIGHT + "px" }}>
                                    {new ByteRange(i, i + NUM_COLS).map(1, (j) => (
                                        <span
                                            key={j}
                                            data-pos={j}
                                            style={{
                                                display: "inline-block",
                                                width: 25,
                                                textAlign: "center",
                                                borderRadius: 2,
                                                backgroundColor: getByteColor(j),
                                                outline: j === cursor ? "2px solid var(--accent-9)" : undefined,
                                                outlineOffset: -1,
                                            }}
                                        >
                                            {byteToHex[fileBuffer[j]]}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {/* ASCII */}
                        <div style={{ color: "var(--gray-a11)" }}>
                            {renderBytes.map(NUM_COLS, (i) => (
                                <div key={i} style={{ height: CELL_HEIGHT, lineHeight: CELL_HEIGHT + "px" }}>
                                    {new ByteRange(i, i + NUM_COLS).map(1, (j) => (
                                        <span key={j} style={{ display: "inline-block", width: 10, textAlign: "center", backgroundColor: getByteColor(j) }}>
                                            {byteToAscii[fileBuffer[j]]}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ width: "100%", marginTop: 10 }}>
                {ranges[0] && <ByteInspector range={ranges[0].toByteRange()} />}
            </div>
        </div>
    );
}
