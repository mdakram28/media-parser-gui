import { ByteRange } from "../bitstream/range"

export type MediaTrack = {
    samplesType: string,
    sampleRanges: ByteRange[],
    chunkRanges: ByteRange[]
}