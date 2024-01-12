import { ReactNode, createContext, useState } from "react";

type State<N extends string, T> = {
    [key in N]: T
} & {
        [key in `set${Capitalize<N>}`]: React.Dispatch<React.SetStateAction<T>>
    }

const BitstreamExplorerContext = createContext<
    State<"ranges", Range[]>
    & State<"buffer", Uint8Array>
>({
    ranges: [],
    setRanges: () => { },
    buffer: new Uint8Array,
    setBuffer: () => { },
});

export function BitstreamExplorer({ children }: { children: ReactNode }) {
    const [ranges, setRanges] = useState<Range[]>([]);
    const [buffer, setBuffer] = useState<Uint8Array>(() => new Uint8Array());

    return <>
        <BitstreamExplorerContext.Provider value={{ ranges, setRanges, buffer, setBuffer }}>
            {children}
        </BitstreamExplorerContext.Provider>
    </>
}