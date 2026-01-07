'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, PlusCircle, Database } from "lucide-react"
import Link from "next/link"

interface ConnectedTable {
  id: string
  table_name: string
  user_id: string
}

export default function DatabaseDashboardPage() {
  const [connectedTables, setConnectedTables] = useState<ConnectedTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [tableName, setTableName] = useState("")
  const [connecting, setConnecting] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  const supabase = createClient()

  const fetchConnectedTables = async () => {
    const { data, error } = await supabase.from("user_connected_tables").select("*")
    if (error) {
      setError(error.message)
    } else {
      setConnectedTables(data as ConnectedTable[])
    }
    return data || [];
  }

  const handleAutoCreateAndConnect = async () => {
    setIsAutoCreating(true);
    setError(null);
    try {
        // First, get user details needed for the API call
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to do this.");

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('provider_token, supabase_url')
            .eq('id', user.id)
            .single();
        
        if (userError || !userData || !userData.provider_token || !userData.supabase_url) {
            throw new Error("Could not find required Supabase connection details. Please try reconnecting your account in the setup page.");
        }

        const projectRef = new URL(userData.supabase_url).hostname.split('.')[0];

        // Call the idempotent create-tables endpoint
        const response = await fetch('/api/setup/create-tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_ref: projectRef, provider_token: userData.provider_token }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to create or connect tables.");

        // Refresh the list of tables
        await fetchConnectedTables();

    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsAutoCreating(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchConnectedTables().then((initialTables) => {
        if (initialTables.length === 0) {
            handleAutoCreateAndConnect();
        }
    }).finally(() => {
        setLoading(false);
    });
  }, [])

  const handleConnectTable = async () => {
    if (!tableName) return
    setConnecting(true);
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")
      const { error } = await supabase.from("user_connected_tables").insert({ user_id: user.id, table_name: tableName })
      if (error) throw error
      await fetchConnectedTables()
      setShowConnectDialog(false)
      setTableName("")
    } catch (err: any) {
      setError(err.message)
    } finally {
        setConnecting(false);
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Database</h1>
        <p className="text-muted-foreground mt-2">Manage your Supabase tables and schemas</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Your Connected Tables</CardTitle>
                <CardDescription>Tables from your Supabase instance that the AI can access.</CardDescription>
            </div>
            <Button onClick={() => setShowConnectDialog(true)}><PlusCircle className="mr-2 h-4 w-4"/> Connect Table</Button>
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogContent>
                <DialogHeader><DialogTitle>Connect a Supabase Table</DialogTitle></DialogHeader>
                {error && (
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
          {(loading || isAutoCreating) ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <p className="text-muted-foreground mt-4">{isAutoCreating ? "Setting up default tables..." : "Loading tables..."}</p>
                </div>
            ) : error ? (
                 <div className="flex flex-col items-center justify-center h-48 bg-red-500/10 rounded-lg">
                    <p className="text-red-400 font-semibold">An error occurred</p>
                    <p className="text-muted-foreground mt-2 text-center max-w-sm">{error}</p>
                    <Button onClick={handleAutoCreateAndConnect} className="mt-4">Try Again</Button>
                </div>
            ) : connectedTables.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tables connected yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Please connect a table to see its data.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {connectedTables.map(table => (
                <li key={table.id} className="py-3 px-2 flex justify-between items-center hover:bg-muted/50 rounded-md">
                  <span className="font-mono text-sm">{table.table_name}</span>
                  <Link href={`/app/database/${table.table_name}`} passHref>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
