import { ReactNode } from "react"




export type DataNode = {
    title: ReactNode,
    key: string,
    children?: DataNode[],
    start: number,
    size: number
}