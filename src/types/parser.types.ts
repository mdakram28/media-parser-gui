import { ReactNode } from "react"
import { Bitstream } from "../bitstream/parser"

export type DataNodeValue = number | string | DataNodeValue[];

export type DataNode = {
    title: ReactNode,
    key: string,
    children?: DataNode[],
    varName: string,
    value?: DataNodeValue,
    start: number,
    size: number,
    skip: number,
    hidden?: boolean
    filtered?: boolean
}