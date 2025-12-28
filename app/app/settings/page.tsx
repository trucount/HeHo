"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { AlertCircle, LogOut, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [permissions, setPermissions] = useState({
    can_read: true,
    can_insert: true,
    can_create: false,
    can_delete: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      try {
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
          setUserData(data)
          setOpenRouterKey(data.openrouter_key_encrypted || "")
          setSupabaseUrl(data.supabase_url || "")
          setSupabaseKey(data.supabase_key_encrypted || "")
          setPermissions(data.supabase_permissions || permissions)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

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
          supabase_url: supabaseUrl,
          supabase_key_encrypted: supabaseKey,
          supabase_permissions: permissions,
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
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/app/dashboard" className="text-primary hover:underline mb-8 block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Settings</h1>

        {/* Account Section */}
        <Card className="border-border/50 bg-card/50 mb-8">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your HeHo account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input value={user?.email || ""} disabled className="bg-background/50 border-border/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Plan</label>
              <Input value={userData?.plan || "free"} disabled className="bg-background/50 border-border/50" />
            </div>
          </CardContent>
        </Card>

        {/* OpenRouter Settings */}
        <Card className="border-border/50 bg-card/50 mb-8">
          <CardHeader>
            <CardTitle>OpenRouter API Key</CardTitle>
            <CardDescription>Update your AI model provider key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="sk-or-..."
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            <p className="text-xs text-muted-foreground">Keys are encrypted before storage</p>
          </CardContent>
        </Card>

        {/* Supabase Settings */}
        <Card className="border-border/50 bg-card/50 mb-8">
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
            <CardDescription>Update your database connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Project URL</label>
              <Input
                type="text"
                placeholder="https://xxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Anon Key</label>
              <Input
                type="password"
                placeholder="eyJ..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">Keys are encrypted before storage</p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="border-border/50 bg-card/50 mb-8">
          <CardHeader>
            <CardTitle>Database Permissions</CardTitle>
            <CardDescription>Control what your AI chatbot can access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="can_read"
                checked={permissions.can_read}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_read: checked as boolean })}
              />
              <label htmlFor="can_read" className="font-medium text-foreground cursor-pointer">
                Read from tables
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="can_insert"
                checked={permissions.can_insert}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_insert: checked as boolean })}
              />
              <label htmlFor="can_insert" className="font-medium text-foreground cursor-pointer">
                Insert new rows
              </label>
            </div>

            <div className="flex items-center space-x-3 opacity-50">
              <Checkbox disabled id="can_create" checked={false} />
              <label htmlFor="can_create" className="font-medium text-foreground cursor-pointer">
                Create new tables (Premium)
              </label>
            </div>

            <div className="flex items-center space-x-3 opacity-50">
              <Checkbox disabled id="can_delete" checked={false} />
              <label htmlFor="can_delete" className="font-medium text-foreground cursor-pointer">
                Delete data (Permanently disabled)
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 mb-4"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
