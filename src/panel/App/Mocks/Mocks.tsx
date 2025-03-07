import React, { useState, useEffect } from "react";
import { ActionIcon, Flex, Switch, Badge, Group, Checkbox, Menu, Portal, Paper, Modal, Text, MultiSelect, Select, Button } from "@mantine/core";
import { TableSchema, TableWrapper } from "../Blocks/Table";
import { IMockResponse } from "@mokku/types";
import { useGlobalStore, useChromeStore, useChromeStoreState } from "../store";
import { shallow } from "zustand/shallow";
import {
  MdDeleteOutline,
  MdOutlineContentCopy,
  MdOutlineModeEditOutline,
  MdOutlineLabel,
} from "react-icons/md";
import { useMockActions } from "./Mocks.action";
import { Placeholder } from "../Blocks/Placeholder";
import { storeActions } from "../service/storeActions";
import { notifications } from "@mantine/notifications";

// Styles for reuse
const contextMenuOverlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
};

const contextMenuPaperStyle = (position: { x: number; y: number }) => ({
  position: 'absolute' as const,
  top: position.y,
  left: position.x,
  zIndex: 1000,
  minWidth: '150px',
  border: '1px solid #666666'
});

const contextMenuItemBaseStyle = {
  padding: '8px 12px', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center',
  transition: 'background-color 0.2s ease'
};

