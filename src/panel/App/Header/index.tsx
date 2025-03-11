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
import { ProjectFilterButton } from "./ProjectFilterButton";
import { SwitchButton } from "./SwitchButton";
import { SupportUs } from "./SupportUs";

const viewSelector = (state: useGlobalStoreState) => ({
  view: state.view,
  setView: state.setView,
  search: state.search,
  setSearch: state.setSearch,
});

export const Header = ({ "data-testid": dataTestId = "app-header", ...props }) => {
  const { view, setView, search, setSearch } = useGlobalStore(
    viewSelector,
    shallow,
  );
  const setSelectedMock = useChromeStore((state) => state.setSelectedMock);
  const [showSupportUs, setShowSupportUs] = useState(false);

  return (
    <Tabs value={view} onTabChange={setView} data-testid={dataTestId} {...props}>
      <Tabs.List style={{ width: "100%" }} data-testid="header-tabs-list">
        <Flex justify="space-between" align="center" style={{ width: "100%" }} data-testid="header-flex-container">
          <Flex align="center" data-testid="header-left-section">
            <Tabs.Tab value={ViewEnum.PROJECTS} data-testid="header-tab-projects">Projects</Tabs.Tab>
            <Tabs.Tab value={ViewEnum.MOCKS} data-testid="header-tab-mocks">Mocks</Tabs.Tab>
            <Tabs.Tab value={ViewEnum.LOGS} data-testid="header-tab-logs">Logs</Tabs.Tab>
            <Flex align="center" gap={8} data-testid="header-actions">
              <Button
                onClick={() => setSelectedMock({})}
                leftIcon={<MdAdd />}
                size="xs"
                variant="subtle"
                data-testid="header-add-mock-button"
              >
                Add Mock
              </Button>
              <Input
                icon={<TbSearch />}
                placeholder="Search or use field:value (e.g., tags:dashboard, project:api)"
                size="xs"
                defaultValue={search}
                onChange={(event) => setSearch(event.target.value)}
                data-testid="header-search-input"
              />
              <RecordButton data-testid="header-record-button" />
              {view === ViewEnum.MOCKS && <FilterNon200Button data-testid="header-filter-non200-button" />}
              <ImportExportButton data-testid="header-import-export-button" />
              {view === ViewEnum.MOCKS && <ProjectFilterButton data-testid="header-project-filter-button" />}
              {view === "LOGS" ? <ClearButton data-testid="header-clear-button" /> : null}
            </Flex>
          </Flex>
          <Flex gap="4px" style={{ paddingRight: 4 }} data-testid="header-right-section">
            <ThemeButton data-testid="header-theme-button" />
            <RefreshButton data-testid="header-refresh-button" />
            <SwitchButton data-testid="header-switch-button" />
          </Flex>
          {showSupportUs && (
            <SupportUs onClose={() => setShowSupportUs(false)} data-testid="header-support-us" />
          )}
        </Flex>
      </Tabs.List>
    </Tabs>
  );
};
