import { useEffect, useMemo, useState } from "react";
import { HexEditor } from "./hex-editor";
import { AV1, Bitstream } from "./av1-bitstream";
import { Button, Grid } from "@mui/material";
import { DataNode } from "../types/av1.types";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styled from "@emotion/styled";
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});


function DataTreeComponent({ node }: { node: DataNode }) {
    return <>
        <TreeItem nodeId={node.key} label={<>
            {node.title}
            <span className="node-right">
                <span>{Math.floor(node.start/8)}</span>
                <span>{Math.ceil((node.start+node.size)/8-1)}</span>
            </span>
        </>}>
            {(node.children || [])
                .map(childNode => <DataTreeComponent key={childNode.key} node={childNode}/>)
            }
        </TreeItem>
    </>
}


export const Av1AnalyzerComponent = (props: {}) => {

    const [buffer, setBuffer] = useState<ArrayBuffer>(new ArrayBuffer(0));
    const [selected, setSelected] = useState<DataNode[]>([]);

    function readFileDataAsBase64(e: React.FormEvent<HTMLInputElement>) {
        // @ts-ignore
        const file = e.target.files[0];

        const reader = new FileReader();

        reader.onload = (event) => {
            setBuffer(event.target?.result as ArrayBuffer);
        };

        reader.onerror = (err) => {
            console.error(err);
        };

        reader.readAsArrayBuffer(file);
    }

    const syntaxTree: DataNode = useMemo(() => {
        if (buffer.byteLength == 0) return {
            key: "root",
            title: "Empty bitstream",
            start: 0,
            size: 0
        };
        const bs = new Bitstream(buffer);
        AV1(bs);
        const ret = bs.getCurrent();
        console.log("Parsed : ", ret);
        return ret;
    }, [buffer]);

    const onSelect = (ids: string[]) => {
        const idSet = new Set(ids);
        let selection: DataNode[] = [];
        function dfs(at: DataNode, prev: DataNode[]) {
            if (idSet.has(at.key)) {
                selection.push(...prev, at);
            }
            prev.push(at);
            for (const child of (at.children || [])) {
                dfs(child, prev);
            }
            prev.pop();
        }
        dfs(syntaxTree, []);
        console.log(selection);
        selection = selection.slice(2);
        setSelected(selection);
    }

    return <>
        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
            Upload file
            <VisuallyHiddenInput type="file" onChange={e => readFileDataAsBase64(e)} />
        </Button>
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <TreeView
                    aria-label="file system navigator"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    disableSelection
                    // onNodeSelect={(event, nodeIds) => onSelect([nodeIds])}
                    onNodeFocus={(event, nodeIds) => onSelect([nodeIds])}
                    sx={{height: "70vh", overflow: "scroll"}}
                >
                    <DataTreeComponent node={syntaxTree}/>
                </TreeView>
            </Grid>
            <Grid item xs={6}>
                <div style={{height: "70vh", overflow: "scroll"}}>
                    <HexEditor buffer={buffer} highlight={selected}></HexEditor>
                </div>
            </Grid>
        </Grid>

    </>
}
