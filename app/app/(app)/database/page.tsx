'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2, Database as DatabaseIcon, Zap, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// The four default tables.
const DEFAULT_TABLES = [
  { id: 'default-products', table_name: 'products' },
  { id: 'default-leads', table_name: 'leads' },
  { id: 'default-customer_queries', table_name: 'customer_queries' },
  { id: 'default-sales', table_name: 'sales' },
];

// The tables that can be edited for free.
const EDITABLE_TABLES = ['products', 'leads', 'customer_queries', 'sales'];

interface ConnectedTable {
  id: string;
  table_name: string;
}

export default function DatabasePage() {
  const [customTables, setCustomTables] = useState<ConnectedTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchCustomTables() {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error("You must be logged in to view this page.");
        }

        const { data, error } = await supabase
          .from('user_connected_tables')
          .select('id, table_name')
          .eq('user_id', user.id)

        if (error) {
          throw new Error(`Failed to load connected tables: ${error.message}.`);
        }

        setCustomTables(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomTables()
  }, [supabase])

  // Create a unique list of all tables.
  const allTablesMap = new Map();
  [...DEFAULT_TABLES, ...customTables].forEach(table => allTablesMap.set(table.table_name, { id: table.id || table.table_name, ...table }));
  const allTables = Array.from(allTablesMap.values());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Database</h1>
            <p className="text-muted-foreground mt-1">View tables in your database.</p>
          </div>
          <Button asChild className="bg-black hover:bg-gray-900 text-white border border-white/20">
            <Link href="/app/database/connect"><Plus className="mr-2 h-4 w-4"/> Connect a Table</Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTables.map(table => {
            const isEditable = EDITABLE_TABLES.includes(table.table_name);

            return (
              <Link key={table.id} href={`/app/database/${encodeURIComponent(table.table_name)}`} passHref>
                <Card className="border-border/50 bg-card/50 hover:border-white/30 hover:bg-card/80 transition-all cursor-pointer h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-3">
                      <DatabaseIcon className="h-6 w-6 text-muted-foreground"/>
                      {table.table_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <p className="text-muted-foreground text-sm">Click to view this table's data.</p>
                    {isEditable ? (
                       <div className="mt-4 p-2 rounded-md bg-green-900/30 border border-green-700/50 text-green-400 text-xs flex items-center gap-2">
                          <CheckCircle className="h-4 w-4"/>
                          <span>This table can be edited.</span>
                      </div>
                    ) : (
                      <div className="mt-4 p-2 rounded-md bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-xs flex items-center gap-2">
                          <Zap className="h-4 w-4"/>
                          <span>Editing is a premium feature. View only.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
