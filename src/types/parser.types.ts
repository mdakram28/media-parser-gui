import { ReactNode } from "react"
import { Bitstream } from "../bitstream/parser"

export type DataNodeValue = number | string | DataNodeValue[];

export type DataNode = {
    title: ReactNode,
    key: string,
    children?: DataNode[],
    value?: DataNodeValue,
    start: number,
    size: number
    hidden?: boolean
}