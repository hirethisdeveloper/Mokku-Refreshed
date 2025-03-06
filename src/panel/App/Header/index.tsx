import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { Tabs, Flex, createStyles, Input, Button } from "@mantine/core";
import { MdAdd } from "react-icons/md";
import { TbSearch } from "react-icons/tb";
import {
  useChromeStore,
  useGlobalStore,
  ViewEnum,
  useGlobalStoreState,
} from "../store";
import { ThemeButton } from "./ThemeButton";
import { RefreshButton } from "./RefreshButton";
import { ClearButton } from "./ClearButton";
import { RecordButton } from "./RecordButton";
import { FilterNon200Button } from "./FilterNon200Button";
import { ImportExportButton } from "./ImportExportButton";
import { SwitchButton } from "./SwitchButton";
import { SupportUs } from "./SupportUs";

const viewSelector = (state: useGlobalStoreState) => ({
  view: state.view,
  setView: state.setView,
  search: state.search,
  setSearch: state.setSearch,
});

export const Header = () => {
  const { view, setView, search, setSearch } = useGlobalStore(
    viewSelector,
    shallow,
  );
  const setSelectedMock = useChromeStore((state) => state.setSelectedMock);
  const [showSupportUs, setShowSupportUs] = useState(false);

  return (
    <Tabs value={view} onTabChange={setView}>
      <Tabs.List style={{ width: "100%" }}>
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <Flex align="center">
            <Tabs.Tab value={ViewEnum.PROJECTS}>Projects</Tabs.Tab>
            <Tabs.Tab value={ViewEnum.MOCKS}>Mocks</Tabs.Tab>
            <Tabs.Tab value={ViewEnum.LOGS}>Logs</Tabs.Tab>
            <Flex align="center" gap={8}>
              <Button
                onClick={() => setSelectedMock({})}
                leftIcon={<MdAdd />}
                size="xs"
                variant="subtle"
              >
                Add Mock
              </Button>
              <Input
                icon={<TbSearch />}
                placeholder="Search or use field:value (e.g., tags:dashboard)"
                size="xs"
                defaultValue={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <RecordButton />
              {view === ViewEnum.MOCKS && <FilterNon200Button />}
              <ImportExportButton />
              {view === "LOGS" ? <ClearButton /> : null}
            </Flex>
          </Flex>
          <Flex gap="4px" style={{ paddingRight: 4 }}>
            <Button
              onClick={() => setShowSupportUs(true)}
              size="xs"
              variant="subtle"
            >
              Support Mokku
            </Button>
            <ThemeButton />
            <RefreshButton />
            <SwitchButton />
          </Flex>
          {showSupportUs && (
            <SupportUs onClose={() => setShowSupportUs(false)} />
          )}
        </Flex>
      </Tabs.List>
    </Tabs>
  );
};
