import React from "react";
import { MdFilterAlt } from "react-icons/md";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useGlobalStore } from "../store/useGlobalStore";
import { notifications } from "@mantine/notifications";

export const FilterNon200Button = () => {
  const filterNon200 = useGlobalStore((state) => state.filterNon200);
  const toggleFilterNon200 = useGlobalStore((state) => state.toggleFilterNon200);
  
  return (
    <Tooltip label="Filter non-200 status codes">
      <ActionIcon
        variant="outline"
        color={filterNon200 ? "orange" : "blue"}
        onClick={() => {
          if (filterNon200) {
            notifications.show({
              title: "Filter disabled",
              message: "Showing all mocks",
            });
          } else {
            notifications.show({
              title: "Filter enabled",
              message: "Showing only mocks with non-200 status codes",
            });
          }
          toggleFilterNon200();
        }}
        title="Filter non-200 status codes"
      >
        <MdFilterAlt />
      </ActionIcon>
    </Tooltip>
  );
}; 