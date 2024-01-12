import { ReactNode, createContext, useCallback, useMemo, useState } from "react";
import { DataNode } from "../types/parser.types";
import { BitstreamUploader } from "./uploader";
import { BitRange } from "./range";
import { colors } from "@mui/material";

type State<N extends string, T> = {
    [key in N]: T
} & {
        [key in `set${Capitalize<N>}`]: React.Dispatch<React.SetStateAction<T>>
    }


export const EMPTY_TREE: DataNode = {
    key: "root",
    title: "Empty bitstream",
    start: 0,
    size: 0
};

export const BitstreamExplorerContext = createContext<
    State<"ranges", BitRange[]>
    & State<"buffer", Uint8Array>
    & State<"syntax", DataNode>
    & {
        readFileUploadData: (file: File) => void,
        syntaxById: {[nodeId: string]: DataNode},
        getBitColor: (pos: number) => string | undefined,
        getByteColor: (pos: number) => string | undefined,
    }
>({
    ranges: [],
    setRanges: () => { },
    buffer: new Uint8Array,
    setBuffer: () => { },
    readFileUploadData: () => { },
    syntax: EMPTY_TREE,
    setSyntax: () => { },
    syntaxById: {},
    getBitColor: () => undefined,
    getByteColor: () => undefined,
});

function forEachPreOrder(node: DataNode, cb: (node: DataNode) => void) {
    cb(node);
    for(const child of (node.children || [])) {
        forEachPreOrder(child, cb);
    }
}

const COLORS = [colors.purple[700], colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];

let watchCount: {[k: string]: number} = {};
function watch<T extends Function>(name: string, cb: T) {
    watchCount[name] = 0;
    return ((...args: any) => {
        watchCount[name]++;
        console.log(`Watch: ${name} callled ${watchCount[name]} times.`, args);
        console.trace();
        return cb(...args);
    }) as any as T;
}

export function BitstreamExplorer({ children, parser, uploader = <BitstreamUploader /> }: {
    children: ReactNode,
    parser: (buffer: Uint8Array) => DataNode,
    uploader?: ReactNode
}) {
    const [ranges, setRanges] = useState<BitRange[]>([]);
    const [syntax, setSyntax] = useState<DataNode>(EMPTY_TREE);
    const [buffer, setBuffer] = useState<Uint8Array>(() => new Uint8Array());
    const syntaxById = useMemo(() => {
        const ret: {[nodeId: string]: DataNode} = {};
        forEachPreOrder(syntax, (node) => {
            ret[node.key] = node;
        });
        return ret;
    }, [syntax]);

    const getBitColor = useCallback((bitPos: number) => {
        for(let i=0; i<ranges.length; i++) {
            if (ranges[i].inRange(bitPos)) {
                return COLORS[i];
            }
        }
        return undefined;
    }, [ranges]);

    const getByteColor = useCallback((bytePos: number) => {
        const bitRange = new BitRange(bytePos*8, (bytePos+1)*8);
        for(let i=0; i<ranges.length; i++) {
            if (ranges[i].intersect(bitRange).count() > 0) {
                return COLORS[i];
            }
        }
        return undefined;
    }, [ranges]);

    const readFileUploadData = useCallback((file: File) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const buff = new Uint8Array(event.target?.result as ArrayBuffer);
            if (buff.length === 0) return;
            setBuffer(buff);
            setSyntax(parser(buff));
        };

        reader.onerror = (err) => {
            console.error(err);
        };

        reader.readAsArrayBuffer(file);
    }, []);

    return <>
        <BitstreamExplorerContext.Provider value={{
            ranges, setRanges: watch("setRanges", setRanges),
            syntax, setSyntax,
            buffer, setBuffer, 
            syntaxById,
            readFileUploadData,
            getBitColor, getByteColor
        }}>
            {
                buffer.byteLength == 0
                ? uploader
                : children
            }
        </BitstreamExplorerContext.Provider>
    </>
}
