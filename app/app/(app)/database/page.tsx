"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Database, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Table {
  name: string
  rowCount: number
  columns: string[]
}

export default function DatabasePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<Table[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDatabaseInfo = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        // Fetch user's Supabase configuration
        const { data: userData } = await supabase
          .from("users")
          .select("supabase_url, supabase_key_encrypted")
          .eq("id", currentUser.id)
          .single()

        if (!userData?.supabase_url || !userData?.supabase_key_encrypted) {
          setError("Supabase not configured. Please set it up in settings.")
          setLoading(false)
          return
        }

        // For now, show a placeholder message since we can't directly query user's Supabase
        setTables([])
        setError(
          "Database management is available. Connect your Supabase instance through settings to manage tables and schemas.",
        )
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load database information")
      } finally {
        setLoading(false)
      }
    }

    loadDatabaseInfo()
  }, [])

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
         <div class="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-foreground">DATABASE</h1>
            <p className="text-muted-foreground">Manage your Supabase tables and schemas</p>
          </div>

        {error ? (
          <Alert className="border-border/50 bg-card/50 mb-8">
            <Database className="h-4 w-4" />
            <AlertDescription className="text-muted-foreground">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Your Database Tables</CardTitle>
            <CardDescription>Tables created and connected to your chatbots</CardDescription>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold mb-2">No tables yet</p>
                <p className="text-muted-foreground mb-6">
                  Tables will appear here when you create chatbots with database integration
                </p>
                <Button className="bg-black hover:bg-gray-900 text-white border border-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Table
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tables.map((table) => (
                  <div key={table.name} className="border border-border/50 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">{table.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Rows: {table.rowCount}</p>
                    <div className="flex flex-wrap gap-1">
                      {table.columns.map((col) => (
                        <span key={col} className="bg-white/10 text-foreground text-xs px-2 py-1 rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
