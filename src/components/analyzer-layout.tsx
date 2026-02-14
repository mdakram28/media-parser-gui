import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export function AnalyzerLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
    return (
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {left}
            </Panel>
            <PanelResizeHandle style={{
                width: 1,
                background: "var(--glass-border)",
                transition: "background 0.15s",
            }}
                className="hover:!bg-[var(--accent-9)]"
            />
            <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {right}
            </Panel>
        </PanelGroup>
    );
}
