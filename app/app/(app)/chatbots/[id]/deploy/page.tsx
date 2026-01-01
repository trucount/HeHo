'use client'

import { useState, useEffect } from 'react'
import { useChatbotShare } from '@/hooks/useChatbotShare'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Loader2, ArrowLeft, Share2, Globe, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'

interface DeployChatbotPageProps {
  params: { id: string }
}

export default function DeployChatbotPage({ params }: DeployChatbotPageProps) {
  const chatbotId = params.id
  const { share, loading, createShareLink, deleteShareLink } = useChatbotShare(chatbotId)
  
  const [deploying, setDeploying] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expires, setExpires] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)
  const [countdown, setCountdown] = useState('')

  const deployUrl = share ? `${window.location.origin}/deploy/${share.share_token}` : ''

  useEffect(() => {
    if (share?.expires_at) {
      const updateCountdown = () => {
        const distance = formatDistanceToNow(new Date(share.expires_at!), { addSuffix: true })
        setCountdown(`Expires ${distance}`)
      }
      updateCountdown()
      const interval = setInterval(updateCountdown, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [share])

  const handleDeploy = async () => {
    setDeploying(true)
    await createShareLink(expires ? expiryDate! : null)
    setDeploying(false)
  }

  const handleUndeploy = async () => {
    setDeploying(true)
    await deleteShareLink()
    setDeploying(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-white' />
      </div>
    )
  }

  const embedCode = `<!-- HeHo Chatbot Widget -->
<div id="heho-chatbot-${chatbotId}" style="height: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>
<script src="${window.location.origin}/embed.js"></script>
<script>
  HeHoChatbot.embed('${deployUrl}', 'heho-chatbot-${chatbotId}');
</script>`

  const iframeCode = `<iframe src="${deployUrl}" style="width: 100%; height: 600px; border: none; border-radius: 8px;" allow="microphone; camera"></iframe>`

  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b border-border/50 bg-card/30 sticky top-0 z-40'>
        <div className='container mx-auto px-6 py-4 flex items-center gap-4'>
          <Link href={`/app/chatbots/${chatbotId}`}>
            <Button variant='ghost' size='sm' className='text-foreground hover:bg-white/10'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold text-foreground'>Deploy Chatbot</h1>
            {share && <Badge className='bg-green-600 text-white mt-2'>Deployed</Badge>}
          </div>
        </div>
      </div>

      <div className='container mx-auto px-6 py-8 max-w-4xl'>
        {!share ? (
          <Card className='border-border/50 bg-card/50 mb-8'>
            <CardHeader>
              <CardTitle>Deploy Your Chatbot</CardTitle>
              <CardDescription>Make your chatbot publicly accessible.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Alert>
                <Globe className='h-4 w-4' />
                <AlertDescription className='text-foreground'>
                  Deploying will generate a public link. Anyone with this link can interact with your chatbot.
                </AlertDescription>
              </Alert>
              <div className='flex items-center space-x-2'>
                <Switch id='expires' checked={expires} onCheckedChange={setExpires} />
                <Label htmlFor='expires'>Set an expiration date</Label>
              </div>
              {expires && (
                <DateTimePicker date={expiryDate} setDate={setExpiryDate} />
              )}
              <Button
                onClick={handleDeploy}
                disabled={deploying || (expires && !expiryDate)}
                className='w-full bg-black hover:bg-gray-900 text-white border border-white/20'
              >
                {deploying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Globe className='mr-2 h-4 w-4' />}
                Deploy Chatbot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
              <Card className='border-green-600/50 bg-green-600/10'>
                <CardHeader>
                  <CardTitle className='text-green-400'>Deployment Status</CardTitle>
                  {share.expires_at && <p className='text-sm text-green-300 pt-2'>{countdown}</p>}
                </CardHeader>
                <CardContent>
                  <Badge className='bg-green-600 text-white mb-4'>Active</Badge>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Your chatbot is live. Anyone with the link can access it.
                  </p>
                  <Button
                    variant='outline'
                    onClick={handleUndeploy}
                    disabled={deploying}
                    className='w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent'
                  >
                    {deploying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Undeploy Chatbot'}
                  </Button>
                </CardContent>
              </Card>

              <Card className='border-border/50 bg-card/50'>
                <CardHeader>
                  <CardTitle>Public URL</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex gap-2'>
                    <Input value={deployUrl} readOnly className='bg-background/50 border-border/50 text-foreground text-sm' />
                    <Button onClick={() => copyToClipboard(deployUrl, 'url')} className='bg-white hover:bg-gray-200 text-black px-3'>
                      {copied === 'url' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                    </Button>
                  </div>
                  <Link href={deployUrl} target='_blank'>
                    <Button className='w-full border-border/50 text-foreground hover:bg-white/10 bg-transparent'>
                      <Share2 className='mr-2 h-4 w-4' />
                      Open Public Link
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue='embed' className='w-full'>
               <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-border/50">
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
                <TabsTrigger value="iframe">iframe</TabsTrigger>
              </TabsList>
              <TabsContent value='embed'>
                <Card className='border-border/50 bg-card/50'>
                  <CardHeader>
                      <CardTitle>Embed Widget</CardTitle>
                      <CardDescription>Add this code to your website to embed the chatbot widget</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto'>
                      <pre className='text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words'>{embedCode}</pre>
                    </div>
                    <Button onClick={() => copyToClipboard(embedCode, 'embed')} className='w-full bg-white hover:bg-gray-200 text-black'>
                      {copied === 'embed' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}Copy Embed Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value='iframe'>
                <Card className='border-border/50 bg-card/50'>
                   <CardHeader>
                    <CardTitle>iframe Embed</CardTitle>
                    <CardDescription>Embed your chatbot using an iframe tag</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto'>
                      <pre className='text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words'>{iframeCode}</pre>
                    </div>
                    <Button onClick={() => copyToClipboard(iframeCode, 'iframe')} className='w-full bg-white hover:bg-gray-200 text-black'>
                      {copied === 'iframe' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}Copy iframe Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
