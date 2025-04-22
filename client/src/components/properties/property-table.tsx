import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnDef,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Property } from "@shared/schema";
import { getPropertyTypeClass } from "@/lib/utils";
import { useDeleteProperty, useSyncPropertyIcal } from "@/hooks/use-properties";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PropertyTableProps {
  data: Property[];
}

export function PropertyTable({ data }: PropertyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [_, navigate] = useLocation();
  
  const deleteProperty = useDeleteProperty();
  const syncIcal = useSyncPropertyIcal(0); // Will be set when syncing a specific property

  const handleDeleteProperty = async (property: Property) => {
    if (window.confirm(`Are you sure you want to delete ${property.nickname}?`)) {
      await deleteProperty.mutateAsync(property.id);
    }
  };

  const handleSyncIcal = async (property: Property) => {
    if (property.icalUrl) {
      syncIcal.mutate();
    } else {
      alert("This property does not have an iCal URL configured");
    }
  };

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "nickname",
      header: "Property",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage 
              src={row.original.imageUrl || `https://source.unsplash.com/100x100/?property,${row.original.type}?random=${row.original.id}`} 
              alt={row.original.nickname} 
            />
            <AvatarFallback className="rounded-md">{row.original.nickname.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="font-medium">{row.original.nickname}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.beds} beds · {row.original.baths} baths
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={getPropertyTypeClass(row.original.type)}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.address.split(',')[0]}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.address.split(',').slice(1).join(',')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "icalUrl",
      header: "iCal Status",
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={row.original.icalUrl ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}
        >
          {row.original.icalUrl ? "Connected" : "Not Connected"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const property = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/properties?action=edit&id=${property.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSyncIcal(property)}
                disabled={!property.icalUrl || syncIcal.isPending}
              >
                {syncIcal.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Sync iCal
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDeleteProperty(property)}
                disabled={deleteProperty.isPending}
              >
                {deleteProperty.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter properties..."
          value={(table.getColumn("nickname")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nickname")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No properties found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
