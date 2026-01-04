'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'

interface TableData {
    [key: string]: any
}

export default function ViewTablePage() {
  const [data, setData] = useState<TableData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const tableName = params.tableName as string;

  useEffect(() => {
    if (!tableName) return;

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/database/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName: decodeURIComponent(tableName) }),
        })

        if (!response.ok) {
          const errorResult = await response.json().catch(() => null);
          throw new Error(errorResult?.error || `Error: ${response.status}`);
        }

        const result = await response.json()
        setData(result.data || [])
        setColumns(result.columns || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tableName])

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 sm:px-6 py-8'>
        <div className='mb-8'>
            <Button variant='outline' onClick={() => router.back()} className='mb-4'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Tables
            </Button>
            <h1 className='text-3xl font-bold text-foreground'>Viewing Table: {decodeURIComponent(tableName)}</h1>
            <p className='text-muted-foreground'>Showing the first 100 rows of your table.</p>
        </div>

        <Card className='border-border/50 bg-card/50'>
            <CardContent className='pt-6'>
                {loading ? (
                    <div className='flex items-center justify-center py-20'>
                        <Loader2 className='h-8 w-8 animate-spin text-white' />
                    </div>
                ) : error ? (
                    <div className='py-20'>
                        <Alert variant='destructive'>
                            <AlertTriangle className='h-4 w-4'/>
                            <AlertTitle>Error Fetching Data</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                ) : data.length === 0 ? (
                    <div className='text-center py-20'>
                        <p className='text-muted-foreground'>No data found in this table.</p>
                    </div>
                ) : (
                    <div className='w-full overflow-x-auto'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableHead key={col}>{col}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                {columns.map(col => <TableCell key={col}>{String(row[col])}</TableCell>)} 
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  )
}
