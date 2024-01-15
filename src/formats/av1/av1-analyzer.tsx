import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { MSBBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { SyntaxViewer } from "../../bitstream/syntax-viewer";
import { AV1 } from "./av1-bitstream";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const Av1AnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer));
            AV1(bs);
            // return (bs.getCurrent().children || [EMPTY_TREE])[0];
            return bs.getCurrent();
        }}

        uploader={<BitstreamUploader title="Drop AV1 raw bitstream file" samples={{
            "big_buck_bunny.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.obu"
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxViewer />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical"/>
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
