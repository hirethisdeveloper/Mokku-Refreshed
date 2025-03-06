import {
  Button,
  Card,
  createStyles,
  Flex,
  SegmentedControl,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  JsonInput,
  MultiSelect,
  Select,
  Badge,
  Group,
} from "@mantine/core";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { SideDrawerHeader } from "../../Blocks/SideDrawer";
import {
  IMockResponseRaw,
  IMockResponse,
  MethodEnum,
  MockStatusEnum,
} from "../../types";
import { useForm } from "@mantine/form";
import { MdClose, MdDeleteOutline } from "react-icons/md";
import { storeActions } from "../../service/storeActions";
import { useChromeStoreState } from "../../store/useMockStore";
import { notifications } from "@mantine/notifications";
import { useGlobalStore } from "../../store/useGlobalStore";
import { isJsonValid } from "./utils";

const useStyles = createStyles((theme) => ({
  flexGrow: {
    flexGrow: 2,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    padding: "0 !important",
    height: "100%",
    borderRadius: 0,
  },
  wrapper: {
    padding: 12,
    height: "100%",
    overflow: "auto",
    paddingTop: 0,
  },
  tabs: {
    flexGrow: 2,
    display: "flex",
    flexDirection: "column",
  },
  footer: {
    padding: 12,
    borderTop: `1px solid ${theme.colors.gray[2]}`,
  },
}));

