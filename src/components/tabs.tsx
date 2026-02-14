import { ReactNode } from "react"
import { Tabs } from "@radix-ui/themes"

export type TabType<T> = {
    key: T,
    title: ReactNode,
    render: ReactNode
};

export function TabsComponent<T>({ tabs, defaultTab }: {
    tabs: TabType<T>[],
    defaultTab: T
}) {
    return <Tabs.Root defaultValue={defaultTab as string} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Tabs.List>
            {tabs.map(tab =>
                <Tabs.Trigger
                    key={tab.key as string}
                    value={tab.key as string}
                >
                    {tab.title}
                </Tabs.Trigger>
            )}
        </Tabs.List>
        {tabs.map(tab =>
            <Tabs.Content
                key={tab.key as string}
                value={tab.key as string}
                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
            >
                {tab.render}
            </Tabs.Content>
        )}
    </Tabs.Root>
}
