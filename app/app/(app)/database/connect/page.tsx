'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ConnectTablePage() {
  const [tableName, setTableName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!tableName.trim()) {
      setError("Table name cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.')
      }

      setSuccess(`Successfully connected to table "${tableName}". Redirecting...`)
      // Redirect back to the main database page after a short delay
      setTimeout(() => {
        router.push('/app/database')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Connect a New Table</CardTitle>
          <CardDescription>Enter the name of the table from your Supabase project that you want to connect to.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tableName" className="sr-only">Table Name</label>
              <Input
                id="tableName"
                placeholder="e.g., public.users"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={loading}
                className="bg-background border-border"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default">
                 <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-black hover:bg-gray-900 text-white border border-white/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Connect Table'}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
