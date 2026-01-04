"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Database, Plus, Link2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"

interface ConnectedTable {
  id: number
  table_name: string
}

interface TableData {
    [key: string]: any
}

export default function DatabasePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connectedTables, setConnectedTables] = useState<ConnectedTable[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [tableName, setTableName] = useState('')
  const [connecting, setConnecting] = useState(false)

  // State for viewing table data
  const [showDataDialog, setShowDataDialog] = useState(false)
  const [viewingTable, setViewingTable] = useState<ConnectedTable | null>(null)
  const [tableData, setTableData] = useState<TableData[]>([])
  const [tableColumns, setTableColumns] = useState<string[]>([])
  const [viewingData, setViewingData] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDatabaseInfo = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        const { data: userData } = await supabase.from("users").select("supabase_url, supabase_key_encrypted").eq("id", currentUser.id).single()
        if (!userData?.supabase_url || !userData?.supabase_key_encrypted) {
          setError("Supabase not configured. Please set it up in settings to connect tables.")
          setLoading(false)
          return
        }

        const { data: tablesData, error: tablesError } = await supabase.from('user_connected_tables').select('id, table_name').eq('user_id', currentUser.id)
        if (tablesError) throw tablesError
        setConnectedTables(tablesData || [])
      } catch (err: any) {
        setError(err.message || "Failed to load database information")
      } finally {
        setLoading(false)
      }
    }
    loadDatabaseInfo()
  }, [supabase, router])

  const handleConnectTable = async () => {
    if (!tableName.trim()) return
    setConnecting(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('user_connected_tables').insert({ user_id: user.id, table_name: tableName.trim() }).select()
      if (error) {
        if (error.code === '23505') throw new Error(`Table "${tableName}" is already connected.`)
        else throw error
      }
      if (data) setConnectedTables([...connectedTables, data[0]])
      setShowConnectDialog(false)
      setTableName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleViewData = async (table: ConnectedTable) => {
    setViewingTable(table)
    setShowDataDialog(true)
    setViewingData(true)
    setViewError(null)
    setTableData([])
    setTableColumns([])

    try {
      const response = await fetch('/api/database/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: table.table_name }),
      })

      if (!response.ok) {
        // Attempt to get error message from body, otherwise use status text
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
            const errorResult = await response.json();
            errorMessage = errorResult.error || errorMessage;
        } catch (e) {
            // The body was not JSON or was empty, do nothing
        }
        throw new Error(errorMessage);
      }

      const result = await response.json()
      setTableData(result.data || [])
      setTableColumns(result.columns || [])

    } catch (err: any) {
      setViewError(err.message)
    } finally {
      setViewingData(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">DATABASE</h1>
            <p className="text-muted-foreground">Manage your Supabase tables and schemas</p>
        </div>

        {error && !showConnectDialog && (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Connected Tables</CardTitle>
              <CardDescription>Tables from your Supabase instance</CardDescription>
            </div>
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-900 text-white border border-white/20">
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect a Supabase Table</DialogTitle>
                  <DialogDescription>Enter the name of the table you want to connect.</DialogDescription>
                </DialogHeader>
                 {error && showConnectDialog && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="grid gap-4 py-4">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input id="table-name" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="e.g., products" />
                </div>
                <DialogFooter>
                  <Button onClick={() => {setShowConnectDialog(false); setError(null);}} variant="outline">Cancel</Button>
                  <Button onClick={handleConnectTable} disabled={connecting}>
                    {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Connect
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {connectedTables.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold mb-2">No tables connected yet</p>
                <p className="text-muted-foreground mb-6">Connect a table to see its data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedTables.map((table) => (
                  <Card key={table.id} className="border-border/50 bg-card/70 hover:border-white/30 transition-all flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2"><Database className="h-5 w-5" />{table.table_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                      <Button variant="outline" className="w-full" onClick={() => handleViewData(table)} disabled={viewingData && viewingTable?.id === table.id}>
                        {viewingData && viewingTable?.id === table.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null} View Data
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent className="max-w-4xl h-3/4 flex flex-col">
          <DialogHeader>
            <DialogTitle>Viewing Table: {viewingTable?.table_name}</DialogTitle>
            <DialogDescription>Showing the first 100 rows of your table.</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-auto border rounded-md">
            {viewingData ? (
              <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : viewError ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{viewError}</AlertDescription></Alert>
              </div>
            ) : tableData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <p className="text-muted-foreground">No data found in this table.</p>
                </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                  <TableRow>{tableColumns.map(col => <TableHead key={col}>{col}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {tableColumns.map(col => <TableCell key={col}>{String(row[col])}</TableCell>)} 
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDataDialog(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
