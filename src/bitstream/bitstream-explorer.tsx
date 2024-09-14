import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from "react";
import { DataNode } from "../types/parser.types";
import { BitstreamUploader } from "./uploader";
import { BitRange } from "./range";
import { colors } from "@mui/material";
import { BitBuffer } from "./buffer";
import { SyntaxTableSettings } from "../components/syntax-table";

type State<N extends string, T> = {
    [key in N]: T
} & {
        [key in `set${Capitalize<N>}`]: React.Dispatch<React.SetStateAction<T>>
    }


export const EMPTY_TREE: DataNode = {
    key: "root",
    varName: "root",
    title: "Empty bitstream",
    start: 0,
    size: 0
};

export const BitstreamSelectionContext = createContext<
    State<"ranges", BitRange[]>
    & State<"selectedNode", DataNode | undefined>
    & {
        getBitColor: (pos: number) => string | undefined,
        getByteColor: (pos: number) => string | undefined
    }
>({
    ranges: [],
    setRanges: () => { },
    selectedNode: undefined,
    setSelectedNode: () => {},
    getBitColor: () => undefined,
    getByteColor: () => undefined,
});

function forEachPreOrder(node: DataNode, cb: (node: DataNode) => void) {
    cb(node);
    for (const child of (node.children || [])) {
        forEachPreOrder(child, cb);
    }
}

// const COLORS = [colors.purple[700], colors.purple[400], colors.purple[300], colors.purple[200], colors.purple[100], colors.purple[50]];
const COLORS = ["var(--primary-color)", "var(--secondary-color)"];

let watchCount: { [k: string]: number } = {};
function watch<T extends Function>(name: string, cb: T) {
    watchCount[name] = 0;
    return ((...args: any) => {
        watchCount[name]++;
        console.log(`Watch: ${name} callled ${watchCount[name]} times.`, args);
        console.trace();
        return cb(...args);
    }) as any as T;
}

function BitstreamSelection({ children }: {
    children: ReactNode,
}) {
    const [ranges, setRanges] = useState<BitRange[]>([]);
    const [selectedNode, setSelectedNode] = useState<DataNode>();

    const getBitColor = useCallback((bitPos: number) => {
        for (let i = 0; i < ranges.length; i++) {
            if (ranges[i].inRange(bitPos)) {
                return COLORS[i > 0 ? 1 : 0];
            }
        }
        return undefined;
    }, [ranges]);

    const getByteColor = useCallback((bytePos: number) => {
        const bitRange = new BitRange(bytePos * 8, (bytePos + 1) * 8);
        for (let i = 0; i < ranges.length; i++) {
            if (ranges[i].intersect(bitRange).count() > 0) {
                return COLORS[i > 0 ? 1 : 0];
            }
        }
        return undefined;
    }, [ranges]);


    return <BitstreamSelectionContext.Provider value={{
        ranges, setRanges,
        getBitColor, getByteColor,
        selectedNode, setSelectedNode
    }}>
        {children}
    </BitstreamSelectionContext.Provider>
}

export const BitstreamExplorerContext = createContext<
    & State<"fileBuffer", Uint8Array>
    & State<"syntax", DataNode>
    & State<"filter", { text: string }>
    & State<"containerFormat", string>
    & State<"fileName", string | undefined>
    & State<"settings", SyntaxTableSettings>
    & {
        trackBuffer: BitBuffer[],
        reset: () => void,
        unpack?: (buffer: Uint8Array) => BitBuffer,
        containers?: string[]
    }
>({
    trackBuffer: [],
    fileBuffer: new Uint8Array,
    setFileBuffer: () => { },
    syntax: EMPTY_TREE,
    setSyntax: () => { },
    filter: { text: "" },
    setFilter: () => undefined,
    reset: () => undefined,
    containerFormat: "detect",
    setContainerFormat: () => {},
    fileName: undefined,
    setFileName: () => {},
    settings: {showHiddenSyntax: false, showSizeBar: true},
    setSettings: () => {}
});

export function BitstreamExplorer({ 
    children, 
    parser, 
    uploader = <BitstreamUploader title="Drop media file here" />,
    containers,
    unpack
}: {
    children: ReactNode,
    parser: (buffer: BitBuffer[], format: string) => DataNode,
    uploader?: ReactNode,
    containers?: string[],
    unpack?: (buffer: Uint8Array, format: string) => [string, BitBuffer[]]
}) {
    const [syntax, setSyntax] = useState<DataNode>(EMPTY_TREE);
    const [fileBuffer, setFileBuffer] = useState<Uint8Array>(() => new Uint8Array());
    const [filter, setFilter] = useState<{text: string}>({text: ""});
    const [containerFormat, setContainerFormat] = useState<string>((containers && containers[0]) || "Detect");
    const [showHiddenSyntax, setShowHiddenSyntax] = useState<boolean>(false);
    const [trackBuffer, setTrackBuffer] = useState<BitBuffer[]>([]);
    const [fileName, setFileName] = useState<string>();
    const [settings, setSettings] = useState<SyntaxTableSettings>({
        showHiddenSyntax: false,
        showSizeBar: true
    });

    const filteredSyntax = useMemo(() => {
        if (!filter.text) return syntax;
        const text = filter.text.toLowerCase();
        function dfs(node: DataNode): DataNode | undefined {
            const take = node.title!.toString().toLowerCase().indexOf(text) >= 0;
            if (take) return node;
            const children: DataNode[] = []
            for (const child of (node.children || [])) {
                const takeChild = dfs(child);
                if (takeChild !== undefined) {
                    children.push(takeChild);
                }
            }
            if (children.length > 0) {
                return {
                    ...node,
                    children
                }
            }
            return undefined;
        }
        
        return dfs(syntax) || EMPTY_TREE;
    }, [syntax, filter]);
    
    
    useEffect(() => {
        if (fileBuffer.byteLength === 0) return;
        reset();
    }, [fileBuffer])
    
    const reset = useCallback(() => {
        let newTrackBuffer = [new BitBuffer(fileBuffer)];
        let format = containerFormat;
        if (unpack && containerFormat) {
            const [_format, _newTrackBuffer] = unpack(fileBuffer, containerFormat);
            newTrackBuffer = _newTrackBuffer;
            format = _format;
            setContainerFormat(format);         // Detected container after unpacking
        }
        setTrackBuffer(newTrackBuffer);
        setSyntax(parser(newTrackBuffer, format));
    }, [fileBuffer, unpack, parser, setSyntax, setTrackBuffer]);


    return <>
        <BitstreamExplorerContext.Provider value={{
            syntax: filteredSyntax, setSyntax,
            fileBuffer, setFileBuffer,          // Input file buffer
            trackBuffer,                        // Track Buffer to parse
            filter, setFilter,
            containerFormat, setContainerFormat,
            reset, containers,
            fileName, setFileName,
            settings, setSettings
        }}>
            <BitstreamSelection>
                {
                    trackBuffer.length === 0 || trackBuffer[0].byteLength() === 0
                        ? uploader
                        : children
                }
            </BitstreamSelection>
        </BitstreamExplorerContext.Provider >
    </>
}
