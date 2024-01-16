import { DataNode } from "../types/parser.types";





export function forEachChild(node: DataNode, t: string | string[], cb: (box: DataNode, i: number) => void) {
    let i = 0;
    const titles = (Array.isArray(t) ? t : [t]);
    for(const child of node.children || []) {
        if (child.title && titles.indexOf(child.title.toString().toLowerCase()) >= 0) {
            cb(child, i++);
        }
    }
}

export function getChildValue(node: DataNode, t: string | string[]) {
    const titles = (Array.isArray(t) ? t : [t]);
    for(const child of node.children || []) {
        if (child.title && titles.indexOf(child.title.toString().toLowerCase()) >= 0) {
            return child.value;
        }
    }
    return undefined;
}

export function assert(bool: boolean, msg: string = "Assertion failed") {
    if (!bool) throw Error(msg);
}

export function assertNums(val: any) {
    assert(
        Array.isArray(val),
        `Expected array. ${typeof val} found.`
    );
    for(const item of val) {
        assert(typeof item === "number");
    }
    return val as number[];
}