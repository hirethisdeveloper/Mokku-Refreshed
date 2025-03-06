import React, { useEffect, useState } from "react";
import { Select } from "@mantine/core";
import { useGlobalStore } from "../../store";
import { useChromeStore } from "../../store/useMockStore";
import { shallow } from "zustand/shallow";

export const ProjectFilterButton = () => {
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const projectFilter = useGlobalStore((state) => state.projectFilter);
  const setProjectFilter = useGlobalStore((state) => state.setProjectFilter);
  const store = useChromeStore((state) => state.store);

  // Load all available projects
  useEffect(() => {
    const allProjects = [];
    
    // Get projects from mocks
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
    
    // Deduplicate and sort projects
    const uniqueProjects = [...new Set(allProjects)].sort();
    
    // Create options for the Select component
    const options = [
      { value: '', label: 'All projects' },
      ...uniqueProjects.map(project => ({ value: project, label: project }))
    ];
    
    setProjectOptions(options);
  }, [store.mocks, store.projects]);

  return (
    <Select
      placeholder="Filter by project"
      data={projectOptions}
      value={projectFilter || ''}
      onChange={(value) => setProjectFilter(value === '' ? null : value)}
      clearable={false}
      style={{ width: 180 }}
      size="xs"
    />
  );
}; 