import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useState } from "react";
import { DataTreeComponent } from "../components/syntax-tree";
import { DataBoxComponent } from "../components/syntax-box";



export function SyntaxViewer({ }: {}) {
    // const [treeType, setTreeType] = useState<"tree" | "box">("tree");

    return <>
        {/* <RadioGroup row onChange={ev => setTreeType(ev.target.value as any)} value={treeType}>
            <FormControlLabel control={<Radio />} label="Tree" value={"tree"} />
            <FormControlLabel control={<Radio />} label="Box" value={"box"} />
        </RadioGroup> */}
        <DataTreeComponent />

        {/* {treeType == "tree"
            ? <DataTreeComponent />
            : <DataTreeComponent />
        } */}
    </>
}