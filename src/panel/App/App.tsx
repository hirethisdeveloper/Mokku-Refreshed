import React, { useEffect, useState } from "react";
import { ColorScheme, Flex } from "@mantine/core";
import { Show } from "./Blocks/Show";
import { Mocks } from "./Mocks/Mocks";
import { Logs } from "./Logs/Logs";
import { ImportExport } from "./ImportExport/ImportExport";
import { Projects } from "./Projects";
import { usePanelListener } from "./hooks/usePanelListner";
import { DisabledPlaceholder } from "./DisabledPlaceholder/DisabledPlaceholder";

import {
  useGlobalStore,
  useGlobalStoreState,
  useChromeStore,
  ViewEnum,
} from "./store";
import { Notifications } from "@mantine/notifications";
import { Modal } from "./Blocks/Modal";
import { Header } from "./Header";

export const App = (props: useGlobalStoreState["meta"]) => {
  const state = usePanelListener(props);

  const setMeta = useGlobalStore((state) => state.setMeta);
  const view = useGlobalStore((state) => state.view);

  const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");
  const initMockStore = useChromeStore((state) => state.init);

  useEffect(() => {
    initMockStore();
    setMeta(props);
    const theme = (localStorage.getItem("theme") || "dark") as ColorScheme;
    setColorScheme(theme);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", colorScheme);
  }, [colorScheme]);

  if (!state.active) {
    return <DisabledPlaceholder />;
  }

  return (
    <>
      <Notifications />
      <Flex
        direction="column"
        style={{ minWidth: 1024, height: "100%", overflow: "hidden" }}
      >
        <Header />
        <div style={{ overflow: "auto", flexGrow: 2 }}>
          <Show if={view === ViewEnum.PROJECTS}>
            <Projects />
          </Show>
          <Show if={view === ViewEnum.MOCKS}>
            <Mocks />
          </Show>
          <Show if={view === ViewEnum.LOGS}>
            <Logs />
          </Show>
          <Show if={view === ViewEnum.IMPORT_EXPORT}>
            <ImportExport />
          </Show>
        </div>
      </Flex>
      <Modal />
    </>
  );
};
