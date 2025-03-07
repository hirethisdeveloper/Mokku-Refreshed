import React, { useState } from "react";
import { ActionIcon, Flex, Switch, Badge, Group, Checkbox, Menu } from "@mantine/core";
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
  selectedMocks: Set<string | number>;
  toggleMockSelection: (mockId: string | number) => void;
  toggleAllMocks: () => void;
  allSelected: boolean;
}

const getSchema = ({
  toggleMock,
  deleteMock,
  duplicateMock,
  editMock,
  selectedMocks,
  toggleMockSelection,
  toggleAllMocks,
  allSelected,
}: GetSchemeProps): TableSchema<IMockResponse> => [
  {
    header: (
      <Checkbox
        checked={allSelected}
        onChange={(event) => {
          event.stopPropagation();
          toggleAllMocks();
        }}
      />
    ),
    content: (data) => (
      <div
        onClick={(event) => {
          event.stopPropagation();
        }}
        style={{ cursor: "pointer" }}
      >
        <Checkbox
          checked={selectedMocks.has(data.id)}
          onChange={(event) => {
            event.stopPropagation();
            toggleMockSelection(data.id);
          }}
        />
      </div>
    ),
    width: 60,
  },
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
    content: (data) => data.name || "",
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
    header: "Tags",
    content: (data) => (
      <Group spacing={4}>
        {data.tags?.slice().sort((a, b) => a.localeCompare(b)).map((tag, index) => (
          <Badge key={index} size="xs" variant="light">
            {tag}
          </Badge>
        ))}
      </Group>
    ),
    width: 200,
  },
  {
    header: "Status",
    content: (data) => data.status,
    width: 80,
    sortKey: "status",
  },
  {
    header: "Delay",
    content: (data) => data.delay || 0,
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

export const Mocks: React.FC = () => {
  const { store, selectedMock, setSelectedMock } = useChromeStore(
    useMockStoreSelector,
    shallow,
  );
  const search = useGlobalStore((state) => state.search).toLowerCase();
  const filterNon200 = useGlobalStore((state) => state.filterNon200);
  const projectFilter = useGlobalStore((state) => state.projectFilter);
  const [sortKey, setSortKey] = useState<keyof IMockResponse | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedMocks, setSelectedMocks] = useState<Set<string | number>>(new Set());
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [rightClickedMock, setRightClickedMock] = useState<IMockResponse | null>(null);

  const { deleteMock, duplicateMock, toggleMock, editMock } = useMockActions();

  const filteredMocks = store.mocks.filter(
    (mock) => {
      // If search is empty, return all mocks
      if (!search) return true;
      
      // Check if search is using field:value format
      const colonIndex = search.indexOf(':');
      if (colonIndex > 0) {
        const field = search.substring(0, colonIndex).trim().toLowerCase();
        const value = search.substring(colonIndex + 1).trim().toLowerCase();
        
        // Return all mocks if value is empty
        if (!value) return true;
        
        // Filter based on the specified field
        switch (field) {
          case 'name':
            return (mock?.name || "").toLowerCase().includes(value);
          case 'url':
            return (mock?.url || "").toLowerCase().includes(value);
          case 'tags':
            return (mock?.tags || []).some(tag => tag.toLowerCase().includes(value));
          case 'project':
            return (mock?.project || "").toLowerCase().includes(value);
          case 'status':
            return (mock?.status || "").toString().toLowerCase().includes(value);
          case 'delay':
            return (mock?.delay || "").toString().toLowerCase().includes(value);
          case 'method':
            return (mock?.method || "").toLowerCase().includes(value);
          default:
            // If field is not recognized, perform regular search
            return (mock?.name || "").toLowerCase().includes(search) ||
                   (mock?.url || "").toLowerCase().includes(search) ||
                   (mock?.method || "").toLowerCase().includes(search) ||
                   (mock?.status || "").toString().includes(search) ||
                   (mock?.project || "").toLowerCase().includes(search) ||
                   (mock?.tags || []).some(tag => tag.toLowerCase().includes(search));
        }
      }
      
      // Regular search (no field:value format)
      return (mock?.name || "").toLowerCase().includes(search) ||
             (mock?.url || "").toLowerCase().includes(search) ||
             (mock?.method || "").toLowerCase().includes(search) ||
             (mock?.status || "").toString().includes(search) ||
             (mock?.project || "").toLowerCase().includes(search) ||
             // Search in tags
             (mock?.tags || []).some(tag => tag.toLowerCase().includes(search));
    }
  ).filter(mock => {
    // Apply the non-200 filter if enabled
    if (filterNon200) {
      return mock.status !== 200;
    }
    return true;
  }).filter(mock => {
    // Apply the project filter if selected
    if (projectFilter) {
      return mock.project === projectFilter;
    }
    return true;
  });

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

  const toggleMockSelection = (mockId: string | number) => {
    setSelectedMocks(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(mockId)) {
        newSelected.delete(mockId);
      } else {
        newSelected.add(mockId);
      }
      return newSelected;
    });
  };

  const toggleAllMocks = () => {
    if (selectedMocks.size === sortedMocks.length) {
      // If all are selected, deselect all
      setSelectedMocks(new Set());
    } else {
      // Otherwise, select all
      setSelectedMocks(new Set(sortedMocks.map(mock => mock.id)));
    }
  };

  const schema = getSchema({
    toggleMock,
    deleteMock,
    duplicateMock,
    editMock,
    selectedMocks,
    toggleMockSelection,
    toggleAllMocks,
    allSelected: sortedMocks.length > 0 && selectedMocks.size === sortedMocks.length,
  });

  // Reset selected mocks when filters change
  React.useEffect(() => {
    setSelectedMocks(new Set());
  }, [search, filterNon200, projectFilter]);

  const handleSort = (key: keyof IMockResponse, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleContextMenu = (event: React.MouseEvent, mock: IMockResponse) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setRightClickedMock(mock);
  };

  const handleContextMenuClose = () => {
    setContextMenuPosition(null);
    setRightClickedMock(null);
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
        description="No mock is matching the current search or filter. Try searching by name, url, method, status, tags, or project. You can also use field:value format (e.g., tags:dashboard, project:api) or use the project filter dropdown."
      />
    );
  }

  return (
    <>
      <TableWrapper
        selectedRowId={selectedMock?.id}
        data={sortedMocks}
        schema={schema}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onContextMenu={handleContextMenu}
      />
      
      {contextMenuPosition && rightClickedMock && (
        <Menu
          opened={!!contextMenuPosition}
          onClose={handleContextMenuClose}
          position="right"
          withArrow
          styles={{
            dropdown: {
              position: 'fixed',
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            },
          }}
        >
          <Menu.Item 
            icon={<MdOutlineModeEditOutline size={14} />}
            onClick={() => {
              editMock(rightClickedMock);
              handleContextMenuClose();
            }}
          >
            Edit
          </Menu.Item>
          <Menu.Item 
            icon={<MdOutlineContentCopy size={14} />}
            onClick={() => {
              duplicateMock(rightClickedMock);
              handleContextMenuClose();
            }}
          >
            Duplicate
          </Menu.Item>
          <Menu.Item 
            icon={<Switch 
              checked={rightClickedMock.active}
              onChange={(e) => {
                toggleMock({ ...rightClickedMock, active: e.target.checked });
                handleContextMenuClose();
              }}
              size="xs"
            />}
          >
            {rightClickedMock.active ? 'Deactivate' : 'Activate'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item 
            color="red"
            icon={<MdDeleteOutline size={14} />}
            onClick={() => {
              deleteMock(rightClickedMock);
              handleContextMenuClose();
            }}
          >
            Delete
          </Menu.Item>
        </Menu>
      )}
    </>
  );
};
