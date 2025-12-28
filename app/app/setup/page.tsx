"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SetupWizardPage() {
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [permissions, setPermissions] = useState({
    can_read: true,
    can_insert: true,
    can_create: false,
    can_delete: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [connectionSuccess, setConnectionSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }

    checkUser()
  }, [])

  const testOpenRouterKey = async () => {
    if (!openRouterKey) {
      setError("Please enter your OpenRouter API key")
      return
    }

    setTesting(true)
    setError(null)

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("Invalid API key. Make sure your OpenRouter API key is correct.")
      }

      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate API key")
    } finally {
      setTesting(false)
    }
  }

  const testSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError("Please enter your Supabase URL and publishable key")
      return
    }

    setTesting(true)
    setError(null)

    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/users?limit=1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      })

      if (testResponse.status === 401 || testResponse.status === 403) {
        throw new Error("Invalid Supabase credentials. Check your URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
      }

      if (!testResponse.ok && testResponse.status !== 404) {
        throw new Error(`Supabase connection failed: ${testResponse.statusText}`)
      }

      setConnectionSuccess(true)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Supabase")
    } finally {
      setTesting(false)
    }
  }

  const saveSetup = async () => {
    if (!user) return

    setTesting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          openrouter_key_encrypted: openRouterKey,
          supabase_url: supabaseUrl,
          supabase_key_encrypted: supabaseKey,
          supabase_permissions: permissions,
          setup_completed: true,
        })
        .eq("id", user.id)

      if (error) throw error

      router.push("/app/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setup")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-border/50"}`}
            />
          ))}
        </div>

        {/* Step 1: OpenRouter API Key */}
        {step === 1 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Connect OpenRouter</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your OpenRouter API key to power your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  Get a free API key from{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    className="text-white hover:underline font-semibold"
                    rel="noreferrer"
                  >
                    openrouter.ai
                  </a>
                </AlertDescription>
              </Alert>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">OpenRouter API Key</label>
                <Input
                  type="password"
                  placeholder="sk-or-..."
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="bg-background/50 border-border/50 text-foreground"
                />
              </div>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={testOpenRouterKey}
                disabled={!openRouterKey || testing}
                className="w-full bg-white hover:bg-gray-200 text-black"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Supabase Connection */}
        {step === 2 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Connect Supabase</CardTitle>
              <CardDescription className="text-muted-foreground">
                Link your Supabase database to store chatbot data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  Find your credentials at{" "}
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    className="text-white hover:underline font-semibold"
                    rel="noreferrer"
                  >
                    app.supabase.com
                  </a>{" "}
                  → Settings → API keys
                </AlertDescription>
              </Alert>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supabase Project URL</label>
                <Input
                  type="text"
                  placeholder="https://xxxxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="bg-background/50 border-border/50 text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
                </label>
                <Input
                  type="password"
                  placeholder="sb_publishable_..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="bg-background/50 border-border/50 text-foreground"
                />
              </div>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {connectionSuccess && (
                <Alert className="border-white/20 bg-white/5">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <AlertDescription className="text-white">Connected successfully!</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-border/50 text-foreground"
                >
                  Back
                </Button>
                <Button
                  onClick={testSupabaseConnection}
                  disabled={!supabaseUrl || !supabaseKey || testing}
                  className="flex-1 bg-white hover:bg-gray-200 text-black"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Database Permissions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Control what your AI chatbot can do with your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  You can change these permissions anytime in your account settings
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg">
                  <Checkbox
                    id="can_read"
                    checked={permissions.can_read}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, can_read: checked as boolean })}
                  />
                  <div className="flex-1">
                    <label htmlFor="can_read" className="font-medium text-foreground cursor-pointer">
                      Read from tables
                    </label>
                    <p className="text-sm text-muted-foreground">AI can query your database</p>
                  </div>
                  {permissions.can_read && <CheckCircle className="h-5 w-5 text-white" />}
                </div>

                <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg">
                  <Checkbox
                    id="can_insert"
                    checked={permissions.can_insert}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, can_insert: checked as boolean })}
                  />
                  <div className="flex-1">
                    <label htmlFor="can_insert" className="font-medium text-foreground cursor-pointer">
                      Insert new rows
                    </label>
                    <p className="text-sm text-muted-foreground">AI can add data to tables</p>
                  </div>
                  {permissions.can_insert && <CheckCircle className="h-5 w-5 text-white" />}
                </div>

                <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg opacity-50">
                  <Checkbox disabled id="can_create" checked={false} />
                  <div className="flex-1">
                    <label htmlFor="can_create" className="font-medium text-foreground cursor-pointer">
                      Create new tables
                    </label>
                    <p className="text-sm text-muted-foreground">
                      AI can create tables (disabled - contact us to enable)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5 opacity-50">
                  <Checkbox disabled id="can_delete" checked={false} />
                  <div className="flex-1">
                    <label htmlFor="can_delete" className="font-medium text-foreground cursor-pointer">
                      Delete data
                    </label>
                    <p className="text-sm text-muted-foreground">Permanently disabled for safety</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  At minimum, your AI needs Read and Insert permissions to function
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-border/50 text-foreground"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!permissions.can_read || !permissions.can_insert}
                  className="flex-1 bg-white hover:bg-gray-200 text-black"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">You're All Set!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your HeHo instance is ready to create chatbots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/20">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">OpenRouter Connected</p>
                    <p className="text-sm text-muted-foreground">Ready to power your chatbots</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/20">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Supabase Configured</p>
                    <p className="text-sm text-muted-foreground">Database connection established</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/20">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Permissions Set</p>
                    <p className="text-sm text-muted-foreground">Your data is protected</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  You can update these settings anytime in your account settings
                </AlertDescription>
              </Alert>

              <Button
                onClick={saveSetup}
                disabled={testing}
                className="w-full bg-white hover:bg-gray-200 text-black"
                size="lg"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
