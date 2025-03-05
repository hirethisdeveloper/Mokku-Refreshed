import React, { useState } from "react";
import { ActionIcon, Flex, Switch } from "@mantine/core";
import { TableSchema, TableWrapper } from "../Blocks/Table";
import { IMockResponse } from "@mokku/types";
import { useGlobalStore, useChromeStore, useChromeStoreState } from "../store";
import { shallow } from "zustand/shallow";
import {
  MdDeleteOutline,
  MdOutlineContentCopy,
  MdOutlineModeEditOutline,
} from "react-icons/md";
import { useMockActions } from "./Mocks.action";
import { Placeholder } from "../Blocks/Placeholder";

interface GetSchemeProps {
  toggleMock: (mock: IMockResponse) => void;
  deleteMock: (mock: IMockResponse) => void;
  editMock: (mock: IMockResponse) => void;
  duplicateMock: (mock: IMockResponse) => void;
}

const getSchema = ({
  toggleMock,
  deleteMock,
  duplicateMock,
  editMock,
}: GetSchemeProps): TableSchema<IMockResponse> => [
  {
    header: "",
    content: (data) => (
      <div
        onClick={(event) => {
          // this was not working with switch for some unknown reason
          event.stopPropagation();
        }}
        style={{ cursor: "pointer" }}
      >
        <Switch
          checked={data.active}
          onChange={(x) => {
            toggleMock({ ...data, active: x.target.checked });
          }}
        />
      </div>
    ),
    width: 60,
  },
  {
    header: "Name",
    content: (data) => data.name,
    width: 240,
    sortKey: "name",
  },
  {
    header: "Method",
    content: (data) => data.method,
    width: 100,
    sortKey: "method",
  },
  {
    header: "URL",
    content: (data) => data.url,
    sortKey: "url",
  },
  {
    header: "Status",
    content: (data) => data.status,
    width: 80,
    sortKey: "status",
  },
  {
    header: "Delay",
    content: (data) => data.delay,
    width: 120,
    sortKey: "delay",
  },
  {
    header: "",
    content: (data) => (
      <Flex
        align="center"
        gap="4px"
        onClick={(event) => {
          // this was not working with switch for some unknown reason
          event.stopPropagation();
        }}
      >
        <ActionIcon
          variant="outline"
          color="blue"
          onClick={() => editMock(data)}
          title={`Edit Mock ${data.name}`}
        >
          <MdOutlineModeEditOutline />
        </ActionIcon>

        <ActionIcon
          variant="outline"
          color="blue"
          onClick={() => duplicateMock(data)}
          title={`Duplicate ${data.name}`}
        >
          <MdOutlineContentCopy />
        </ActionIcon>
        <ActionIcon
          variant="outline"
          color="red"
          onClick={() => deleteMock(data)}
          title={`Delete ${data.name}`}
        >
          <MdDeleteOutline />
        </ActionIcon>
      </Flex>
    ),
    width: 80,
  },
];

const useMockStoreSelector = (state: useChromeStoreState) => ({
  store: state.store,
  setSelectedMock: state.setSelectedMock,
  selectedMock: state.selectedMock,
  setStoreProperties: state.setStoreProperties,
});

export const Mocks = () => {
  const { store, selectedMock, setSelectedMock } = useChromeStore(
    useMockStoreSelector,
    shallow,
  );
  const search = useGlobalStore((state) => state.search).toLowerCase();
  const filterNon200 = useGlobalStore((state) => state.filterNon200);
  const [sortKey, setSortKey] = useState<keyof IMockResponse | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { deleteMock, duplicateMock, toggleMock, editMock } = useMockActions();

  const schema = getSchema({
    toggleMock,
    deleteMock,
    duplicateMock,
    editMock,
  });

  const filteredMocks = store.mocks.filter(
    (mock) => {
      // First apply the search filter
      const matchesSearch = 
        (mock?.name || "").toLowerCase().includes(search) ||
        (mock?.url || "").toLowerCase().includes(search) ||
        (mock?.method || "").toLowerCase().includes(search) ||
        (mock?.status || "").toString().includes(search);
      
      // Then apply the non-200 filter if enabled
      if (filterNon200) {
        return matchesSearch && mock.status !== 200;
      }
      
      return matchesSearch;
    }
  );

  const sortedMocks = React.useMemo(() => {
    if (!sortKey) return filteredMocks;

    return [...filteredMocks].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === undefined || bValue === undefined) return 0;

      // Handle different types of values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredMocks, sortKey, sortDirection]);

  const handleSort = (key: keyof IMockResponse, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  if (store.mocks.length === 0) {
    return (
      <Placeholder
        title="No Mocks created yet."
        description="Create a mock from scratch or mock a log from logs."
      />
    );
  }

  if (filteredMocks.length === 0) {
    return (
      <Placeholder
        title="No matched mock."
        description="No mock is matching the current search, you can search by name, url, method or status."
      />
    );
  }

  return (
    <TableWrapper
      onRowClick={(data) => setSelectedMock(data)}
      selectedRowId={selectedMock?.id}
      data={sortedMocks}
      schema={schema}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
    />
  );
};
