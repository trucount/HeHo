'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Loader2, LogOut, Key, Database, User, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserAndSettings = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)

      const { data } = await supabase.from("users").select("*").eq("id", currentUser.id).single()

      if (data) {
        setOpenRouterKey(data.openrouter_key_encrypted || "")
        setSupabaseUrl(data.supabase_url || "")
        setSupabaseKey(data.supabase_key_encrypted || "")
      }
      setLoading(false)
    }

    loadUserAndSettings()
  }, [router, supabase])

  const handleSaveSettings = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          openrouter_key_encrypted: openRouterKey,
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and application settings.</p>

        {error && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-6 border-green-500/50 bg-green-500/10 text-green-300"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}
        
        <div className="space-y-8">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input value={user?.email || ""} disabled className="bg-background/50" />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle>
              <CardDescription>Manage your API keys for third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">OpenRouter API Key</label>
                <Input type="password" placeholder="sk-or-..." value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} className="mt-1 bg-background/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Supabase</CardTitle>
              <CardDescription>Your database connection details (locked).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <label className="text-sm font-medium text-muted-foreground">Supabase URL</label>
                <Input type="text" placeholder="https://[project_ref].supabase.co" value={supabaseUrl} disabled className="mt-1 bg-background/50" />
              </div>
                <div>
                <label className="text-sm font-medium text-muted-foreground">Supabase Anon Key</label>
                <Input type="password" placeholder="ey..." value={supabaseKey} disabled className="mt-1 bg-background/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Database Permissions</CardTitle>
              <CardDescription>Control AI access to your data (locked).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center space-x-3">
                <Checkbox id="can_read" checked={true} disabled />
                <div>
                  <label htmlFor="can_read" className="font-medium text-foreground">Allow AI to read data</label>
                  <p className="text-xs text-muted-foreground">AI can query your database tables.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="can_insert" checked={true} disabled />
                  <div>
                  <label htmlFor="can_insert" className="font-medium text-foreground">Allow AI to insert data</label>
                    <p className="text-xs text-muted-foreground">AI can insert new records into tables.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveSettings} disabled={saving} size="lg" className="w-full bg-black hover:bg-gray-900 text-white border border-white/20">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : "Save API Keys"}
          </Button>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
            <CardContent><Button onClick={handleLogout} variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"><LogOut className="mr-2 h-4 w-4"/>Sign Out</Button></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
