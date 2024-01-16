import { HexEditor } from "../../components/hex-editor";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { AV1 } from "./av1-bitstream";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { extractMp4Tracks, isMP4Format } from "../../formats/mp4/mp4-bitstream";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { MediaTrack } from "../../types/media.types";
import { useState } from "react";

export const Av1AnalyzerComponent = (props: {}) => {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return <BitstreamExplorer
        parser={(buffer: BitBuffer[]) => {
            return AV1(buffer);
        }}
        containers={["Detect", "MP4", "OBU"]}
        unpack={(buffer: Uint8Array, format: string) => {
            format = format.split(" ")[0].toLowerCase();
            if (format == "mp4" || (format == "detect" && isMP4Format(buffer))) {

                // Extract and filter tracks
                const tracks: Record<string, MediaTrack> = Object.entries(extractMp4Tracks(buffer))
                    .filter(([trackId, track]) => track.samplesType === "av01")
                    .reduce((obj, [trackId, track]) => ({ ...obj, [trackId]: track }), {});
                
                console.log(tracks);

                // Set Tracks for future selections
                setTracks(tracks);

                // By default parse the first track
                const trackId = selectedTrack || Object.keys(tracks)[0];

                const buffers = tracks[trackId].chunkRanges.map(chunkRange => new BitBuffer(buffer, chunkRange));
                return buffers;
                // return extractMp4Data(buffer);
            }
            return [new BitBuffer(buffer)];
        }}
        uploader={<BitstreamUploader title="Drop AV1 raw bitstream file" samples={{
            "spbtv_sample_bipbop_av1_960x540_25fps.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/spbtv_sample_bipbop_av1_960x540_25fps.mp4",
            "multi_track.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/multi_track.mp4",
            "big_buck_bunny.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.obu",
            "big_buck_bunny.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.mp4"
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxToolbar
                    leftItems={
                        tracks && <div className="toolbar-item" data-tooltip="Select track to parse">
                            Track
                            <select value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)}>
                                {Object.keys(tracks).map(id => <option key={id} value={id}>{id}</option>)}
                            </select>
                        </div>
                    } />
                <SyntaxTable />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
