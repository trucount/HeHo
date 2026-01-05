'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { supabaseOAuthConfig } from "@/lib/supabase/config";

export default function SetupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setLoading(true)
      fetch(`/api/supabase-projects?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setProjects(data.projects)
          }
          setLoading(false)
        })
    }
     else {
      setLoading(false)
    }
  }, [searchParams])

  const handleSupabaseConnect = () => {
    const redirectUri = window.location.origin + "/app/setup"
    const clientId = supabaseOAuthConfig.clientId;
    const supabaseOAuthUrl = `https://api.supabase.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&scope=read:projects&redirect_uri=${redirectUri}`
    window.location.href = supabaseOAuthUrl
  }

  const handleProjectSelect = (projectRef: string) => {
    setSelectedProject(projectRef)
    setSupabaseUrl(`https://${projectRef}.supabase.co`)
  }

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
        throw new Error("Invalid OpenRouter API key")
      }

      // Key is valid, you can optionally show a success message
      alert("OpenRouter API Key is valid!")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProject || !supabaseKey || !openRouterKey) {
      setError("Please fill in all fields")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/save-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          supabaseUrl, 
          supabaseKey, 
          openRouterKey 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "An unexpected error occurred.")
      }
      
      router.push("/app/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (projects.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>Select your Supabase project and enter your API keys to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Supabase Project</Label>
              <div className="grid gap-2">
              {projects.map((project: any) => (
                <Button 
                  key={project.id} 
                  onClick={() => handleProjectSelect(project.ref)} 
                  variant={selectedProject === project.ref ? "default" : "outline"}
                >
                  {project.name}
                </Button>
              ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input id="supabase-url" value={supabaseUrl} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-key">Supabase Service Role Key</Label>
              <Input id="supabase-key" type="password" value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
              <div className="flex items-center space-x-2">
                <Input id="openrouter-key" type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} />
                <Button onClick={testOpenRouterKey} disabled={testing} variant="secondary">
                  {testing ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save and Continue"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect to Supabase</CardTitle>
          <CardDescription>Authorize the application to access your Supabase projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSupabaseConnect} className="w-full">
            Connect with Supabase
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
