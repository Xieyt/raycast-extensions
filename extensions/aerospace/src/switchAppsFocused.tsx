import { Action, ActionPanel, List } from "@raycast/api";
import { Windows, focusWindow, getWindows } from "./utils/appSwitcher";
import { useEffect, useMemo } from "react";
import { useCachedState } from "@raycast/utils";

export default function Command() {
  const [windows, setWindows] = useCachedState<Windows>("windows-focused", []);

  useEffect(() => {
    const f = async () => {
      const updatedWindows = await getWindows("focused");
      setWindows(updatedWindows);
    };
    f();
  }, []);

  const groupedByWorkspace = useMemo(() => {
    const groups: Record<string, { monitor: string; windows: typeof windows }> = {};
    for (const window of windows) {
      const key = window.workspace;
      if (!groups[key]) {
        groups[key] = { monitor: window["monitor-name"], windows: [] };
      }
      groups[key].windows.push(window);
    }
    return groups;
  }, [windows]);

  const navigationTitle = `Windows in Workspace ${windows[0]?.workspace || ""}`;

  return (
    <List isLoading={windows.length === 0} navigationTitle={navigationTitle}>
      {Object.entries(groupedByWorkspace).map(([workspaceName, group]) => (
        <List.Section key={workspaceName} title={`Workspace ${workspaceName} - ${group.monitor}`}>
          {group.windows.map((window) => (
            <List.Item
              key={window["window-id"]}
              title={window["app-name"]}
              subtitle={window["window-title"]}
              icon={{ fileIcon: window["app-path"] }}
              actions={
                <ActionPanel>
                  <Action
                    title="Focus Window"
                    onAction={() => {
                      focusWindow(window["window-id"].toString());
                    }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
