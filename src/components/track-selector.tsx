import { MediaTrack } from "../types/media.types";
import { Select, Text, Flex } from "@radix-ui/themes";

export function TrackSelector({ tracks, selectedTrack, onSelect }: {
    tracks: Record<string, MediaTrack>;
    selectedTrack: string | undefined;
    onSelect: (trackId: string) => void;
}) {
    if (!tracks || Object.keys(tracks).length === 0) return null;

    return (
        <Flex align="center" gap="2" style={{ paddingInline: 8 }}>
            <Text size="1" color="gray">Track</Text>
            <Select.Root size="1" value={selectedTrack} onValueChange={onSelect}>
                <Select.Trigger variant="ghost" />
                <Select.Content>
                    {Object.keys(tracks).map((id) => (
                        <Select.Item key={id} value={id}>{id}</Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
        </Flex>
    );
}
