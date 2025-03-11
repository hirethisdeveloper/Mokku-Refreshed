import React from "react";
import { createStyles, Table } from "@mantine/core";

export type TableSchema<T> = Array<{
  header: string | React.ReactNode;
  content: (data: T) => React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  sortKey?: keyof T;
  testId?: string;
}>;

export interface TableWrapperProps<T> {
  schema: TableSchema<T>;
  data: T[];
  onRowClick?: (data: T) => void;
  selectedRowId?: number | string;
  onSort?: (sortKey: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onContextMenu?: (event: React.MouseEvent, data: T) => void;
  "data-testid"?: string;
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
      cursor: "default",
    },
  },
  th: {
    background:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    position: "sticky",
    top: 0,
    borderBottom: "1px solid black"
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
  onContextMenu,
  "data-testid": dataTestId = "table-wrapper",
  ...props
}: TableWrapperProps<T>) => {
  const { classes } = useStyles();

  const handleHeaderClick = (header: TableSchema<T>[0]) => {
    if (!header.sortKey || !onSort) return;
    
    const newDirection = 
      sortKey === header.sortKey && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(header.sortKey, newDirection);
  };

  const ths = (
    <tr data-testid="table-header-row">
      {schema.map(({ header, minWidth, maxWidth, width, sortKey: headerSortKey, testId }, index) => (
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
          data-testid={testId || `table-header-cell-${index}`}
        >
          {header}
          {headerSortKey && sortKey === headerSortKey && (
            <span style={{ marginLeft: '5px' }} data-testid={`sort-indicator-${headerSortKey.toString()}`}>
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
        if (onRowClick) {
          onRowClick(row);
        }
      }}
      onContextMenu={(event) => {
        if (onContextMenu) {
          onContextMenu(event, row);
        }
      }}
      className={`${selectedRowId === row.id ? classes.selectedRow : ""} ${
        classes.rows
      }`}
      data-testid={`table-row-${index}`}
      data-row-id={row.id}
    >
      {schema.map(({ content, testId }, cellIndex) => (
        <td key={cellIndex} data-testid={`table-cell-${index}-${cellIndex}`}>
          {content(row)}
        </td>
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
      data-testid={dataTestId}
      {...props}
    >
      <thead data-testid="table-header">{ths}</thead>
      <tbody data-testid="table-body">{rows}</tbody>
    </Table>
  );
};
