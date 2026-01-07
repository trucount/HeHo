'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Loader2, Zap, Edit, ArrowLeft, PlusCircle, Trash2, Save, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

const EDITABLE_TABLES = ['products', 'leads', 'customer_queries', 'sales'];

const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function TableViewPage() {
  const params = useParams()
  const tableName = decodeURIComponent(params.tableName as string)
  const [tableData, setTableData] = useState<TableData>({ columns: [], data: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // States for inline editing
  const [editingRowId, setEditingRowId] = useState<any>(null);
  const [editingRowData, setEditingRowData] = useState<Record<string, any> | null>(null);

  const isEditable = EDITABLE_TABLES.includes(tableName);

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/database/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unknown error')
      setTableData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tableName])

  useEffect(() => {
    if (tableName) {
        fetchData();
    }
  }, [tableName, fetchData])

  const debouncedRefetch = useCallback(debounce(() => { 
    setEditingRowId(null);
    fetchData();
  }, 300), [fetchData]);

  const handleApiAction = async (action: string, payload: any) => {
    setError(null);
    try {
        const response = await fetch('/api/database/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, action, payload }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        debouncedRefetch();
        return result;
    } catch (err: any) {
        setError(err.message);
        return Promise.reject(err);
    }
  };
  
  const handleAddRow = async () => {
    await handleApiAction('ADD_ROW', { newRow: {} });
  }

  const handleEditRow = (row: Record<string, any>) => {
    setEditingRowId(row.id);
    setEditingRowData({ ...row });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingRowData(null);
    setError(null);
  }

  const handleSaveEdit = async () => {
    if (!editingRowData) return;
    await handleApiAction('UPDATE_ROW', { rowId: editingRowId, updatedData: editingRowData });
  }

  const handleDeleteRow = async (rowId: any) => {
    if (confirm('Are you sure you want to delete this row?')) {
      await handleApiAction('DELETE_ROW', { rowId });
    }
  };

  const renderCell = (row: Record<string, any>, col: string) => {
    const isEditingThisRow = editingRowId === row.id;
    const data = isEditingThisRow ? editingRowData : row;

    if (isEditingThisRow && col !== 'id' && col !== 'created_at') {
      return (
        <Input
          value={editingRowData?.[col] || ''}
          onChange={(e) => setEditingRowData(prev => prev ? { ...prev, [col]: e.target.value } : null)}
          className="bg-background/80 h-8"
        />
      )
    }

    if (data[col] === null) return <span className="text-muted-foreground">NULL</span>;
    if (typeof data[col] === 'object') return <pre className="text-xs max-w-xs truncate">{JSON.stringify(data[col])}</pre>;
    
    const cellValue = String(data[col]);
    if (cellValue.trim() === "") return <span className="text-muted-foreground/50 italic">‹empty›</span>
    return cellValue;
  }

  const isAnythingBeingEdited = editingRowId !== null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{tableName}</h1>
            <div>
                {isEditable ? (
                    <Button onClick={() => setIsEditMode(!isEditMode)} variant={isEditMode ? 'secondary' : 'default'}>
                        {isEditMode ? <><X className="h-4 w-4 mr-2"/>Exit Edit Mode</> : <><Edit className="h-4 w-4 mr-2"/>Edit Data</>}
                    </Button>
                ) : (
                     <div className="p-3 rounded-md bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-sm flex items-center gap-2">
                        <Zap className="h-5 w-5"/>
                        <div className="font-bold">Premium Table</div>
                    </div>
                )}
            </div>
        </div>

        {isEditMode && (
          <div className="mb-4">
            <Button onClick={handleAddRow} disabled={isAnythingBeingEdited}>
                <PlusCircle className="h-4 w-4 mr-2"/>Add New Row
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <> 
            {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Action Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="border border-border/50 rounded-lg bg-card/50 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{tableData.columns.map(col => <TableHead key={col}>{col}</TableHead>)}{isEditMode && <TableHead className="text-right min-w-[100px]">Actions</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {tableData.data.length === 0 ? (
                    <TableRow><TableCell colSpan={tableData.columns.length + (isEditMode ? 1: 0)} className="text-center py-20 text-muted-foreground">This table is empty.</TableCell></TableRow>
                  ) : (
                    tableData.data.map((row) => (
                      <TableRow key={row.id}>
                        {tableData.columns.map(col => <TableCell className="py-2" key={col}>{renderCell(row, col)}</TableCell>)}
                        {isEditMode && (
                          <TableCell className="text-right py-2">
                            {editingRowId === row.id ? (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={handleSaveEdit}><Save className="h-4 w-4"/></Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}><X className="h-4 w-4"/></Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => handleEditRow(row)} disabled={isAnythingBeingEdited}><Edit className="h-4 w-4"/></Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteRow(row.id)} disabled={isAnythingBeingEdited}><Trash2 className="h-4 w-4"/></Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
