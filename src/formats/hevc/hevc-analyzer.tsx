import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { HEVC } from "./hevc-bitstream";
import { SyntaxTable } from "../../components/syntax-table";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const HevcAnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: BitBuffer[]) => {
            buffer[0].setEscapeCode(new Uint8Array([0, 0, 3]));
            const bs = new Bitstream(buffer[0]);
            HEVC(bs);
            return (bs.getCurrent().children || [EMPTY_TREE])[0];
        }}
        uploader={<BitstreamUploader title="Drop HEVC raw bitstream file" samples={{
            "aspen.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/aspen.hevc"
        }} />}
    >
    <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel defaultSize={50} className="panel">
            <SyntaxTable />
        </Panel>
        <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical"/>
        <Panel className="panel">
            <HexEditor />
        </Panel>
    </PanelGroup>
    </BitstreamExplorer>
}
