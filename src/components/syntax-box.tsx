import "./hex-editor.scss";
import { DataNode } from "../types/parser.types";
import { useEffect, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function DataBoxNodeComponent({ node, onSelect, selected, boxColor }: {
    node: DataNode,
    selected: string[],
    onSelect: (nodeId: string[]) => void,
    boxColor: { [key: string]: string }
}) {
    const isSelected = selected[0] == node.key;
    const [collapsed, setCollapsed] = useState(true);

    return <>
        <div className={`data-box ${isSelected && "selected"}`} onClick={(ev) => {
            onSelect([node.key]);
            ev.stopPropagation();
        }} style={{
            backgroundColor: boxColor[node.key]
        }}>
            <span className="data-box-header" onClick={() => setCollapsed(!collapsed)}>
                {collapsed
                    ? <ChevronRightIcon />
                    : <ExpandMoreIcon />
                }<b>{node.title}</b><br />
            </span>
            {/* <span className="node-right">
                <span>{Math.floor(node.start / 8)}</span>
                <span>{Math.ceil((node.start + node.size) / 8 - 1)}</span>
            </span> */}
            {
                collapsed ||
                (node.children || [])
                    .map(childNode => childNode.children
                        ? <DataBoxNodeComponent key={childNode.key} node={childNode} selected={selected} onSelect={onSelect} boxColor={boxColor} />
                        : <>{childNode.title}<br /></>)
            }
        </div>
    </>
}

export function DataBoxComponent({ onSelect, selected, root, boxColor }: {
    root: DataNode,
    selected: string[],
    onSelect: (ids: string[]) => void,
    boxColor: { [k: string]: string }
}) {
    const [expanded, setExpanded] = useState<string[]>([]);

    useEffect(() => {
        const allKeys: string[] = [];
        function dfs(at: DataNode, d: number, maxd: number) {
            if (d > maxd) return;
            allKeys.push(at.key);
            for (const child of (at.children || [])) {
                dfs(child, d + 1, maxd);
            }
        }
        dfs(root, 0, 7);
        setExpanded(allKeys);
    }, [root])

    if (!root.children) {
        return <>No data</>
    }
    return <div style={{ height: "70vh", overflow: "scroll", width: "100%" }}>
        <DataBoxNodeComponent node={root.children[0]} selected={selected} onSelect={onSelect} boxColor={boxColor} />
    </div>
}