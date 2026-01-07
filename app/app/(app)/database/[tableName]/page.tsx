'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

// These are the tables that were automatically created during setup.
// We will allow full CRUD operations on them.
const EDITABLE_TABLES = ['products', 'leads', 'customer_queries', 'sales'];

interface TableData {
    [key: string]: any
}

export default function ViewTablePage() {
  const [data, setData] = useState<TableData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [primaryKey, setPrimaryKey] = useState<string>("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newRowData, setNewRowData] = useState<TableData>({});
  const [editingRow, setEditingRow] = useState<TableData | null>(null);
  const [deletingRow, setDeletingRow] = useState<TableData | null>(null);

  const params = useParams()
  const router = useRouter()
  const tableName = decodeURIComponent(params.tableName as string);
  
  // Check if the current table is one of the default editable tables.
  const isEditable = EDITABLE_TABLES.includes(tableName);

  const supabase = createClient()

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/database/view?tableName=${tableName}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      if (result.data.length > 0) {
        setColumns(Object.keys(result.data[0]))
      }
      setData(result.data)
      setPrimaryKey(result.primaryKey);

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tableName) {
      fetchData()
    }
  }, [tableName])

  const handleAddRow = async () => {
    setError(null);
    try {
      const response = await fetch('/api/database/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, rowData: newRowData }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      fetchData();
      setIsAddDialogOpen(false);
      setNewRowData({});
    } catch (err: any) {
      setError(err.message);
    }
  }

  const handleEditRow = async () => {
    if (!editingRow || !primaryKey) return;
    setError(null);
    try {
      const rowId = editingRow[primaryKey];
      const response = await fetch('/api/database/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, rowId, rowData: editingRow, primaryKey }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      fetchData();
      setIsEditDialogOpen(false);
      setEditingRow(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const handleDeleteRow = async () => {
    if (!deletingRow || !primaryKey) return;
    setError(null);
    try {
      const rowId = deletingRow[primaryKey];
      const response = await fetch('/api/database/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, rowId, primaryKey }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      fetchData();
      setIsDeleteDialogOpen(false);
      setDeletingRow(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <CardTitle className="text-2xl font-bold">{tableName}</CardTitle>
                        <CardDescription>{isEditable ? "You can add, edit, and delete rows in this table." : "This table is read-only from the dashboard."}</CardDescription>
                    </div>
                    {/* Only show the Add button if the table is editable */}
                    {isEditable && <Button onClick={() => setIsAddDialogOpen(true)}>Add Row</Button>}
                </div>
            </CardHeader>
            <CardContent>
                {loading && <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {!loading && !error && data.length > 0 && (
                    <Table>
                        <TableHeader><TableRow>{columns.map(col => <TableHead key={col}>{col}</TableHead>)}<TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {data.map((row, i) => (
                            <TableRow key={i}>
                                {columns.map(col => <TableCell key={col}>{String(row[col])}</TableCell>)}
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {/* Only show Edit and Delete options if the table is editable */}
                                        {isEditable ? (
                                            <>
                                                <DropdownMenuItem onClick={() => { setEditingRow(row); setIsEditDialogOpen(true); }}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setDeletingRow(row); setIsDeleteDialogOpen(true); }}>Delete</DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem disabled>Read-only</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 {!loading && !error && data.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">This table is empty.</p>
                    </div>
                )}
            </CardContent>
        </Card>

      {/* Add Row Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Row to {tableName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {columns.filter(c => c !== primaryKey).map(col => (
              <div key={col} className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">{col}</label>
                <Input className="col-span-3" value={newRowData[col] || ''} onChange={e => setNewRowData({ ...newRowData, [col]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={handleAddRow}>Add Row</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Row in {tableName}</DialogTitle></DialogHeader>
          {editingRow && (
             <div className="space-y-4 py-4">
                {columns.map(col => (
                <div key={col} className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">{col}</label>
                    <Input className="col-span-3" value={editingRow[col] || ''} onChange={e => setEditingRow({ ...editingRow, [col]: e.target.value })} disabled={col === primaryKey}/>
                </div>
                ))}
            </div>
          )}
          <DialogFooter><Button onClick={handleEditRow}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Row Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the row.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRow}>Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
