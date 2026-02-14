import { DataNode, DataNodeValue } from "../types/parser.types";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { BitstreamExplorerContext, BitstreamSelectionContext } from "../bitstream/bitstream-explorer";
import { BitRange } from "../bitstream/range";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useVirtualizer } from "@tanstack/react-virtual";

export type SyntaxTableSettings = {
    showHiddenSyntax: boolean;
    showSizeBar: boolean;
};

type FlatRow = {
    node: DataNode;
    level: number;
};

const ROW_HEIGHT = 28;

const cellStyle: React.CSSProperties = {
    textAlign: "left",
    verticalAlign: "middle",
    paddingInline: 16,
    paddingBlock: 4,
    whiteSpace: "nowrap",
    fontSize: 13,
};

const headerStyle: React.CSSProperties = {
    textAlign: "left",
    paddingInline: 16,
    paddingBlock: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--gray-a11)",
    borderBottom: "1px solid var(--glass-border)",
    position: "sticky",
    top: 0,
    background: "var(--glass-bg-solid)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    zIndex: 10,
};

function ValueFormat({ value }: { value: DataNodeValue }) {
    if (typeof value !== "object") return <>{value}</>;
    if (!Array.isArray(value)) return null;

    return (
        <div style={{ display: "inline-block" }}>
            {"{"}
            {value.map((val, i) => (
                <span key={i}>
                    <ValueFormat value={val} />
                    {i !== value.length - 1 && ", "}
                    {((i + 1) % 8 === 0 || typeof val === "object") && i !== value.length - 1 && (
                        <><br />&nbsp;</>
                    )}
                </span>
            ))}
            {"}"}
        </div>
    );
}

export function SyntaxTable() {
    const { syntax: root, settings } = useContext(BitstreamExplorerContext);
    const { setRanges } = useContext(BitstreamSelectionContext);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

    // Auto-expand root children when root changes
    const rootKey = root.key;
    const [lastRootKey, setLastRootKey] = useState(rootKey);
    if (rootKey !== lastRootKey) {
        setLastRootKey(rootKey);
        setExpanded(new Set([root.key]));
    }

    const maxNodeSize = useMemo(() => {
        let maxSize = 8;
        root.children?.forEach((node) => {
            maxSize = Math.max(maxSize, node.size);
        });
        return maxSize;
    }, [root]);

    const flatRows = useMemo(() => {
        const rows: FlatRow[] = [];
        const walk = (node: DataNode, level: number) => {
            rows.push({ node, level });
            if (expanded.has(node.key)) {
                node.children
                    ?.filter((child) => settings.showHiddenSyntax || !child.hidden)
                    .filter((child) => !child.filtered)
                    .forEach((child) => walk(child, level + 1));
            }
        };
        walk(root, 0);
        return rows;
    }, [root, expanded, settings.showHiddenSyntax]);

    const virtualizer = useVirtualizer({
        count: flatRows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 20,
    });

    const toggleExpand = useCallback((key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const select = useCallback((node: DataNode) => {
        if (node.size === 0) return;
        const syntaxArr = node.value as any[];

        if (!Array.isArray(syntaxArr)) {
            setRanges([new BitRange(node.start, node.start + node.size)]);
        } else {
            let subStart = node.start;
            const subSize = node.size / syntaxArr.length;
            const ranges: BitRange[] = [];
            for (let i = 0; i < syntaxArr.length; i++) {
                ranges.push(new BitRange(subStart, subStart + subSize));
                subStart += subSize + (node.skip || 0);
            }
            setRanges(ranges);
        }
    }, [setRanges]);

    return (
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Syntax</th>
                        <th style={headerStyle}>Start (bit)</th>
                        <th style={headerStyle}>Size (bits)</th>
                    </tr>
                </thead>
            </table>
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const { node, level } = flatRows[virtualItem.index];
                    const hasChildren = !!(node.children?.length);

                    return (
                        <div
                            key={virtualItem.key}
                            tabIndex={0}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: ROW_HEIGHT,
                                transform: `translateY(${virtualItem.start}px)`,
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "background-color 0.1s",
                            }}
                            onFocus={() => select(node)}
                            onClick={(e: any) => e.currentTarget.focus()}
                            onDoubleClick={() => hasChildren && toggleExpand(node.key)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--gray-a3)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                            onFocusCapture={(e) => (e.currentTarget.style.backgroundColor = "var(--gray-a3)")}
                            onBlurCapture={(e) => (e.currentTarget.style.backgroundColor = "")}
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                    toggleExpand(node.key);
                                } else if (ev.key === "ArrowRight") {
                                    if (!expanded.has(node.key) && hasChildren) toggleExpand(node.key);
                                } else if (ev.key === "ArrowLeft") {
                                    if (expanded.has(node.key)) toggleExpand(node.key);
                                } else if (ev.key === "ArrowDown") {
                                    (ev.currentTarget.nextElementSibling as HTMLElement)?.focus();
                                    ev.preventDefault();
                                } else if (ev.key === "ArrowUp") {
                                    (ev.currentTarget.previousElementSibling as HTMLElement)?.focus();
                                    ev.preventDefault();
                                }
                            }}
                        >
                            <div style={{ ...cellStyle, flex: 1, position: "relative", overflow: "hidden", borderRight: "1px solid var(--glass-border)" }}>
                                <div style={{ display: "flex" }}>
                                    <span style={{ display: "inline-block", width: 25 * level }} />
                                    {hasChildren ? (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.key); }}
                                            style={{
                                                cursor: "pointer",
                                                display: "inline-block",
                                                marginRight: 10,
                                                lineHeight: 1,
                                                verticalAlign: "middle",
                                                color: "var(--gray-a11)",
                                                transition: "transform 0.15s",
                                                transform: expanded.has(node.key) ? "rotate(90deg)" : "rotate(0deg)",
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faAngleRight} />
                                        </div>
                                    ) : (
                                        <div style={{ display: "inline-block", width: 23 }} />
                                    )}
                                    {node.title}
                                    {node.value !== undefined && (
                                        <>
                                            &nbsp;&nbsp; = &nbsp;
                                            <span style={{ fontFamily: "var(--code-font-family)", overflow: "auto", maxWidth: 500, overflowWrap: "break-word", color: "var(--accent-11)" }}>
                                                <ValueFormat value={node.value} />
                                            </span>
                                        </>
                                    )}
                                </div>
                                {settings.showSizeBar && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            top: 0,
                                            height: "100%",
                                            background: "var(--accent-a3)",
                                            width: 100 * (node.size / maxNodeSize),
                                        }}
                                    />
                                )}
                            </div>
                            <div style={{ ...cellStyle, width: 100, minWidth: 100, borderRight: "1px solid var(--glass-border)" }}>{node.start}</div>
                            <div style={{ ...cellStyle, width: 100, minWidth: 100 }}>{node.size}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
