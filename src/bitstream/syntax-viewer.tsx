import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useState } from "react";
import { DataBoxComponent } from "../components/syntax-box";
import { SyntaxTable } from "../components/syntax-table";



export function SyntaxViewer({ }: {}) {
    // const [treeType, setTreeType] = useState<"tree" | "box">("tree");

    return <>
        <SyntaxTable />
    </>
}