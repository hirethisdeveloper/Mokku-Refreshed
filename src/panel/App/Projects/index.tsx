import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Input,
  Text,
  Title,
  Badge,
  ActionIcon,
  TextInput,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useChromeStore, useChromeStoreState } from "../store";
import { shallow } from "zustand/shallow";
import { storeActions } from "../service/storeActions";
import { useGlobalStore } from "../store";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

const useProjectsSelector = (state: useChromeStoreState) => ({
  store: state.store,
  setStoreProperties: state.setStoreProperties,
});

export const Projects = () => {
  const { store, setStoreProperties } = useChromeStore(
    useProjectsSelector,
    shallow,
  );
  const tab = useGlobalStore((state) => state.meta.tab);

  // State for projects
  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<{ original: string; new: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Load projects from mocks and store
  useEffect(() => {
    const allProjects = [];
    
    // Get projects from mocks
    store.mocks.forEach(mock => {
      if (mock.project) {
        allProjects.push(mock.project);
      }
    });
    
    // Get projects from store
    if (store.projects) {
      store.projects.forEach(project => {
        allProjects.push(project);
      });
    }
    
    // Update local state with unique projects
    setProjects([...new Set(allProjects)].sort());
  }, [store.mocks, store.projects]);

  // Refresh the projects list when the component mounts
  useEffect(() => {
    const refreshProjects = () => {
      const allProjects = [];
      store.mocks.forEach(mock => {
        if (mock.project) {
          allProjects.push(mock.project);
        }
      });
      setProjects([...new Set(allProjects)].sort());
    };

    refreshProjects();
  }, []);

  // Validate project to not contain special characters
  const validateProject = (project: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(project) ? null : 'Project cannot contain special characters';
  };

  // Handle creating a new project
  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      notifications.show({
        title: "Error",
        message: "Project name cannot be empty",
        color: "red",
      });
      return;
    }

    const validationError = validateProject(newProjectName);
    if (validationError) {
      notifications.show({
        title: "Error",
        message: validationError,
        color: "red",
      });
      return;
    }

    if (projects.includes(newProjectName)) {
      notifications.show({
        title: "Error",
        message: "Project name already exists",
        color: "red",
      });
      return;
    }

    // Update local state
    setProjects([...projects, newProjectName].sort());
    setNewProjectName("");
    
    // Update store with new project
    const updatedProjects = [...(store.projects || []), newProjectName];
    const updatedStore = { ...store, projects: updatedProjects };
    
    storeActions
      .updateStoreInDB(updatedStore)
      .then(setStoreProperties)
      .then(() => {
        storeActions.refreshContentStore(tab.id);
        
        notifications.show({
          title: "Project Created",
          message: `Project "${newProjectName}" has been created`,
        });
      })
      .catch((error) => {
        console.error(error);
        notifications.show({
          title: "Error",
          message: "Failed to create project",
          color: "red",
        });
      });
  };

  // Handle renaming a project
  const handleRenameProject = () => {
    if (!editingProject) return;
    
    if (!editingProject.new.trim()) {
      notifications.show({
        title: "Error",
        message: "Project name cannot be empty",
        color: "red",
      });
      return;
    }

    const validationError = validateProject(editingProject.new);
    if (validationError) {
      notifications.show({
        title: "Error",
        message: validationError,
        color: "red",
      });
      return;
    }

    if (projects.includes(editingProject.new) && editingProject.original !== editingProject.new) {
      notifications.show({
        title: "Error",
        message: "Project name already exists",
        color: "red",
      });
      return;
    }

    // Update all mocks with the old project name
    const updatedMocks = store.mocks.map(mock => {
      if (mock.project === editingProject.original) {
        return { ...mock, project: editingProject.new };
      }
      return mock;
    });

    // Update projects in the store
    const updatedProjects = (store.projects || [])
      .map(project => project === editingProject.original ? editingProject.new : project);

    const updatedStore = { 
      ...store, 
      mocks: updatedMocks,
      projects: updatedProjects
    };

    storeActions
      .updateStoreInDB(updatedStore)
      .then(setStoreProperties)
      .then(() => {
        storeActions.refreshContentStore(tab.id);
        
        // Create a new array with the renamed project
        const updatedProjectsArray = projects
          .filter(p => p !== editingProject.original) // Remove the original project
          .concat(editingProject.new) // Add the new project name
          .sort(); // Sort the array
        
        setProjects(updatedProjectsArray);
        setEditingProject(null);
        
        notifications.show({
          title: "Project Renamed",
          message: `Project "${editingProject.original}" has been renamed to "${editingProject.new}"`,
        });
      })
      .catch((error) => {
        console.error(error);
        notifications.show({
          title: "Error",
          message: "Failed to rename project",
          color: "red",
        });
      });
  };

  // Handle deleting a project
  const handleDeleteProject = () => {
    if (!projectToDelete) return;

    // Update all mocks with the project to be deleted
    const updatedMocks = store.mocks.map(mock => {
      if (mock.project === projectToDelete) {
        const { project, ...rest } = mock;
        return { ...rest, project: undefined };
      }
      return mock;
    });

    // Remove project from the store's projects array
    const updatedProjects = (store.projects || [])
      .filter(project => project !== projectToDelete);

    const updatedStore = { 
      ...store, 
      mocks: updatedMocks,
      projects: updatedProjects
    };

    storeActions
      .updateStoreInDB(updatedStore)
      .then(setStoreProperties)
      .then(() => {
        storeActions.refreshContentStore(tab.id);
        
        // Create a new array without the deleted project
        setProjects(updatedProjects);
        setProjectToDelete(null);
        setIsDeleteModalOpen(false);
        
        notifications.show({
          title: "Project Deleted",
          message: `Project "${projectToDelete}" has been deleted`,
        });
      })
      .catch((error) => {
        console.error(error);
        notifications.show({
          title: "Error",
          message: "Failed to delete project",
          color: "red",
        });
      });
  };

  return (
    <Container size="xl" p="md">
      <Title order={2} mb="md">Projects</Title>
      
      {/* Create new project */}
      <Card shadow="sm" p="md" mb="xl">
        <Title order={4} mb="md">Create New Project</Title>
        <Flex gap="md" align="flex-end">
          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button 
            leftIcon={<MdAdd />} 
            onClick={handleCreateProject}
          >
            Create Project
          </Button>
        </Flex>
      </Card>
      
      {/* List of projects */}
      <Card shadow="sm" p="md">
        <Title order={4} mb="md">Existing Projects</Title>
        
        {projects.length === 0 ? (
          <Text color="dimmed">No projects created yet.</Text>
        ) : (
          <Box>
            {projects.map((project) => (
              <Flex 
                key={project} 
                justify="space-between" 
                align="center" 
                p="sm" 
                mb="xs"
                style={{ 
                  borderRadius: 4,
                  backgroundColor: editingProject?.original === project ? '#f0f0f0' : 'transparent'
                }}
              >
                {editingProject?.original === project ? (
                  <Flex gap="md" style={{ flex: 1 }}>
                    <TextInput
                      value={editingProject.new}
                      onChange={(e) => setEditingProject({ ...editingProject, new: e.target.value })}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <Button onClick={handleRenameProject}>Save</Button>
                    <Button variant="subtle" onClick={() => setEditingProject(null)}>Cancel</Button>
                  </Flex>
                ) : (
                  <>
                    <Badge size="lg" color="blue">{project}</Badge>
                    <Group spacing="xs">
                      <ActionIcon 
                        color="blue" 
                        onClick={() => setEditingProject({ original: project, new: project })}
                      >
                        <MdEdit />
                      </ActionIcon>
                      <ActionIcon 
                        color="red" 
                        onClick={() => {
                          setProjectToDelete(project);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <MdDelete />
                      </ActionIcon>
                    </Group>
                  </>
                )}
              </Flex>
            ))}
          </Box>
        )}
      </Card>
      
      {/* Delete confirmation modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <Text mb="md">
          Are you sure you want to delete the project "{projectToDelete}"? 
          This will remove the project from all mocks that use it.
        </Text>
        <Flex justify="flex-end" gap="md">
          <Button variant="subtle" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteProject}>
            Delete
          </Button>
        </Flex>
      </Modal>
    </Container>
  );
}; 