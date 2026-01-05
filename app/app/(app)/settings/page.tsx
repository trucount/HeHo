'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Loader2, Settings, Key, Database, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabaseOAuthConfig } from "@/lib/supabase/config"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"

const SUPABASE_REGIONS = [
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ca-central-1", label: "Canada (Central)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-west-2", label: "EU (London)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-1", label: "US West (N. California)" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [supabaseProjects, setSupabaseProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [providerToken, setProviderToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({ can_read: true, can_insert: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newDbPassword, setNewDbPassword] = useState("")
  const [newProjectRegion, setNewProjectRegion] = useState("us-east-1")
  const [creatingProject, setCreatingProject] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserAndSettings = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data } = await supabase.from("users").select("*").eq("id", currentUser.id).single();

      if (data) {
        setUserData(data)
        setOpenRouterKey(data.openrouter_key_encrypted || "");
        setSupabaseUrl(data.supabase_url || "");
        setSupabaseKey(data.supabase_key_encrypted || "");
        setPermissions(data.supabase_permissions || { can_read: true, can_insert: true });
        setProviderToken(data.provider_token || null);
        setRefreshToken(data.refresh_token || null);

        if (data.provider_token) {
          await fetchProjects(data.provider_token);
        }
      }
      setLoading(false);
    };

    loadUserAndSettings();
  }, [router, supabase]);

  const fetchProjects = async (token: string) => {
    try {
      const res = await fetch('/api/supabase-projects', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSupabaseProjects(data.projects || []);
        if (data.organization_id) setOrganizationId(data.organization_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  }

  const handleSupabaseConnect = () => {
    const redirectUri = window.location.origin + "/app/settings";
    const clientId = supabaseOAuthConfig.clientId;
    const scope = "read:projects read:project_api_keys organizations:read";
    const supabaseOAuthUrl = `https://api.supabase.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;
    window.location.href = supabaseOAuthUrl;
  };

  const handleProjectSelect = (projectRef: string) => {
    if (projectRef === 'create_new') {
      if (organizationId) {
        setShowCreateProject(true);
      } else {
        setError("Could not determine organization. Please reconnect Supabase.");
      }
      setSelectedProject(null);
      return;
    }
    const project = supabaseProjects.find(p => p.ref === projectRef);
    if (project) {
      setSelectedProject(projectRef);
      setSupabaseUrl(`https://${projectRef}.supabase.co`);
      setSupabaseKey(project.anonKey || "");
      if (!project.anonKey) {
        setError("Could not fetch API key for this project. Please enter it manually.");
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newDbPassword) {
      setError("Project name and database password are required.");
      return;
    }
    setCreatingProject(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/create-supabase-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          organizationId, 
          projectName: newProjectName, 
          dbPassword: newDbPassword, 
          region: newProjectRegion,
          providerToken
        }),
      });
      const newProject = await response.json();
      if (!response.ok) {
        throw new Error(newProject.error || "Failed to create project");
      }
      setSuccess(`Project "${newProject.name}" created! Refreshing project list...`);
      setShowCreateProject(false);
      setNewProjectName("");
      setNewDbPassword("");

      setTimeout(() => {
        if(providerToken) fetchProjects(providerToken);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          openrouter_key_encrypted: openRouterKey,
          supabase_url: supabaseUrl,
          supabase_key_encrypted: supabaseKey,
          supabase_permissions: permissions,
          provider_token: providerToken,
          refresh_token: refreshToken,
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
  
  // OAuth callback effect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      setLoading(true);
      fetch(`/api/supabase-projects?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setSupabaseProjects(data.projects || []);
            setProviderToken(data.provider_token);
            setRefreshToken(data.refresh_token);
            setOrganizationId(data.organization_id);
            setSuccess("Connected to Supabase successfully!");
          }
        })
        .catch(err => setError(err.message))
        .finally(() => {
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/app/dashboard" className="text-primary hover:underline mb-8 block">← Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-foreground mb-8">Settings</h1>

        {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-4 border-green-500/50 bg-green-500/10 text-green-300"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}
        
        <Card className="mb-8">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent><Input value={user?.email || ""} disabled /></CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>OpenRouter API Key</CardTitle></CardHeader>
          <CardContent><Input type="password" placeholder="sk-or-..." value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} /></CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Supabase</CardTitle><CardDescription>Manage your database connection.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {!providerToken ? (
              <Button onClick={handleSupabaseConnect} className="w-full bg-green-500 hover:bg-green-600">Connect with Supabase</Button>
            ) : (
              <div className="p-3 rounded-lg bg-white/10 border flex justify-between items-center">
                <p className="font-semibold text-green-300">Supabase Connected</p>
                <Button variant="outline" size="sm" onClick={() => { setProviderToken(null); setRefreshToken(null); setSupabaseProjects([]); setOrganizationId(null); setSupabaseUrl(''); setSupabaseKey(''); }}>Disconnect</Button>
              </div>
            )}

            {providerToken && (
              <Select onValueChange={handleProjectSelect} value={selectedProject || ''}>
                <SelectTrigger><SelectValue placeholder="Select or create a project" /></SelectTrigger>
                <SelectContent>
                  {supabaseProjects.map(p => <SelectItem key={p.id} value={p.ref}>{p.name}</SelectItem>)}
                  <SelectItem value="create_new">+ Create New Project</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Input type="text" placeholder="Supabase URL" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
            <Input type="password" placeholder="Supabase Anon Key" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Database Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2"><Checkbox id="can_read" checked={permissions.can_read} onCheckedChange={c => setPermissions({ ...permissions, can_read: !!c })} /><label htmlFor="can_read">Allow AI to read data</label></div>
            <div className="flex items-center space-x-2"><Checkbox id="can_insert" checked={permissions.can_insert} onCheckedChange={c => setPermissions({ ...permissions, can_insert: !!c })} /><label htmlFor="can_insert">Allow AI to insert data</label></div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveSettings} disabled={saving} className="w-full" size="lg">{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : "Save All Settings"}</Button>
        
        <Card className="mt-8 border-destructive/30 bg-destructive/5">
          <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent><Button onClick={handleLogout} variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"><LogOut className="mr-2 h-4 w-4"/>Sign Out</Button></CardContent>
        </Card>

        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Supabase Project</DialogTitle><DialogDescription>This will create a new project in your Supabase organization.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
              <Input type="password" placeholder="Database Password (at least 8 characters)" value={newDbPassword} onChange={e => setNewDbPassword(e.target.value)} />
              <Select onValueChange={setNewProjectRegion} defaultValue={newProjectRegion}>
                <SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>
                <SelectContent>{SUPABASE_REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateProject(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={creatingProject}>{creatingProject ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Project"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
