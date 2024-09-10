import { DataNode, DataNodeValue } from "../types/parser.types";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BitstreamExplorerContext, BitstreamSelectionContext } from "../bitstream/bitstream-explorer";
import { BitRange } from "../bitstream/range";
import { FormControlLabel, Switch } from "@mui/material";
import { useTraceUpdate } from "../react-util";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { forEachChild } from "../bitstream/util";

export type SyntaxTableSettings = {
    showHiddenSyntax: boolean,
    showSizeBar: boolean
}

function ValueFormat({ value }: { value: DataNodeValue }) {
    if (typeof value !== "object") {
        return <>{value}</>
    } else if (Array.isArray(value)) {
        return <div style={{ display: "inline-block" }}>
            {'{'}
            {value.map((val, i) => <>
                <ValueFormat value={val} />
                {i != value.length - 1 && ", "}
                {((i + 1) % 8 == 0 || typeof val === "object") && i != value.length - 1 && <>
                    <br />
                    &nbsp;
                </>}
            </>)}
            {'}'}
        </div>
    }
}

function DataTreeNode({ node, level = 0, maxNodeSize }: {
    maxNodeSize: number, node: DataNode, level?: number
}) {
    const [expanded, setExpanded] = useState(() => level == 0 ? true : false);
    const { setRanges } = useContext(BitstreamSelectionContext);
    const {settings, setSettings} = useContext(BitstreamExplorerContext);


    const select = useCallback(() => {
        if (node.size == 0) return;

        let syntaxArr = node.value as any[];

        if (!Array.isArray(syntaxArr)) {
            // Single value
            const newRange = new BitRange(node.start, node.start + node.size);
            setRanges([newRange]);
        } else {
            // Multiple values - only first will be available in byte inspector
            let subStart = node.start;
            let subSize = node.size / syntaxArr?.length;
            let ranges: BitRange[] = [];

            for (let i = 0; i < syntaxArr?.length; i++) {
                const newRange = new BitRange(subStart, subStart + subSize);
                ranges.push(newRange);
                subStart += subSize + node.skip;
            }
            setRanges(ranges);
        }
    }, [node, setRanges]);

    const toggleExpand = () => setExpanded(exp => !exp);
    const setFocus = (ev: any) => ev.target.focus();


    return <>
        <tr
            onFocus={select}
            onClick={setFocus}
            onDoubleClick={toggleExpand}
            tabIndex={0}
            onKeyDown={(ev: any) => {
                if (ev.key == "Enter" || ev.key == " ") {
                    setExpanded(exp => !exp);
                } else if (ev.key == "ArrowRight") {
                    setExpanded(true);
                } else if (ev.key == "ArrowLeft") {
                    setExpanded(false);
                } else if (ev.key == "ArrowDown") {
                    ev.target.nextSibling.focus();
                    ev.preventDefault();
                } else if (ev.key == "ArrowUp") {
                    ev.target.previousSibling.focus();
                    ev.preventDefault();
                }
            }}
        >
            <td>
                <div style={{ display: "flex" }}>
                    <span className="tab-space" style={{ width: 25 * level }}></span>
                    {node.children?.length
                        ? <div
                            onClick={toggleExpand}
                            className={(expanded ? "expanded " : "") + "expand-btn"}
                        >  <i className="fas fa-angle-right" />
                        </div>
                        : <div className="expand-space" />
                    }
                    {node.title} {
                        node.value !== undefined && <>
                            &nbsp;&nbsp; = &nbsp; <span className="value"><ValueFormat value={node.value} /></span>
                        </>
                    }
                </div>
                {
                    settings.showSizeBar &&
                    <span className="size-rect" style={{ width: 100 * (node.size / maxNodeSize) }}></span>
                }
            </td>
            <td>{node.start}</td>
            <td>{node.size}</td>
        </tr>
        {expanded && !!node.children?.length &&
            node.children
                .filter(child => settings.showHiddenSyntax || !child.hidden)
                .filter(child => !child.filtered)
                .map(childNode =>
                    <DataTreeNode maxNodeSize={maxNodeSize} key={childNode.key} node={childNode} level={level + 1} />
                )
        }
    </>
}

export function SyntaxTable({}: {}
) {
    const { syntax: root } = useContext(BitstreamExplorerContext);

    console.log("Syntax table rendered");

    const maxNodeSize = useMemo(() => {
        let maxSize = 8;
        root.children?.forEach(obu => {
            maxSize = Math.max(maxSize, obu.size);
        });
        return maxSize;
    }, [root]);

    return <div style={{ flex: "1 1 auto", height: 0, overflowY: "auto", width: "100%" }}>
        <table
            className="syntax-table"
            cellSpacing={0}
        >
            <thead>
                <tr>
                    <th></th>
                    <th>Start</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                <DataTreeNode node={root} maxNodeSize={maxNodeSize}></DataTreeNode>
            </tbody>
        </table></div>
}