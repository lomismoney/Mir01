"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
      data-oid="9y425kq"
    >
      <IconGripVertical
        className="text-muted-foreground size-3"
        data-oid="v.d.k.f"
      />

      <span className="sr-only" data-oid="ou97b3x">
        Drag to reorder
      </span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} data-oid="13bz7pt" />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center" data-oid="0u61hke">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          data-oid="8._-jp1"
        />
      </div>
    ),

    cell: ({ row }) => (
      <div className="flex items-center justify-center" data-oid="sntlb1s">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          data-oid="za19:j8"
        />
      </div>
    ),

    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} data-oid="_:y2rbx" />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <div className="w-32" data-oid="pwn5t74">
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5"
          data-oid="zdm6rr8"
        >
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="text-muted-foreground px-1.5"
        data-oid="v1bu-nk"
      >
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled
            className="fill-green-500 dark:fill-green-400"
            data-oid="gguthn0"
          />
        ) : (
          <IconLoader data-oid="w-p7u95" />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => (
      <div className="w-full text-right" data-oid=":3fit68">
        Target
      </div>
    ),

    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          });
        }}
        data-oid="3fewnpt"
      >
        <Label
          htmlFor={`${row.original.id}-target`}
          className="sr-only"
          data-oid="33:qvt2"
        >
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
          data-oid="b11ec7j"
        />
      </form>
    ),
  },
  {
    accessorKey: "limit",
    header: () => (
      <div className="w-full text-right" data-oid="pmf4:_w">
        Limit
      </div>
    ),

    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          });
        }}
        data-oid="ln0iozl"
      >
        <Label
          htmlFor={`${row.original.id}-limit`}
          className="sr-only"
          data-oid="zqbq7g_"
        >
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
          data-oid="nr5dtl5"
        />
      </form>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer";

      if (isAssigned) {
        return row.original.reviewer;
      }

      return (
        <>
          <Label
            htmlFor={`${row.original.id}-reviewer`}
            className="sr-only"
            data-oid="6h_ox5e"
          >
            Reviewer
          </Label>
          <Select data-oid="nlzfg8d">
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
              data-oid="ikbr6em"
            >
              <SelectValue placeholder="Assign reviewer" data-oid="kimphaz" />
            </SelectTrigger>
            <SelectContent align="end" data-oid="o_pdmuz">
              <SelectItem value="Eddie Lake" data-oid="qxk53pb">
                Eddie Lake
              </SelectItem>
              <SelectItem value="Jamik Tashpulatov" data-oid="frxvnrt">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu data-oid="bwcfstp">
        <DropdownMenuTrigger asChild data-oid="o-lcn7d">
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
            data-oid="qne8v_3"
          >
            <IconDotsVertical data-oid="2c:0hhi" />
            <span className="sr-only" data-oid="62t5qmg">
              Open menu
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32" data-oid="dcar28d">
          <DropdownMenuItem data-oid="013yyru">Edit</DropdownMenuItem>
          <DropdownMenuItem data-oid="3yk2hq:">Make a copy</DropdownMenuItem>
          <DropdownMenuItem data-oid="zt29_h0">Favorite</DropdownMenuItem>
          <DropdownMenuSeparator data-oid="sqvvgof" />
          <DropdownMenuItem variant="destructive" data-oid="aut7rhs">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      data-oid="19mnhum"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} data-oid="k9u:vkt">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
      data-oid="044ozbw"
    >
      <div
        className="flex items-center justify-between px-4 lg:px-6"
        data-oid="l9j8upn"
      >
        <Label htmlFor="view-selector" className="sr-only" data-oid="r9z9.wa">
          View
        </Label>
        <Select defaultValue="outline" data-oid="s5xc9ew">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
            data-oid="mibebsv"
          >
            <SelectValue placeholder="Select a view" data-oid="ha1nzy_" />
          </SelectTrigger>
          <SelectContent data-oid="u.95_r0">
            <SelectItem value="outline" data-oid=":7an3w:">
              Outline
            </SelectItem>
            <SelectItem value="past-performance" data-oid="jm6r0i_">
              Past Performance
            </SelectItem>
            <SelectItem value="key-personnel" data-oid="zu:bvb_">
              Key Personnel
            </SelectItem>
            <SelectItem value="focus-documents" data-oid="ylcs084">
              Focus Documents
            </SelectItem>
          </SelectContent>
        </Select>
        <TabsList
          className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex"
          data-oid=":8eb7q5"
        >
          <TabsTrigger value="outline" data-oid="df5af4l">
            Outline
          </TabsTrigger>
          <TabsTrigger value="past-performance" data-oid="5x8vvgt">
            Past Performance{" "}
            <Badge variant="secondary" data-oid="hfoklhq">
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel" data-oid="wn2s5vh">
            Key Personnel{" "}
            <Badge variant="secondary" data-oid="36g8hl3">
              2
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents" data-oid="nrj708f">
            Focus Documents
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2" data-oid="j8:k:f-">
          <DropdownMenu data-oid="2ug6myz">
            <DropdownMenuTrigger asChild data-oid="hbtjtgd">
              <Button variant="outline" size="sm" data-oid=".yilskd">
                <IconLayoutColumns data-oid="xfopehb" />
                <span className="hidden lg:inline" data-oid=":248-yi">
                  Customize Columns
                </span>
                <span className="lg:hidden" data-oid="9afekuf">
                  Columns
                </span>
                <IconChevronDown data-oid="wiyf137" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              data-oid="njkmhm8"
            >
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      data-oid="fregrte"
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" data-oid="9-ljo3n">
            <IconPlus data-oid="cjyg0pn" />
            <span className="hidden lg:inline" data-oid="b-qhr9b">
              Add Section
            </span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        data-oid="74ia9yi"
      >
        <div className="overflow-hidden rounded-lg border" data-oid="ivxzc_x">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
            data-oid="v74048n"
          >
            <Table data-oid="wcf-2te">
              <TableHeader
                className="bg-muted sticky top-0 z-10"
                data-oid="ee_gah0"
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b hover:bg-transparent"
                    data-oid="e4s93ls"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="13bd-14"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody
                className="**:data-[slot=table-cell]:first:w-8"
                data-oid=":xxc1ll"
              >
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                    data-oid=".dks1dp"
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} data-oid="k.jkdix" />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow data-oid="cckd-y.">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                      data-oid="j1h6tu:"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div
          className="flex items-center justify-between px-4"
          data-oid="2cztisa"
        >
          <div
            className="text-muted-foreground hidden flex-1 text-sm lg:flex"
            data-oid="gk16cw3"
          >
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div
            className="flex w-full items-center gap-8 lg:w-fit"
            data-oid="xlqd-3v"
          >
            <div
              className="hidden items-center gap-2 lg:flex"
              data-oid=":jjsk3n"
            >
              <Label
                htmlFor="rows-per-page"
                className="text-sm font-medium"
                data-oid="2ftu3g1"
              >
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
                data-oid="f2pqv5e"
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  id="rows-per-page"
                  data-oid="0thy5y:"
                >
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                    data-oid="2-ruxe8"
                  />
                </SelectTrigger>
                <SelectContent side="top" data-oid="mvxk83-">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem
                      key={pageSize}
                      value={`${pageSize}`}
                      data-oid="4_aqgbn"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="flex w-fit items-center justify-center text-sm font-medium"
              data-oid="pf1w:1s"
            >
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div
              className="ml-auto flex items-center gap-2 lg:ml-0"
              data-oid="x42ih:e"
            >
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                data-oid="nkrmrak"
              >
                <span className="sr-only" data-oid="o329ptf">
                  Go to first page
                </span>
                <IconChevronsLeft data-oid="dv4nt-7" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                data-oid="x:hv9lw"
              >
                <span className="sr-only" data-oid="3ohofvr">
                  Go to previous page
                </span>
                <IconChevronLeft data-oid="in:pcz_" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                data-oid="qxb660m"
              >
                <span className="sr-only" data-oid="o0peg85">
                  Go to next page
                </span>
                <IconChevronRight data-oid="er67q4-" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                data-oid="fold42u"
              >
                <span className="sr-only" data-oid="o0xmztj">
                  Go to last page
                </span>
                <IconChevronsRight data-oid="s9fqmu7" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
        data-oid="y.me1zj"
      >
        <div
          className="aspect-video w-full flex-1 rounded-lg border border-dashed"
          data-oid="ovsrwbx"
        ></div>
      </TabsContent>
      <TabsContent
        value="key-personnel"
        className="flex flex-col px-4 lg:px-6"
        data-oid="gjr_soy"
      >
        <div
          className="aspect-video w-full flex-1 rounded-lg border border-dashed"
          data-oid="141w7aw"
        ></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
        data-oid="-rdpf7e"
      >
        <div
          className="aspect-video w-full flex-1 rounded-lg border border-dashed"
          data-oid="makl1yt"
        ></div>
      </TabsContent>
    </Tabs>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} data-oid="e.is8l7">
      <DrawerTrigger asChild data-oid="xys2aqq">
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left"
          data-oid="wi:up22"
        >
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent data-oid="-of.fje">
        <DrawerHeader className="gap-1" data-oid="1p.qgtl">
          <DrawerTitle data-oid="a5m_nxh">{item.header}</DrawerTitle>
          <DrawerDescription data-oid="jkf-mc_">
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div
          className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
          data-oid="p6hgzu0"
        >
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig} data-oid="sjw6e5z">
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                  data-oid="qfdi-ic"
                >
                  <CartesianGrid vertical={false} data-oid="abaqzek" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                    data-oid="-:whgwp"
                  />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent indicator="dot" data-oid="46yl9u7" />
                    }
                    data-oid="xn5--8a"
                  />

                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                    data-oid="gf_nlqi"
                  />

                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                    data-oid="39259mg"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator data-oid="28.4m0j" />
              <div className="grid gap-2" data-oid="lhi4ji5">
                <div
                  className="flex gap-2 leading-none font-medium"
                  data-oid="rj5aa9l"
                >
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" data-oid="so-4a-w" />
                </div>
                <div className="text-muted-foreground" data-oid="voh0l1m">
                  顯示過去6個月的總訪問量統計數據。
                </div>
              </div>
              <Separator data-oid="98-fk01" />
            </>
          )}
          <form className="flex flex-col gap-4" data-oid="pcw8zir">
            <div className="flex flex-col gap-3" data-oid="yya_r1d">
              <Label htmlFor="header" data-oid="1j4ls18">
                Header
              </Label>
              <Input
                id="header"
                defaultValue={item.header}
                data-oid="jnyry4o"
              />
            </div>
            <div className="grid grid-cols-2 gap-4" data-oid="n:ttnnf">
              <div className="flex flex-col gap-3" data-oid="oearkr-">
                <Label htmlFor="type" data-oid="tdb6c.5">
                  Type
                </Label>
                <Select defaultValue={item.type} data-oid="lf12hhs">
                  <SelectTrigger
                    id="type"
                    className="w-full"
                    data-oid="nyru_yw"
                  >
                    <SelectValue
                      placeholder="Select a type"
                      data-oid="_3b0t3m"
                    />
                  </SelectTrigger>
                  <SelectContent data-oid="x2il_8p">
                    <SelectItem value="Table of Contents" data-oid="j-84pxq">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary" data-oid="uegymoq">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach" data-oid=":zm1he:">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design" data-oid="1fo94jp">
                      Design
                    </SelectItem>
                    <SelectItem value="Capabilities" data-oid="y7sg3ol">
                      Capabilities
                    </SelectItem>
                    <SelectItem value="Focus Documents" data-oid="c.4qx-k">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative" data-oid="y_i8haz">
                      Narrative
                    </SelectItem>
                    <SelectItem value="Cover Page" data-oid="u24k:u5">
                      Cover Page
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3" data-oid="o0k0309">
                <Label htmlFor="status" data-oid="jwl_fty">
                  Status
                </Label>
                <Select defaultValue={item.status} data-oid="8cy:xad">
                  <SelectTrigger
                    id="status"
                    className="w-full"
                    data-oid="r9ot.:d"
                  >
                    <SelectValue
                      placeholder="Select a status"
                      data-oid="uo:_l27"
                    />
                  </SelectTrigger>
                  <SelectContent data-oid="zalt9-k">
                    <SelectItem value="Done" data-oid="g-e2jw7">
                      Done
                    </SelectItem>
                    <SelectItem value="In Progress" data-oid="l0366u7">
                      In Progress
                    </SelectItem>
                    <SelectItem value="Not Started" data-oid="16stexx">
                      Not Started
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" data-oid="v3y:4_4">
              <div className="flex flex-col gap-3" data-oid="7q5xuno">
                <Label htmlFor="target" data-oid="jbp...n">
                  Target
                </Label>
                <Input
                  id="target"
                  defaultValue={item.target}
                  data-oid="2x8u6u6"
                />
              </div>
              <div className="flex flex-col gap-3" data-oid="a-3:hoe">
                <Label htmlFor="limit" data-oid="4.mh69c">
                  Limit
                </Label>
                <Input
                  id="limit"
                  defaultValue={item.limit}
                  data-oid="9mpqjlj"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3" data-oid="5:tm5me">
              <Label htmlFor="reviewer" data-oid="gzbzzkl">
                Reviewer
              </Label>
              <Select defaultValue={item.reviewer} data-oid="mot2nk-">
                <SelectTrigger
                  id="reviewer"
                  className="w-full"
                  data-oid="qaapsca"
                >
                  <SelectValue
                    placeholder="Select a reviewer"
                    data-oid="919xhfz"
                  />
                </SelectTrigger>
                <SelectContent data-oid="d.j8xbn">
                  <SelectItem value="Eddie Lake" data-oid="an75crd">
                    Eddie Lake
                  </SelectItem>
                  <SelectItem value="Jamik Tashpulatov" data-oid="8bm4wux">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen" data-oid="vhid60s">
                    Emily Whalen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter data-oid="djjq0a3">
          <Button data-oid="qm-t_u8">Submit</Button>
          <DrawerClose asChild data-oid="r1550zs">
            <Button variant="outline" data-oid="rgzdqef">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
