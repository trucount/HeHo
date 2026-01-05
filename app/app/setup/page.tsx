'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabaseOAuthConfig } from "@/lib/supabase/config"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

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

export default function SetupWizardPage() {
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openRouterKey, setOpenRouterKey] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [supabaseProjects, setSupabaseProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectsFetched, setProjectsFetched] = useState(false)
  const [providerToken, setProviderToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({ can_read: true, can_insert: true })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [connectionSuccess, setConnectionSuccess] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newDbPassword, setNewDbPassword] = useState("")
  const [newProjectRegion, setNewProjectRegion] = useState("us-east-1")
  const [creatingProject, setCreatingProject] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedState = localStorage.getItem('setupState');
    if (savedState) {
      try {
        const { step: savedStep, openRouterKey: savedOpenRouterKey } = JSON.parse(savedState);
        setStep(savedStep || 1);
        setOpenRouterKey(savedOpenRouterKey || "");
      } catch (e) {
        console.error("Failed to parse setup state:", e)
      }
      localStorage.removeItem('setupState');
    }

    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code && !projectsFetched) {
      setProjectsFetched(true); // Prevent re-fetching
      setTesting(true);
      fetch(`/api/supabase-projects?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setSupabaseProjects(data.projects || []);
            setProviderToken(data.provider_token)
            setRefreshToken(data.refresh_token)
            setOrganizationId(data.organization_id)
            setStep(2);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => {
          setTesting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [projectsFetched, router, supabase.auth]);

  const fetchProjects = async (token: string) => {
    setTesting(true);
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
    } finally {
      setTesting(false);
    }
  }

  const handleSupabaseConnect = () => {
    const stateToSave = { step: 2, openRouterKey };
    localStorage.setItem('setupState', JSON.stringify(stateToSave));

    const redirectUri = window.location.origin + "/app/setup";
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
        setError("Please connect to Supabase first to get your organization ID.");
      }
      setSelectedProject(null);
      return;
    }
    const project = supabaseProjects.find(p => p.ref === projectRef);
    if (project) {
      setSelectedProject(projectRef);
      setSupabaseUrl(`https://${projectRef}.supabase.co`);
      if (project.anonKey) {
          setSupabaseKey(project.anonKey);
      } else {
          setError("Could not automatically fetch the API key for this project. Please enter it manually.")
          setSupabaseKey("");
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
      setSuccess(`Project "${newProject.name}" created! It may take a moment to be available.`);
      setShowCreateProject(false);
      setNewProjectName("");
      setNewDbPassword("");
      
      // Wait a bit, then refetch projects and select the new one
      setTimeout(() => {
        if(providerToken){
           fetchProjects(providerToken).then(() => {
             // Find the new project and select it
             const createdProject = supabaseProjects.find(p => p.id === newProject.id);
             if (createdProject) {
               handleProjectSelect(createdProject.ref);
             } else {
                 // If not found immediately, might need a slightly longer wait
                 setTimeout(() => {
                     if(providerToken) fetchProjects(providerToken);
                 }, 5000)
             }
           });
        }
      }, 3000); // 3-second delay to allow Supabase to provision

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setCreatingProject(false);
    }
  };

  const testOpenRouterKey = async () => {
    if (!openRouterKey) {
      setError("Please enter your OpenRouter API key");
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${openRouterKey}` } });
      if (!response.ok) throw new Error("Invalid API key.");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate API key");
    } finally {
      setTesting(false);
    }
  };
  
  const testSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError("Please provide both the Supabase URL and the Anon (Public) Key.");
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const testSupabase = createClient(supabaseUrl, supabaseKey);
      const { error: testError } = await testSupabase.from('users').select('id').limit(1);
      if (testError && testError.message.includes('Invalid API key')) {
        throw new Error("Invalid Supabase credentials. Check your URL and Anon Key.");
      }
      setConnectionSuccess(true);
      setTimeout(() => setStep(3), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Supabase");
    } finally {
      setTesting(false);
    }
  }

 const saveSetup = async () => {
    if (!user) return;
    localStorage.removeItem('setupState');
    setTesting(true);
    setError(null);
    try {
      const upsertData: any = {
        id: user.id,
        email: user.email,
        openrouter_key_encrypted: openRouterKey,
        setup_completed: true,
        provider_token: providerToken,
        refresh_token: refreshToken,
      };

      if (supabaseUrl && supabaseKey) {
        upsertData.supabase_url = supabaseUrl;
        upsertData.supabase_key_encrypted = supabaseKey;
        upsertData.supabase_permissions = permissions;
      }

      const { error } = await supabase.from("users").upsert(upsertData, {
        onConflict: 'id'
      });

      if (error) throw error;

      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setup");
    } finally {
      setTesting(false);
    }
  };


  const handleSupabaseStepContinue = () => {
    const hasInteracted = supabaseUrl || supabaseKey || selectedProject;
    if (hasInteracted) {
        if (!supabaseKey) {
            setError("Please provide the Anon (Public) Key to continue.");
            return;
        }
      testSupabaseConnection();
    } else {
       setError("Supabase connection is mandatory. Please connect to a project or enter details manually.");
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const hasInteractedWithSupabase = supabaseUrl || supabaseKey || selectedProject;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
        <video autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover" src="/setupbg.mp4" />
        <div className="absolute z-10 w-full h-full bg-black/50"></div>
        <div className="w-full max-w-2xl z-20">
        <div className="flex gap-2 mb-8">{[1, 2, 3, 4].map(s => <div key={s} className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-border/50"}`} />)}</div>

        {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-4 border-green-500/50 bg-green-500/10 text-green-300"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

        {step === 1 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader><CardTitle>Connect OpenRouter</CardTitle><CardDescription>Enter your OpenRouter API key.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Get a free key at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="underline font-semibold">openrouter.ai</a></AlertDescription></Alert>
              <div>
                <label className="block text-sm font-medium mb-2">OpenRouter API Key</label>
                <Input type="password" placeholder="sk-or-..." value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} className="bg-background/50" />
              </div>
              <Button onClick={testOpenRouterKey} disabled={!openRouterKey || testing} className="w-full bg-white text-black hover:bg-gray-200">{testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader><CardTitle>Connect Supabase</CardTitle><CardDescription>Link a database to store and manage your chatbot data.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                 {providerToken ? (
                    <div className="p-3 rounded-lg bg-white/10 border border-white/20 flex justify-between items-center">
                        <p className="font-semibold text-green-300">Supabase Connected</p>
                        <Button variant="outline" size="sm" onClick={() => { setProviderToken(null); setRefreshToken(null); setSupabaseProjects([]); setOrganizationId(null); setSupabaseUrl(''); setSupabaseKey(''); }}>Disconnect</Button>
                    </div>
                 ) : (
                    <Button onClick={handleSupabaseConnect} disabled={testing} className="w-full bg-green-500 hover:bg-green-600 text-white">{testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : "Connect with Supabase"}</Button>
                 )
                }

              {(supabaseProjects.length > 0 || providerToken) && (
                <div className="space-y-4">
                   <label className="block text-sm font-medium">Select or create a project</label>
                   <Select onValueChange={handleProjectSelect} value={selectedProject || ''}>
                     <SelectTrigger className="w-full bg-background/50"><SelectValue placeholder="Select a Supabase project" /></SelectTrigger>
                     <SelectContent>
                        {supabaseProjects.map(proj => <SelectItem key={proj.id} value={proj.ref}>{proj.name}</SelectItem>)}
                        {providerToken && <SelectItem value="create_new">+ Create a new project</SelectItem>}
                      </SelectContent>
                   </Select>
                </div>
              )}

              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or manually</span></div></div>

              <div><label className="block text-sm font-medium mb-2">Supabase Project URL</label><Input type="text" placeholder="https://xxxxx.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="bg-background/50" /></div>
              <div><label className="block text-sm font-medium mb-2">Supabase Anon (Public) Key</label><Input type="password" placeholder="eyJhbGciOiJIUzI1NiIsIn..." value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="bg-background/50" /></div>

              {connectionSuccess && <Alert className="border-green-500/50 bg-green-500/10 text-green-300"><CheckCircle className="h-4 w-4" /><AlertDescription>Connected successfully!</AlertDescription></Alert>}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-transparent hover:bg-white/10">Back</Button>
                <Button onClick={handleSupabaseStepContinue} disabled={testing || !selectedProject} className="flex-1 bg-white text-black hover:bg-gray-200">{testing && hasInteractedWithSupabase ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</> : <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
             <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
             <CardHeader><CardTitle>Database Permissions</CardTitle><CardDescription>Control what your AI can do. Skipped if no database is linked.</CardDescription></CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-4">
                 <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5"><Checkbox id="can_read" checked={permissions.can_read} onCheckedChange={c => setPermissions({ ...permissions, can_read: !!c })} /><div className="flex-1"><label htmlFor="can_read" className="cursor-pointer">Read from tables</label><p className="text-sm text-muted-foreground">AI can query your data.</p></div></div>
                 <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5"><Checkbox id="can_insert" checked={permissions.can_insert} onCheckedChange={c => setPermissions({ ...permissions, can_insert: !!c })} /><div className="flex-1"><label htmlFor="can_insert" className="cursor-pointer">Insert new rows</label><p className="text-sm text-muted-foreground">AI can add data.</p></div></div>
               </div>
               <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Read and Insert are recommended.</AlertDescription></Alert>
               <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(2)} className="flex-1 bg-transparent hover:bg-white/10">Back</Button><Button onClick={() => setStep(4)} disabled={!permissions.can_read || !permissions.can_insert} className="flex-1 bg-white text-black hover:bg-gray-200">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
             </CardContent>
           </Card>
        )}

        {step === 4 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader><CardTitle>You're All Set!</CardTitle><CardDescription>Your instance is ready to create chatbots.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5"><CheckCircle className="h-5 w-5 text-white" /><div><p className="font-semibold">OpenRouter Connected</p><p className="text-sm text-muted-foreground">Ready to power your chatbots.</p></div></div>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${supabaseUrl && supabaseKey ? "bg-white/5 border-white/20" : "bg-yellow-500/10 border-yellow-500/50"}`}>
                  {supabaseUrl && supabaseKey ? <CheckCircle className="h-5 w-5 text-white" /> : <AlertCircle className="h-5 w-5 text-yellow-300" />}
                  <div><p className="font-semibold">Supabase {supabaseUrl && supabaseKey ? "Configured" : "Skipped"}</p><p className="text-sm text-muted-foreground">{supabaseUrl && supabaseKey ? "Database connection is active." : "You can connect it later."}</p></div>
                </div>
              </div>
              <Button onClick={saveSetup} disabled={testing} className="w-full bg-white text-black hover:bg-gray-200" size="lg">{testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finishing Up...</> : <>Go to Dashboard<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </CardContent>
          </Card>
        )}
        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Supabase Project</DialogTitle>
                    <DialogDescription>This will create a new project in your Supabase organization.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                    <Input type="password" placeholder="Database Password (at least 8 characters)" value={newDbPassword} onChange={e => setNewDbPassword(e.target.value)} />
                    <Select onValueChange={setNewProjectRegion} defaultValue={newProjectRegion}>
                        <SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>
                        <SelectContent>
                            {SUPABASE_REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
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
