import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  FileInput,
  Flex,
  Group,
  Input,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useChromeStore, useChromeStoreState } from "../store";
import { shallow } from "zustand/shallow";
import { IMockResponse } from "@mokku/types";
import { storeActions } from "../service/storeActions";
import { useGlobalStore } from "../store";

const useMockStoreSelector = (state: useChromeStoreState) => ({
  store: state.store,
  setStoreProperties: state.setStoreProperties,
});

export const ImportExport = () => {
  const theme = useMantineTheme();
  const { store, setStoreProperties } = useChromeStore(
    useMockStoreSelector,
    shallow
  );
  const tab = useGlobalStore((state) => state.meta.tab);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportLinkRef = useRef<HTMLAnchorElement>(null);

  const handleImportFromFile = async () => {
    if (!importFile) {
      notifications.show({
        title: "No file selected",
        message: "Please select a JSON file to import",
        color: "red",
      });
      return;
    }

    setIsImporting(true);
    try {
      const fileContent = await importFile.text();
      await processImport(fileContent);
    } catch (error) {
      notifications.show({
        title: "Import failed",
        message: `Error importing mocks: ${error.message}`,
        color: "red",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl) {
      notifications.show({
        title: "No URL provided",
        message: "Please enter a URL to import from",
        color: "red",
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(importUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.text();
      await processImport(data);
    } catch (error) {
      notifications.show({
        title: "Import failed",
        message: `Error importing mocks from URL: ${error.message}`,
        color: "red",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const processImport = async (jsonContent: string) => {
    try {
      const importedMocks = JSON.parse(jsonContent);
      
      if (!Array.isArray(importedMocks)) {
        throw new Error("Imported data is not a valid array of mocks");
      }

      // Validate each mock
      importedMocks.forEach((mock, index) => {
        if (!mock.id || !mock.url || !mock.method || mock.status === undefined) {
          throw new Error(`Mock at index ${index} is missing required fields`);
        }
      });

      // Create a map of existing mocks for easy lookup
      const existingMocksMap = new Map(
        store.mocks.map(mock => [
          `${mock.name}-${mock.url}-${mock.status}`,
          mock
        ])
      );

      // Process imported mocks, replacing existing ones with the same key
      let updatedMocks = [...store.mocks];
      
      // First, remove any mocks that will be replaced
      importedMocks.forEach((importedMock: IMockResponse) => {
        const key = `${importedMock.name}-${importedMock.url}-${importedMock.status}`;
        updatedMocks = updatedMocks.filter(
          mock => `${mock.name}-${mock.url}-${mock.status}` !== key
        );
      });
      
      // Then add all imported mocks
      updatedMocks = [...updatedMocks, ...importedMocks];
      
      // Use the storeActions to update the store
      const updatedStore = {
        ...store,
        mocks: updatedMocks
      };
      
      const result = await storeActions.updateStoreInDB(updatedStore);
      setStoreProperties(result);
      
      notifications.show({
        title: "Import successful",
        message: `Successfully imported ${importedMocks.length} mocks`,
        color: "green",
      });

      // Refresh the content store
      storeActions.refreshContentStore(tab?.id);
      
      // Auto reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      throw new Error(`Failed to process import: ${error.message}`);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const mocksJson = JSON.stringify(store.mocks, null, 2);
      const blob = new Blob([mocksJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger it
      const downloadLink = exportLinkRef.current;
      if (downloadLink) {
        downloadLink.href = url;
        downloadLink.download = "mokku-mocks-export.json";
        downloadLink.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      notifications.show({
        title: "Export successful",
        message: `Successfully exported ${store.mocks.length} mocks`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Export failed",
        message: `Error exporting mocks: ${error.message}`,
        color: "red",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="md">Import & Export Mocks</Title>
      
      <Flex gap="xl" direction={{ base: 'column', md: 'row' }}>
        {/* Import Section */}
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ flex: 1 }}>
          <Title order={3} mb="md">Import Mocks</Title>
          
          <Box mb="lg">
            <Text weight={500} mb="xs">Import from File</Text>
            <Group position="apart">
              <FileInput
                placeholder="Select JSON file"
                value={importFile}
                onChange={setImportFile}
                accept=".json"
                style={{ flex: 1 }}
                error={importFile && !importFile.name.endsWith('.json') ? "Only JSON files are allowed" : null}
              />
              <Button 
                onClick={handleImportFromFile} 
                loading={isImporting}
                disabled={!importFile || !importFile.name.endsWith('.json')}
              >
                Import
              </Button>
            </Group>
          </Box>
          
          <Divider my="md" />
          
          <Box>
            <Text weight={500} mb="xs">Import from URL</Text>
            <Group position="apart">
              <Input
                placeholder="Enter URL to JSON file"
                value={importUrl}
                onChange={(e) => setImportUrl(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={handleImportFromUrl} 
                loading={isImporting}
                disabled={!importUrl}
              >
                Import
              </Button>
            </Group>
          </Box>
        </Card>
        
        {/* Export Section */}
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ flex: 1 }}>
          <Title order={3} mb="md">Export Mocks</Title>
          <Text mb="lg">
            Export all {store.mocks.length} mocks to a JSON file.
          </Text>
          
          <Button 
            onClick={handleExport} 
            loading={isExporting}
            disabled={store.mocks.length === 0}
            fullWidth
          >
            Export All Mocks
          </Button>
          
          {/* Hidden download link for export */}
          <a 
            ref={exportLinkRef} 
            style={{ display: 'none' }} 
            download="mokku-mocks-export.json"
          />
        </Card>
      </Flex>
    </Container>
  );
}; 