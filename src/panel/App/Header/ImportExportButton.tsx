import React from "react";
import { MdImportExport } from "react-icons/md";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useGlobalStore, ViewEnum } from "../store";

export const ImportExportButton = () => {
  const view = useGlobalStore((state) => state.view);
  const setView = useGlobalStore((state) => state.setView);
  
  const isActive = view === ViewEnum.IMPORT_EXPORT;
  
  return (
    <Tooltip label="Import/Export Mocks">
      <ActionIcon
        variant="outline"
        color={isActive ? "green" : "blue"}
        onClick={() => {
          if (isActive) {
            setView(ViewEnum.MOCKS);
          } else {
            setView(ViewEnum.IMPORT_EXPORT);
          }
        }}
        title="Import/Export Mocks"
      >
        <MdImportExport />
      </ActionIcon>
    </Tooltip>
  );
}; 