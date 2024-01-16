import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { HEVC, SystemStreamHEVC } from "./hevc-bitstream";
import { SyntaxTable } from "../../components/syntax-table";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { extractMp4Tracks, isMP4Format } from "../mp4/mp4-bitstream";
import { MediaTrack } from "../../types/media.types";
import { useState } from "react";
import { SyntaxToolbar } from "../../components/syntax-toolbar";

export const HevcAnalyzerComponent = (props: {}) => {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return <BitstreamExplorer
        parser={(buffers: BitBuffer[], format: string) => {
            if (format === "mp4") {
                return SystemStreamHEVC(buffers);
            } else {
                return HEVC(buffers[0]);
            }
        }}
        containers={["Detect", "MP4", "hevc"]}
        unpack={(buffer: Uint8Array, format: string) => {
            format = format.split(" ")[0].toLowerCase();
            if (format === "mp4" || (format === "detect" && isMP4Format(buffer))) {

                // Extract and filter tracks
                const tracks: Record<string, MediaTrack> = extractMp4Tracks(buffer, ["hev1"]);

                if (Object.keys(tracks).length === 0) {
                    alert(`Could not find "hev1" track in mp4 file.`);
                    return ["mp4", []];
                }

                // Set Tracks for future selections
                setTracks(tracks);

                // By default parse the first track
                const trackId = selectedTrack || Object.keys(tracks)[0];

                const buffers = tracks[trackId].chunkRanges.map(chunkRange => new BitBuffer(buffer, chunkRange));
                return ["mp4", buffers];
                // return extractMp4Data(buffer);
            }
            return ["hevc", [new BitBuffer(buffer)]];
        }}
        uploader={<BitstreamUploader title="Drop HEVC raw bitstream file" samples={{
            "hevc_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.mp4",
            "hevc_single.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.hevc",
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxToolbar />
                <SyntaxTable />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
