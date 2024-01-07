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
        if (buffer.byteLength == 0) return {
            key: "root",
            title: "Empty bitstream",
            start: 0,
            size: 0
        };
        const bs = new Bitstream(buffer);
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
                selection.push(...prev, at);
            }
            prev.push(at);
            for (const child of (at.children || [])) {
                dfs(child, prev);
            }
            prev.pop();
        }
        dfs(syntaxTree, []);
        selection = selection.slice(2);
        setHighlighted(selection);
    }, [selected]);

    return <>
        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
            Upload file
            <VisuallyHiddenInput type="file" onChange={e => readFileDataAsBase64(e)} />
        </Button>
        {
            syntaxTree.children && syntaxTree.children[0].children &&
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <RadioGroup row onChange={ev => setTreeType(ev.target.value as any)} value={treeType}>
                        <FormControlLabel control={<Radio />} label="Tree" value={"tree"}/>
                        <FormControlLabel control={<Radio />} label="Box" value={"box"}/>
                    </RadioGroup>
                    
                    {treeType == "tree"
                        ? <DataTreeComponent root={syntaxTree} onSelect={setSelected}/>
                        : <DataBoxComponent root={syntaxTree} onSelect={setSelected} selected={selected} boxColor={boxColor} />
                    }
                </Grid>
                <Grid item xs={6}>
                    <div style={{ height: "70vh", overflow: "scroll" }}>
                        <HexEditor
                            buffer={buffer}
                            highlight={highlighted}
                            setHighlight={setHighlighted}
                            boxColor={boxColor}
                            setBoxColor={setBoxColor} />
                    </div>
                </Grid>
            </Grid>
        }

    </>
}
