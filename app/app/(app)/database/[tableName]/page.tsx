'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Zap, Edit, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

// The tables that can be edited for free.
const EDITABLE_TABLES = ['products', 'leads', 'customer_queries', 'sales'];

export default function TableViewPage() {
  const params = useParams()
  const tableName = decodeURIComponent(params.tableName as string)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isEditable = EDITABLE_TABLES.includes(tableName);

  useEffect(() => {
    if (!tableName) return;

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/database/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `An unknown error occurred.`)
        }

        setTableData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tableName])

  const renderValue = (value: any) => {
    if (value === null) return <span className="text-muted-foreground">NULL</span>;
    if (typeof value === 'object') return <pre className="bg-gray-800/50 p-2 rounded-sm text-xs">{JSON.stringify(value, null, 2)}</pre>;
    return String(value);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
                <Button asChild variant="outline" size="sm" className="mb-2">
                    <Link href="/app/database"><ArrowLeft className="h-4 w-4 mr-2"/>Back to Tables</Link>
                </Button>
                <h1 className="text-3xl font-bold text-foreground">{tableName}</h1>
                <p className="text-muted-foreground mt-1">Viewing the first 100 rows of your table.</p>
            </div>
            <div>
                {isEditable ? (
                     <Button variant="default" disabled>
                        <Edit className="h-4 w-4 mr-2"/>
                        Edit Data (Coming Soon)
                     </Button>
                ) : (
                    <div className="p-3 rounded-md bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-sm flex items-center gap-2">
                        <Zap className="h-5 w-5"/>
                        <div>
                            <div className="font-bold">Premium Table</div>
                            <div className="text-xs">Editing is a premium feature.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tableData && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-0">
              {tableData.data.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <p>This table is empty.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        {tableData.columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {tableData.columns.map(col => (
                            <TableCell key={col}>{renderValue(row[col])}</TableCell>
                            ))}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
