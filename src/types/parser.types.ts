import { ReactNode } from "react"
import { Bitstream } from "../bitstream/parser"


export type DataNode = {
    title: ReactNode,
    key: string,
    children?: DataNode[],
    start: number,
    size: number
}