import { ReactNode, useState } from "react"

export type TabType<T> = {
    key: T,
    title: ReactNode,
    render: ReactNode
};

export function Tabs<T>({ tabs, defaultTab }: {
    tabs: TabType<T>[],
    defaultTab: T
}) {
    const [currentTab, setCurrentTab] = useState<T>(defaultTab);

    return <>
        <div className="toolbar">
            {tabs.map(tab =>
                <a
                    key={tab.key as string}
                    className={["toolbar-item", currentTab === tab.key && "active"].join(" ")}
                    onClick={() => setCurrentTab(tab.key)}
                >
                    {tab.title}
                </a>)}
        </div>
        {tabs.map(tab =>
            <div key={tab.key as string} className="flexv-item flexv"
                style={tab.key === currentTab
                    ? {}
                    : { display: "none" }
                }
            >
                {tab.render}
            </div>
        )}
    </>
}