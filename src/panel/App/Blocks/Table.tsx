import React from "react";
import { createStyles, Table } from "@mantine/core";

export type TableSchema<T> = Array<{
  header: string;
  content: (data: T) => React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  sortKey?: keyof T;
}>;

export interface TableWrapperProps<T> {
  schema: TableSchema<T>;
  data: T[];
  onRowClick?: (data: T) => void;
  selectedRowId?: number | string;
  onSort?: (sortKey: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

const useStyles = createStyles((theme) => ({
  selectedRow: {
    background: `${theme.colors[theme.primaryColor][3]} !important`,
    ...(theme.colorScheme === "dark"
      ? {
          color: theme.black,
        }
      : {}),
    "&:hover": {
      background: `${theme.colors[theme.primaryColor][3]} !important`,
      ...(theme.colorScheme === "dark"
        ? {
            color: theme.black,
          }
        : {}),
    },
  },
  rows: {
    "&:hover": {
      cursor: "pointer",
    },
  },
  th: {
    background:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    position: "sticky",
    top: 0,
    borderBottom: "1px solid black",
  },
}));

export const TableWrapper = <T extends unknown & { id: string | number }>({
  schema,
  data,
  onRowClick,
  selectedRowId,
  onSort,
  sortKey,
  sortDirection,
}: TableWrapperProps<T>) => {
  const { classes } = useStyles();

  const handleHeaderClick = (header: TableSchema<T>[0]) => {
    if (!header.sortKey || !onSort) return;
    
    const newDirection = 
      sortKey === header.sortKey && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(header.sortKey, newDirection);
  };

  const ths = (
    <tr>
      {schema.map(({ header, minWidth, maxWidth, width, sortKey: headerSortKey }, index) => (
        <th
          style={{ 
            minWidth, 
            maxWidth, 
            width,
            cursor: headerSortKey ? 'pointer' : 'default'
          }}
          key={index}
          className={classes.th}
          onClick={() => handleHeaderClick(schema[index])}
        >
          {header}
          {headerSortKey && sortKey === headerSortKey && (
            <span style={{ marginLeft: '5px' }}>
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </th>
      ))}
    </tr>
  );

  const rows = data.map((row, index) => (
    <tr
      key={`row-${index}`}
      onClick={() => {
        onRowClick(row);
      }}
      className={`${selectedRowId === row.id ? classes.selectedRow : ""} ${
        classes.rows
      }`}
    >
      {schema.map(({ content }, index) => (
        <td key={index}>{content(row)}</td>
      ))}
    </tr>
  ));

  return (
    <Table
      captionSide="bottom"
      striped
      highlightOnHover
      withColumnBorders
      style={{ position: "relative" }}
    >
      <thead>{ths}</thead>
      <tbody>{rows}</tbody>
    </Table>
  );
};
