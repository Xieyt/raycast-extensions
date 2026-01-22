import { Action, ActionPanel, List, getPreferenceValues } from "@raycast/api";
import { Windows, focusWindow, getWindows } from "./utils/appSwitcher";
import { useEffect, useMemo } from "react";
import { useCachedState } from "@raycast/utils";

interface Preferences {
  searchByWindowTitle: boolean;
}

export default function Command() {
  const [windows, setWindows] = useCachedState<Windows>("windows-focused", []);
  const preferences = getPreferenceValues<Preferences>();

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
          {group.windows.map((window) => {
            const windowTitle = window["window-title"] || "";
            const appName = window["app-name"];
            
            const title = preferences.searchByWindowTitle 
              ? (windowTitle || appName) 
              : appName;
            const subtitle = preferences.searchByWindowTitle 
              ? appName 
              : windowTitle;

            const titleTokens = windowTitle.split(/[\s\-_|:]+/).filter(token => token.length > 0);
            const appTokens = appName.split(/[\s\-_]+/).filter(token => token.length > 0);
            const keywords = [...appTokens, ...titleTokens, appName, windowTitle];

            return (
              <List.Item
                key={window["window-id"]}
                title={title}
                subtitle={subtitle}
                icon={{ fileIcon: window["app-path"] }}
                keywords={keywords}
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
            );
          })}
        </List.Section>
      ))}
    </List>
  );
}