// Context Menu Item Component
interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, onClick, color }) => {
  return (
    <div 
      className="context-menu-item"
      style={{ 
        ...contextMenuItemBaseStyle,
        color,
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {icon}
      {label}
    </div>
  );
};

// Helper to stop event propagation
const stopPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

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
          stopPropagation(event);
          toggleAllMocks();
        }}
      />
    ),
    content: (data) => (
      <div
        onClick={stopPropagation}
        style={{ cursor: "pointer" }}
      >
        <Checkbox
          checked={selectedMocks.has(data.id)}
          onChange={(event) => {
            stopPropagation(event);
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
        onClick={stopPropagation}
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
        onClick={stopPropagation}
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

// Helper function for filtering mocks
const filterMocks = (
  mocks: IMockResponse[], 
  search: string, 
  filterNon200: boolean, 
  projectFilter: string | null
): IMockResponse[] => {
  return mocks.filter(mock => {
    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      // Check if search is using field:value format
      const colonIndex = searchLower.indexOf(':');
      if (colonIndex > 0) {
        const field = searchLower.substring(0, colonIndex).trim();
        const value = searchLower.substring(colonIndex + 1).trim();
        
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
            return performGeneralSearch(mock, searchLower);
        }
      }
      
      // Regular search (no field:value format)
      return performGeneralSearch(mock, searchLower);
    }
    
    return true;
  }).filter(mock => {
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
};

// Helper for general search across multiple fields
const performGeneralSearch = (mock: IMockResponse, search: string): boolean => {
  return (mock?.name || "").toLowerCase().includes(search) ||
         (mock?.url || "").toLowerCase().includes(search) ||
         (mock?.method || "").toLowerCase().includes(search) ||
         (mock?.status || "").toString().includes(search) ||
         (mock?.project || "").toLowerCase().includes(search) ||
         (mock?.tags || []).some(tag => tag.toLowerCase().includes(search));
};

// Helper for sorting mocks
const sortMocks = (
  mocks: IMockResponse[], 
  sortKey?: keyof IMockResponse, 
  sortDirection: 'asc' | 'desc' = 'asc'
): IMockResponse[] => {
  if (!sortKey) return mocks;

  return [...mocks].sort((a, b) => {
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
};

// ProjectTagsModal component for editing projects and tags
interface ProjectTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mocks: IMockResponse[];
  onSave: (updatedMocks: IMockResponse[]) => Promise<void>;
  store: any;
  setStoreProperties: any;
}

const ProjectTagsModal: React.FC<ProjectTagsModalProps> = ({ 
  isOpen, 
  onClose, 
  mocks, 
  onSave,
  store,
  setStoreProperties
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [project, setProject] = useState<string>("");
  const [tagData, setTagData] = useState<Array<{ value: string; label: string }>>([]);
  const [projectData, setProjectData] = useState<Array<{ value: string; label: string }>>([]);
  const tab = useGlobalStore((state) => state.meta.tab);

  // Initialize from the first mock if all mocks have the same values
  useEffect(() => {
    if (mocks.length > 0) {
      // For tags, find common tags across all selected mocks
      const commonTags = mocks.reduce((common, mock) => {
        if (!common) return mock.tags || [];
        return common.filter(tag => mock.tags?.includes(tag));
      }, null as string[] | null) || [];
      
      setTags(commonTags);

      // For project, use the first mock's project if all mocks have the same project
      const allSameProject = mocks.every(mock => mock.project === mocks[0].project);
      setProject(allSameProject ? (mocks[0].project || "") : "");
    }
  }, [mocks]);

  // Get all unique tags from existing mocks
  useEffect(() => {
    const allTags = [];
    store.mocks.forEach(mock => {
      if (mock.tags && mock.tags.length > 0) {
        mock.tags.forEach(tag => allTags.push(tag));
      }
    });
    const uniqueTags = [...new Set(allTags)];
    setTagData(uniqueTags.map(tag => ({ value: tag, label: tag })));
  }, [store.mocks]);

  // Get all unique projects from existing mocks
  useEffect(() => {
    // Get all projects from mocks
    const allProjects = [];
    store.mocks.forEach(mock => {
      if (mock.project && mock.project.trim() !== '') {
        allProjects.push(mock.project);
      }
    });
    
    // Get projects from store
    if (store.projects) {
      store.projects.forEach(project => {
        if (project && project.trim() !== '') {
          allProjects.push(project);
        }
      });
    }
    
    // Deduplicate projects
    const uniqueProjects = [...new Set(allProjects)].sort();
    
    // Format projects for the Select component
    setProjectData(uniqueProjects.map(project => ({ 
      value: project, 
      label: project 
    })));
  }, [store.mocks, store.projects]);

  // Validate tag to not contain special characters
  const validateTag = (tag: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(tag) ? null : 'Tags cannot contain special characters';
  };

  // Validate project to not contain special characters
  const validateProject = (project: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(project) ? null : 'Project cannot contain special characters';
  };

  const handleSave = async () => {
    // Create updated versions of each mock
    const updatedMocks = mocks.map(mock => ({
      ...mock,
      tags: tags,
      project: project
    }));
    
    await onSave(updatedMocks);
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Edit Project and Tags"
      size="md"
    >
      <Flex direction="column" gap={16}>
        <Flex direction="column" gap={8}>
          <Text size="sm" weight={500}>Project</Text>
          <Select
            placeholder="Select or create a project"
            data={projectData}
            value={project}
            onChange={setProject}
            searchable
            clearable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => {
              const isValid = validateProject(query);
              if (isValid === null) {
                // Check if project already exists
                if (!projectData.some(p => p.value === query)) {
                  const newItem = { value: query, label: query };
                  
                  // Add to local state
                  setProjectData(prev => [...prev, newItem]);
                  
                  // Add to store
                  const updatedProjects = [...(store.projects || []), query];
                  const updatedStore = { ...store, projects: updatedProjects };
                  
                  storeActions
                    .updateStoreInDB(updatedStore)
                    .then(setStoreProperties)
                    .then(() => {
                      storeActions.refreshContentStore(tab.id);
                    })
                    .catch((error) => {
                      console.error(error);
                      notifications.show({
                        title: "Error",
                        message: "Failed to add project to store",
                        color: "red",
                      });
                    });
                  
                  return newItem.value;
                }
                return query; // Return existing project
              }
              // Show notification for invalid project name
              notifications.show({
                title: "Invalid Project Name",
                message: isValid,
                color: "red",
              });
              return null;
            }}
          />
        </Flex>
        
        <Flex direction="column" gap={8}>
          <Text size="sm" weight={500}>Tags</Text>
          <MultiSelect
            placeholder="Add tags"
            data={tagData}
            value={tags}
            onChange={setTags}
            searchable
            clearable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => {
              const isValid = validateTag(query);
              if (isValid === null) {
                const newItem = { value: query, label: query };
                setTagData(prev => [...prev, newItem]);
                return newItem;
              }
              // Show notification for invalid tag name
              notifications.show({
                title: "Invalid Tag Name",
                message: isValid,
                color: "red",
              });
              return null;
            }}
          />
        </Flex>
        
        <Flex justify="flex-end" gap={8} mt={16}>
          <Button 
            variant="default" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="filled" 
            color="blue" 
            onClick={handleSave}
          >
            Save
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export const Mocks: React.FC = () => {
  const { store, selectedMock, setSelectedMock, setStoreProperties } = useChromeStore(
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
  const [isProjectTagsModalOpen, setIsProjectTagsModalOpen] = useState(false);

  const { deleteMock, duplicateMock, toggleMock, editMock } = useMockActions();

  const filteredMocks = filterMocks(store.mocks, search, filterNon200, projectFilter);
  const sortedMocks = React.useMemo(
    () => sortMocks(filteredMocks, sortKey, sortDirection),
    [filteredMocks, sortKey, sortDirection]
  );

  const handleContextMenuClose = React.useCallback(() => {
    setContextMenuPosition(null);
    setRightClickedMock(null);
  }, []);

  // Add event listener to handle right-clicks anywhere in the document
  useEffect(() => {
    const handleGlobalContextMenu = (event: MouseEvent) => {
      // Only handle right-clicks outside the table
      // Table right-clicks are handled by the TableWrapper's onContextMenu
      const target = event.target as HTMLElement;
      const isInsideTable = target.closest('table');
      
      if (!isInsideTable && contextMenuPosition) {
        // If clicking outside the table while a context menu is open, close it
        event.preventDefault();
        handleContextMenuClose();
      }
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
    };
  }, [contextMenuPosition, handleContextMenuClose]);

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
  useEffect(() => {
    setSelectedMocks(new Set());
  }, [search, filterNon200, projectFilter]);

  const handleSort = (key: keyof IMockResponse, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleContextMenu = (event: React.MouseEvent, mock: IMockResponse) => {
    event.preventDefault();
    // Always close the existing menu and open a new one
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setRightClickedMock(mock);
    
    // If the right-clicked mock is not in the selection, make it the only selected mock
    if (!selectedMocks.has(mock.id)) {
      setSelectedMocks(new Set([mock.id]));
    }
  };

  // Add a new function to handle bulk toggle of mocks
  const bulkToggleMocks = async (mocks: IMockResponse[], active: boolean) => {
    // Create an updated version of each mock with the new active state
    const updatedMocks = mocks.map(mock => ({ ...mock, active }));
    
    // Update the store with all mocks at once
    const updatedStore = storeActions.updateMocks(store, updatedMocks);
    
    try {
      // Update the store in the database
      const result = await storeActions.updateStoreInDB(updatedStore);
      // Update the UI state
      setStoreProperties(result);
      // Refresh the content store
      storeActions.refreshContentStore(useGlobalStore.getState().meta.tab.id);
      
      // Show notification
      const mockStatus = active ? "enabled" : "disabled";
      const message = mocks.length > 1 
        ? `${mocks.length} mocks are ${mockStatus}` 
        : `"${mocks[0].name}" is ${mockStatus}`;
      
      notifications.show({
        title: message,
        message: `Mock${mocks.length > 1 ? 's' : ''} ${mockStatus}`,
      });
    } catch (error) {
      console.error("Failed to update mocks:", error);
      notifications.show({
        title: "Cannot update mocks.",
        message: "Something went wrong, unable to update mocks.",
        color: "red",
      });
    }
  };

  // Add a new function to handle bulk deletion of mocks
  const bulkDeleteMocks = async (mocks: IMockResponse[]) => {
    // Get all mock IDs
    const mockIds = mocks.map(mock => mock.id);
    
    // Update the store with all deletions at once
    const updatedStore = storeActions.deleteMocks(store, mockIds);
    
    try {
      // Update the store in the database
      const result = await storeActions.updateStoreInDB(updatedStore);
      // Update the UI state
      setStoreProperties(result);
      // Refresh the content store
      storeActions.refreshContentStore(useGlobalStore.getState().meta.tab.id);
      
      // Show notification
      const message = mocks.length > 1 
        ? `${mocks.length} mocks deleted` 
        : `"${mocks[0].name}" mock deleted`;
      
      notifications.show({
        title: message,
        message: `Mock${mocks.length > 1 ? 's' : ''} deleted successfully.`,
      });
    } catch (error) {
      console.error("Failed to delete mocks:", error);
      notifications.show({
        title: "Cannot delete mocks.",
        message: "Something went wrong, unable to delete mocks.",
        color: "red",
      });
    }
  };

  // Add a new function to handle bulk update of projects and tags
  const bulkUpdateProjectsAndTags = async (updatedMocks: IMockResponse[]) => {
    // Update the store with all mocks at once
    const updatedStore = storeActions.updateMocks(store, updatedMocks);
    
    try {
      // Update the store in the database
      const result = await storeActions.updateStoreInDB(updatedStore);
      // Update the UI state
      setStoreProperties(result);
      // Refresh the content store
      storeActions.refreshContentStore(useGlobalStore.getState().meta.tab.id);
      
      // Show notification
      const message = updatedMocks.length > 1 
        ? `${updatedMocks.length} mocks updated` 
        : `"${updatedMocks[0].name}" updated`;
      
      notifications.show({
        title: message,
        message: "Project and tags updated successfully",
      });
    } catch (error) {
      console.error("Failed to update mocks:", error);
      notifications.show({
        title: "Cannot update mocks",
        message: "Something went wrong, unable to update mocks.",
        color: "red",
      });
    }
  };

  // Render placeholder for empty states
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
        <Portal>
          <div
            style={contextMenuOverlayStyle}
            onClick={handleContextMenuClose}
          >
            <Paper
              shadow="md"
              style={contextMenuPaperStyle(contextMenuPosition)}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Show count of selected items if more than one */}
                {selectedMocks.size > 1 && (
                  <div style={{ 
                    padding: '8px 12px', 
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {selectedMocks.size} items selected
                  </div>
                )}
                
                {/* Edit is only available for single selection */}
                {selectedMocks.size === 1 && (
                  <ContextMenuItem 
                    icon={<MdOutlineModeEditOutline size={14} style={{ marginRight: '8px' }} />}
                    label="Edit"
                    onClick={() => {
                      editMock(rightClickedMock);
                      handleContextMenuClose();
                    }}
                  />
                )}
                
                {/* Add new option for editing projects and tags */}
                <ContextMenuItem 
                  icon={<MdOutlineLabel size={14} style={{ marginRight: '8px' }} />}
                  label={selectedMocks.size > 1 ? `Edit Project & Tags (${selectedMocks.size})` : "Edit Project & Tags"}
                  onClick={() => {
                    // Get all selected mocks
                    const selectedMocksList = sortedMocks.filter(mock => selectedMocks.has(mock.id));
                    setIsProjectTagsModalOpen(true);
                    handleContextMenuClose();
                  }}
                />
                
                <ContextMenuItem 
                  icon={<MdOutlineContentCopy size={14} style={{ marginRight: '8px' }} />}
                  label={selectedMocks.size > 1 ? `Duplicate (${selectedMocks.size})` : "Duplicate"}
                  onClick={() => {
                    // Apply to all selected mocks
                    const selectedMocksList = sortedMocks.filter(mock => selectedMocks.has(mock.id));
                    // Process each selected mock
                    selectedMocksList.forEach(mock => {
                      duplicateMock(mock);
                    });
                    handleContextMenuClose();
                  }}
                />
                
                <div 
                  className="context-menu-item"
                  style={contextMenuItemBaseStyle}
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Get all selected mocks
                    const selectedMocksList = sortedMocks.filter(mock => selectedMocks.has(mock.id));
                    const newActiveState = !rightClickedMock.active;
                    
                    // Use the bulk update function instead of individual updates
                    await bulkToggleMocks(selectedMocksList, newActiveState);
                    handleContextMenuClose();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Switch 
                    checked={rightClickedMock.active}
                    onChange={async (e) => {
                      e.stopPropagation();
                      // Get all selected mocks
                      const selectedMocksList = sortedMocks.filter(mock => selectedMocks.has(mock.id));
                      const newActiveState = e.target.checked;
                      
                      // Use the bulk update function instead of individual updates
                      await bulkToggleMocks(selectedMocksList, newActiveState);
                      handleContextMenuClose();
                    }}
                    size="xs"
                    style={{ marginRight: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {rightClickedMock.active ? 
                    (selectedMocks.size > 1 ? `Deactivate (${selectedMocks.size})` : 'Deactivate') : 
                    (selectedMocks.size > 1 ? `Activate (${selectedMocks.size})` : 'Activate')}
                </div>
                
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 0' }} />
                
                <ContextMenuItem 
                  icon={<MdDeleteOutline size={14} style={{ marginRight: '8px' }} />}
                  label={selectedMocks.size > 1 ? `Delete (${selectedMocks.size})` : "Delete"}
                  onClick={async () => {
                    // Get all selected mocks
                    const selectedMocksList = sortedMocks.filter(mock => selectedMocks.has(mock.id));
                    
                    // Use the bulk delete function instead of individual deletes
                    await bulkDeleteMocks(selectedMocksList);
                    handleContextMenuClose();
                  }}
                  color="red"
                />
              </div>
            </Paper>
          </div>
        </Portal>
      )}
      
      {/* Add the ProjectTagsModal */}
      <ProjectTagsModal
        isOpen={isProjectTagsModalOpen}
        onClose={() => setIsProjectTagsModalOpen(false)}
        mocks={sortedMocks.filter(mock => selectedMocks.has(mock.id))}
        onSave={bulkUpdateProjectsAndTags}
        store={store}
        setStoreProperties={setStoreProperties}
      />
    </>
  );
};