export const AddMockForm = ({
  store,
  selectedMock,
  setSelectedMock,
  setStoreProperties,
}: Pick<
  useChromeStoreState,
  "store" | "selectedMock" | "setSelectedMock" | "setStoreProperties"
>) => {
  const {
    classes: { flexGrow, wrapper, tabs, footer, card },
  } = useStyles();
  const tab = useGlobalStore((state) => state.meta.tab);

  // Get all unique tags from existing mocks
  const existingTags = React.useMemo(() => {
    const allTags = [];
    store.mocks.forEach(mock => {
      if (mock.tags && mock.tags.length > 0) {
        mock.tags.forEach(tag => allTags.push(tag));
      }
    });
    return [...new Set(allTags)];
  }, [store.mocks]);

  // Get all unique projects from existing mocks
  const existingProjects = React.useMemo(() => {
    const allProjects = [];
    store.mocks.forEach(mock => {
      if (mock.project) {
        allProjects.push(mock.project);
      }
    });
    return [...new Set(allProjects)];
  }, [store.mocks]);

  // Convert existing tags to MultiSelect data format
  const [tagData, setTagData] = React.useState(() => 
    existingTags.map(tag => ({ value: tag, label: tag }))
  );

  // Convert existing projects to Select data format
  const [projectData, setProjectData] = React.useState<Array<{ value: string; label: string }>>(() => {
    // Get all projects from mocks
    const allProjects = [];
    store.mocks.forEach(mock => {
      if (mock.project && mock.project.trim() !== '') {
        allProjects.push(mock.project);
      }
    });
    
    // Deduplicate projects
    const uniqueProjects = [...new Set(allProjects)].sort();
    
    // Format projects for the Select component
    return uniqueProjects.map(project => ({ 
      value: project, 
      label: project 
    }));
  });

  // Update tag data when existingTags changes
  React.useEffect(() => {
    setTagData(existingTags.map(tag => ({ value: tag, label: tag })));
  }, [existingTags]);

  // Update project data when existingProjects changes
  React.useEffect(() => {
    setProjectData(existingProjects.map(project => ({ value: project, label: project })));
  }, [existingProjects]);

  // Function to refresh project data from all mocks
  const refreshProjectData = React.useCallback(() => {
    // Get all projects from mocks
    const allProjects = [];
    
    // Extract all projects from mocks
    store.mocks.forEach(mock => {
      if (mock.project && mock.project.trim() !== '') {
        allProjects.push(mock.project);
      }
    });
    
    // Deduplicate projects
    const uniqueProjects = [...new Set(allProjects)].sort();
    
    // Format projects for the Select component
    const formattedProjects = uniqueProjects.map(project => ({ 
      value: project, 
      label: project 
    }));
    
    // Update the state
    setProjectData([...formattedProjects]);
  }, [store.mocks]);

  // Refresh project data when component mounts
  React.useEffect(() => {
    refreshProjectData();
  }, [refreshProjectData]);

  const form = useForm<IMockResponseRaw>({
    initialValues: {
      headers: [],
      status: 200,
      delay: 500,
      method: "GET",
      active: true,
      tags: [],
      project: "",
      ...selectedMock,
    },
  });

  // Ensure form.values.tags is always an array
  React.useEffect(() => {
    if (!form.values.tags) {
      form.setFieldValue('tags', []);
    }
  }, [form.values.tags]);

  const isNewMock = !selectedMock.id;
  const response = form.values["response"];
  const jsonValid = response ? isJsonValid(response) : true;

  // Validate tags to not contain special characters
  const validateTag = (tag: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(tag) ? null : 'Tags cannot contain special characters';
  };

  // Validate project to not contain special characters
  const validateProject = (project: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(project) ? null : 'Project cannot contain special characters';
  };

  // Log form values for debugging
  React.useEffect(() => {
    console.log('Form values:', form.values);
  }, [form.values]);

  return (
    <form
      style={{ height: "100%" }}
      onSubmit={form.onSubmit((values) => {
        console.log(899, values);
        if (!values.id) {
          values.id = uuidv4();
        }
        try {
          values.status = parseInt(values.status as any);
        } catch (e) {
          values.status = 200;
        }
        const updatedStore = isNewMock
          ? storeActions.addMocks(store, values as IMockResponse)
          : storeActions.updateMocks(store, values as IMockResponse);
        storeActions
          .updateStoreInDB(updatedStore)
          .then(setStoreProperties)
          .then(() => {
            storeActions.refreshContentStore(tab.id);
            setSelectedMock();
            notifications.show({
              title: `${values.name} mock ${isNewMock ? "added" : "updated"}`,
              message: `Mock "${values.name}" has been ${
                isNewMock ? "added" : "updated"
              }.`,
            });
          })
          .catch(() => {
            notifications.show({
              title: `Cannot ${isNewMock ? "add" : "update"} mock.`,
              message: `Something went wrong, unable to ${
                isNewMock ? "add" : "update"
              } new mock.`,
              color: "red",
            });
          });
      })}
    >
      <>
        <Card className={card}>
          <SideDrawerHeader>
            <Title order={6}>{isNewMock ? "Add Mock" : "Update Mock"}</Title>
            <MdClose
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedMock()}
            />
          </SideDrawerHeader>
          <Flex direction="column" gap={16} className={wrapper}>
            <Flex gap={12} align="center">
              <Flex direction="column">
                <Text fw={500} fz="sm">
                  Status
                </Text>
                <SegmentedControl
                  value={
                    form.values.active
                      ? MockStatusEnum.ACTIVE
                      : MockStatusEnum.INACTIVE
                  }
                  onChange={(value) =>
                    form.setFieldValue(
                      "active",
                      value === MockStatusEnum.ACTIVE,
                    )
                  }
                  size="xs"
                  data={[
                    { label: "Active", value: MockStatusEnum.ACTIVE },
                    { label: "Inactive", value: MockStatusEnum.INACTIVE },
                  ]}
                />
              </Flex>
              <TextInput
                required
                label="Name"
                placeholder="Goals Success"
                className={flexGrow}
                {...form.getInputProps("name")}
              />
            </Flex>
            <Flex gap={12} align="center">
              <Textarea
                className={flexGrow}
                label="Description"
                placeholder="Success case for goals API"
                {...form.getInputProps("description")}
              />
            </Flex>
            <Flex gap={12} align="center">
              <MultiSelect
                className={flexGrow}
                label="Tags"
                placeholder="Add tags"
                data={tagData}
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
                  return null;
                }}
                value={form.values.tags || []}
                onChange={(value) => form.setFieldValue('tags', value)}
              />
            </Flex>
            <Flex gap={12} align="center">
              <Flex direction="column" className={flexGrow}>
                <Text size="sm" weight={500} mb={4}>Project</Text>
                <Flex direction="column" gap={8}>
                  {form.values.project ? (
                    <Group spacing={4} mb={8}>
                      <Badge size="md" variant="filled" color="blue" styles={{
                        root: {
                          paddingRight: 8
                        }
                      }}>
                        {form.values.project}
                        <span 
                          style={{ marginLeft: 8, cursor: 'pointer' }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setFieldValue('project', '');
                          }}
                        >
                          ×
                        </span>
                      </Badge>
                    </Group>
                  ) : (
                    <Select
                      key={`project-select-${projectData.length}`}
                      placeholder="Add project"
                      data={projectData.length > 0 ? projectData : []}
                      searchable
                      clearable
                      creatable
                      dropdownPosition="bottom"
                      maxDropdownHeight={200}
                      nothingFound="No projects found"
                      onFocus={() => {
                        refreshProjectData();
                      }}
                      getCreateLabel={(query) => `+ Create ${query}`}
                      onCreate={(query) => {
                        const isValid = validateProject(query);
                        if (isValid === null) {
                          // Check if project already exists
                          if (!projectData.some(p => p.value === query)) {
                            const newItem = { value: query, label: query };
                            setProjectData(prev => [...prev, newItem]);
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
                      value=""
                      onChange={(value) => form.setFieldValue('project', value)}
                    />
                  )}
                </Flex>
              </Flex>
            </Flex>
            <Flex gap={12} align="center">
              <TextInput
                className={flexGrow}
                label="URL"
                required
                placeholder="https://api.awesomeapp.com/goals"
                {...form.getInputProps("url")}
              />
            </Flex>
            <Flex gap={12} align="center">
              <Flex direction="column">
                <Text>Method</Text>
                <SegmentedControl
                  value={form.values.method}
                  onChange={(value) =>
                    form.setFieldValue("method", value as MethodEnum)
                  }
                  size="xs"
                  data={[
                    { label: "GET", value: MethodEnum.GET },
                    { label: "POST", value: MethodEnum.POST },
                    { label: "PUT", value: MethodEnum.PUT },
                    { label: "PATCH", value: MethodEnum.PATCH },
                    { label: "DELETE", value: MethodEnum.DELETE },
                  ]}
                />
              </Flex>
              <TextInput
                required
                label="Status"
                type="number"
                placeholder="200"
                {...form.getInputProps("status")}
              />
              <TextInput
                required
                label="Delay (ms)"
                placeholder="500"
                type="number"
                {...form.getInputProps("delay")}
              />
            </Flex>
            <Flex className={flexGrow}>
              <Tabs defaultValue="body" className={tabs}>
                <Tabs.List>
                  <Tabs.Tab value="body">Response Body</Tabs.Tab>
                  <Tabs.Tab value="headers">Response Headers</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="body" pt="xs" className={flexGrow}>
                  <JsonInput
                    placeholder="Response, this will auto resize. You can leave this empty or enter a valid JSON"
                    formatOnBlur
                    autosize
                    minRows={4}
                    {...form.getInputProps("response")}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="headers" pt="xs">
                  <Button
                    variant="subtle"
                    style={{ marginBottom: 8 }}
                    onClick={() => {
                      form.insertListItem(
                        "headers",
                        {
                          name: "",
                          value: "",
                        },
                        0,
                      );
                    }}
                  >
                    + Add Header
                  </Button>
                  <Flex gap={8} direction="column">
                    {form.values.headers?.map((_, index) => (
                      <Flex gap={12} align="center" key={index}>
                        <TextInput
                          required
                          placeholder="Name"
                          className={flexGrow}
                          {...form.getInputProps(`headers.${index}.name`)}
                        />
                        <TextInput
                          required
                          placeholder="Value"
                          className={flexGrow}
                          {...form.getInputProps(`headers.${index}.value`)}
                        />
                        <MdDeleteOutline
                          onClick={() => {
                            form.removeListItem("headers", index);
                          }}
                        />
                      </Flex>
                    ))}
                  </Flex>
                </Tabs.Panel>
              </Tabs>
            </Flex>
          </Flex>
          <Flex className={footer} justify="space-between">
            <Text color="red">
              {jsonValid ? "" : "Response JSON not valid"}
            </Text>
            <Flex justify="flex-end" gap={4}>
              <Button
                color="red"
                compact
                onClick={() => setSelectedMock(undefined)}
              >
                Close
              </Button>
              <Button compact type="submit" disabled={!jsonValid}>
                {isNewMock ? "Add Mock" : "Update Mock"}
              </Button>
            </Flex>
          </Flex>
        </Card>
      </>
    </form>
  );
};
