import { ReactElement, useContext, useEffect, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { IconButton, Switch, Text, Tooltip, TextField, DropdownMenu, Flex } from "@radix-ui/themes";
import { SyntaxTableSettings } from "./syntax-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faRedo, faSlidersH } from "@fortawesome/free-solid-svg-icons";

export function SyntaxToolbar({ leftItems, rightItems }: {
    rightItems?: ReactElement,
    leftItems?: ReactElement
}) {
    const {
        setFilter,
        reset,
        settings, setSettings
    } = useContext(BitstreamExplorerContext);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilter((f) => ({ ...f, text: searchText }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText, setFilter]);

    function SettingSwitch<T extends keyof SyntaxTableSettings>(
        title: string,
        key: T
    ) {
        return <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
            <Flex align="center" gap="2">
                <Switch
                    size="1"
                    checked={settings[key] as boolean}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, [key]: checked }))}
                />
                <Text as="label" size="2" className="cursor-pointer">{title}</Text>
            </Flex>
        </DropdownMenu.Item>
    }

    return <Flex align="center" gap="1" style={{
        height: 36,
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        borderBottom: "1px solid var(--glass-border)",
        flexShrink: 0,
        paddingInline: 8,
    }}>
        <Flex align="center" gap="2">
            <FontAwesomeIcon icon={faSearch} style={{ color: "var(--gray-a11)", fontSize: 12 }} />
            <TextField.Root
                size="1"
                placeholder="Filter..."
                style={{ width: 128 }}
                value={searchText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            />
        </Flex>
        {leftItems}

        <span style={{ flex: 1 }} />
        {rightItems}

        <Tooltip content="Reset">
            <IconButton variant="ghost" size="1" onClick={reset}>
                <FontAwesomeIcon icon={faRedo} style={{ fontSize: 12 }} />
            </IconButton>
        </Tooltip>

        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <IconButton variant="ghost" size="1">
                    <FontAwesomeIcon icon={faSlidersH} style={{ fontSize: 12 }} />
                </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                {SettingSwitch("Show hidden syntax", "showHiddenSyntax")}
                {SettingSwitch("Show size bars", "showSizeBar")}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Flex>
}
