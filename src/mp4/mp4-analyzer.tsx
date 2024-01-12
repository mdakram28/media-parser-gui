import { useEffect, useMemo, useState } from "react";
import { HexEditor } from "../components/hex-editor";
import { Button, FormControlLabel, Grid, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import { DataNode } from "../types/parser.types";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styled from "@emotion/styled";
import { Bitstream } from "../bitstream/parser";
import { ISOBMFF } from "./mp4-bitstream";
import { DataTreeComponent } from "../components/syntax-tree";
import { DataBoxComponent } from "../components/syntax-box";
import { MSBBuffer } from "../bitstream/buffer";

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


export const Mp4AnalyzerComponent = (props: {}) => {

    const [buffer, setBuffer] = useState<Uint8Array>(new Uint8Array(0));
    const [highlighted, setHighlighted] = useState<DataNode[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [boxColor, setBoxColor] = useState<{ [k: string]: string }>({});
    const [treeType, setTreeType] = useState<"tree"|"box">("box");

    function readFileDataAsBase64(e: React.FormEvent<HTMLInputElement>) {
        // @ts-ignore
        const file = e.target.files[0];

        const reader = new FileReader();

        reader.onload = (event) => {
            const buff = new Uint8Array(event.target?.result as ArrayBuffer);
            if (buff.length === 0) return;
            setBuffer(buff);
        };

        reader.onerror = (err) => {
            console.error(err);
        };

        reader.readAsArrayBuffer(file);
    }

    const syntaxTree: DataNode = useMemo(() => {
        const EMPTY_TREE: DataNode = {
            key: "root",
            title: "Empty bitstream",
            start: 0,
            size: 0
        };
        if (buffer.byteLength == 0) return EMPTY_TREE;
        
        const bs = new Bitstream(new MSBBuffer(buffer));
        ISOBMFF(bs, bs.getEndPos());
        const ret = bs.getCurrent();
        console.log("Parsed : ", ret);
        return ret;
    }, [buffer]);

    useEffect(() => {
        const idSet = new Set(selected);
        let selection: DataNode[] = [];
        function dfs(at: DataNode, prev: DataNode[]) {
            if (idSet.has(at.key)) {
                selection.push(at);
            }
            prev.push(at);
            for (const child of (at.children || [])) {
                dfs(child, prev);
            }
            prev.pop();
        }
        dfs(syntaxTree, []);
        // selection = selection.slice(2);
        setHighlighted(selection);
    }, [selected]);

    return <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
        <div style={{flex: 1, height: "100%", display: "flex", flexDirection: "column"}} className="panel">
                        {
                            buffer.length == 0 &&
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                                <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
                                    Upload file
                                    <VisuallyHiddenInput type="file" onChange={e => readFileDataAsBase64(e)} />
                                </Button>
                            </div>
                        }
                        {
                            buffer.length > 0 && <>
                                <RadioGroup row onChange={ev => setTreeType(ev.target.value as any)} value={treeType}>
                                    <FormControlLabel control={<Radio />} label="Tree" value={"tree"}/>
                                    <FormControlLabel control={<Radio />} label="Box" value={"box"}/>
                                </RadioGroup>
                                
                                {treeType == "tree"
                                    ? <DataTreeComponent root={syntaxTree} onSelect={setSelected}/>
                                    : <DataBoxComponent root={syntaxTree} onSelect={setSelected} selected={selected} boxColor={boxColor} />
                                }
                            </>
                        }
        </div>
        <div style={{flex: 1, height: "100%"}} className="panel">
                        <HexEditor
                            buffer={buffer}
                            highlight={highlighted}
                            setHighlight={setHighlighted}
                            boxColor={boxColor}
                            setBoxColor={setBoxColor} />
        </div>
    </div>
}
