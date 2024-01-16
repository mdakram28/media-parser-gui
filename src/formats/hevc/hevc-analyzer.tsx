import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { HEVC } from "./hevc-bitstream";
import { SyntaxTable } from "../../components/syntax-table";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { extractMp4Tracks, isMP4Format } from "../mp4/mp4-bitstream";
import { MediaTrack } from "../../types/media.types";
import { useState } from "react";

export const HevcAnalyzerComponent = (props: {}) => {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return <BitstreamExplorer
        parser={(buffer: BitBuffer[]) => {
            buffer[0].setEscapeCode(new Uint8Array([0, 0, 3]));
            const bs = new Bitstream(buffer[0]);
            HEVC(bs);
            return (bs.getCurrent().children || [EMPTY_TREE])[0];
        }}
        containers={["Detect", "MP4", "hevc"]}
        unpack={(buffer: Uint8Array, format: string) => {
            format = format.split(" ")[0].toLowerCase();
            if (format == "mp4" || (format == "detect" && isMP4Format(buffer))) {

                // Extract and filter tracks
                const tracks: Record<string, MediaTrack> = extractMp4Tracks(buffer);
                    // .filter(([trackId, track]) => track.samplesType === "av01")
                    // .reduce((obj, [trackId, track]) => ({ ...obj, [trackId]: track }), {});
                
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
        uploader={<BitstreamUploader title="Drop HEVC raw bitstream file" samples={{
            "aspen.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/aspen.mp4",
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
