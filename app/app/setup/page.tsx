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
      setProjectsFetched(true);
      setTesting(true);
      fetch(`/api/supabase-projects?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setSupabaseProjects(data.projects);
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
            const supabaseLaunchUrl = `https://supabase.com/dashboard/new?organization_id=${organizationId}`;
            window.open(supabaseLaunchUrl, '_blank');
        } else {
            setError("Could not determine your Supabase organization. Please connect again.");
        }
        setSelectedProject(null); // Reset selection
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
            setSupabaseKey(""); // Clear any previous key
        }
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

        {step === 1 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader><CardTitle>Connect OpenRouter</CardTitle><CardDescription>Enter your OpenRouter API key.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Get a free key at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="underline font-semibold">openrouter.ai</a></AlertDescription></Alert>
              <div>
                <label className="block text-sm font-medium mb-2">OpenRouter API Key</label>
                <Input type="password" placeholder="sk-or-..." value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} className="bg-background/50" />
              </div>
              {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              <Button onClick={testOpenRouterKey} disabled={!openRouterKey || testing} className="w-full bg-white text-black hover:bg-gray-200">{testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader><CardTitle>Connect Supabase</CardTitle><CardDescription>Link a database to store and manage your chatbot data.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <Button onClick={handleSupabaseConnect} disabled={testing} className="w-full bg-green-500 hover:bg-green-600 text-white">{testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : "Connect with Supabase"}</Button>

              {(supabaseProjects.length > 0 || projectsFetched) && (
                <div className="space-y-4">
                   <label className="block text-sm font-medium">Select your project</label>
                   <Select onValueChange={handleProjectSelect} defaultValue={selectedProject || undefined}>
                     <SelectTrigger className="w-full bg-background/50"><SelectValue placeholder="Select a Supabase project" /></SelectTrigger>
                     <SelectContent>
                        {supabaseProjects.map(proj => <SelectItem key={proj.id} value={proj.ref}>{proj.name}</SelectItem>)}
                        <SelectItem value="create_new">+ Create a new project</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              )}

              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or manually</span></div></div>

              <div><label className="block text-sm font-medium mb-2">Supabase Project URL</label><Input type="text" placeholder="https://xxxxx.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="bg-background/50" /></div>
              <div><label className="block text-sm font-medium mb-2">Supabase Anon (Public) Key</label><Input type="password" placeholder="eyJhbGciOiJIUzI1NiIsIn..." value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="bg-background/50" /></div>

              {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {connectionSuccess && <Alert className="border-green-500/50 bg-green-500/10 text-green-300"><CheckCircle className="h-4 w-4" /><AlertDescription>Connected successfully!</AlertDescription></Alert>}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-transparent hover:bg-white/10">Back</Button>
                <Button onClick={handleSupabaseStepContinue} disabled={testing} className="flex-1 bg-white text-black hover:bg-gray-200">{testing && hasInteractedWithSupabase ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</> : <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
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
      </div>
    </div>
  )
}
