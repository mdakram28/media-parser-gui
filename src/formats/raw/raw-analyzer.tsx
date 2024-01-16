import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const RawAnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffers: BitBuffer[]) => {
            const bs = new Bitstream(buffers[0]);
            return {
                key: "ROOT",
                title: "ROOT",
                start: 0,
                size: bs.getEndPos()
            };
        }}
        uploader={<BitstreamUploader title="Drop binary file" samples={{
            "big_buck_bunny.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.mp4",
            "big_buck_bunny.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.obu",
            "aspen.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/aspen.hevc",
        }}/>}
    >
    <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel defaultSize={50} className="panel">
            {/* <SyntaxViewer /> */}
        </Panel>
        <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical"/>
        <Panel className="panel">
            <HexEditor />
        </Panel>
    </PanelGroup>
    </BitstreamExplorer>
}
