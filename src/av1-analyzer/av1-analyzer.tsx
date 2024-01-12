import { useEffect, useMemo, useState } from "react";
import { HexEditor } from "../components/hex-editor";
import { AV1 } from "./av1-bitstream";
import { Button, FormControlLabel, Grid, Radio, RadioGroup } from "@mui/material";
import { DataNode } from "../types/parser.types";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styled from "@emotion/styled";
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Bitstream } from "../bitstream/parser";
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


export const Av1AnalyzerComponent = (props: {}) => {

    const [buffer, setBuffer] = useState<Uint8Array>(new Uint8Array(0));
    const [highlighted, setHighlighted] = useState<DataNode[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [boxColor, setBoxColor] = useState<{ [k: string]: string }>({});
    const [treeType, setTreeType] = useState<"tree" | "box">("tree");

    function readFileDataAsBase64(e: React.FormEvent<HTMLInputElement>) {
        // @ts-ignore
        const file = e.target.files[0];

        const reader = new FileReader();

        reader.onload = (event) => {
            setBuffer(new Uint8Array(event.target?.result as ArrayBuffer));
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
        const bs = new Bitstream(new MSBBuffer(buffer));
        AV1(bs);
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
        console.log(selection);
        selection = selection.slice(2);
        setHighlighted(selection);
    }, [selected]);

    return <>
        <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
            <div style={{flex: 1, height: "100%"}}>
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
                                    <FormControlLabel control={<Radio />} label="Tree" value={"tree"} />
                                    <FormControlLabel control={<Radio />} label="Box" value={"box"} />
                                </RadioGroup>

                                {treeType == "tree"
                                    ? <DataTreeComponent root={syntaxTree} onSelect={setSelected} />
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
                    setBoxColor={setBoxColor}
                />
            </div>
        </div>
    </>
}
