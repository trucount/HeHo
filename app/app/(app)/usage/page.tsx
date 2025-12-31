"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Calendar, TrendingUp, Zap, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

type TimeRange = "daily" | "weekly" | "monthly" | "yearly"

interface UsageData {
  date: string
  messages: number
  tokens: number
  apiCalls: number
  dbReads: number
  dbWrites: number
}

export default function UsagePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [stats, setStats] = useState({ totalMessages: 0, totalTokens: 0, totalApiCalls: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUsageData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        // Calculate date range based on selected timeRange
        const now = new Date()
        const startDate = new Date()

        switch (timeRange) {
          case "daily":
            startDate.setDate(now.getDate() - 30)
            break
          case "weekly":
            startDate.setDate(now.getDate() - 90)
            break
          case "monthly":
            startDate.setMonth(now.getMonth() - 12)
            break
          case "yearly":
            startDate.setFullYear(now.getFullYear() - 5)
            break
        }

        const { data: usageRecords, error } = await supabase
          .from("usage")
          .select("*")
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error loading usage:", error)
          setUsageData([])
          setStats({ totalMessages: 0, totalTokens: 0, totalApiCalls: 0 })
          return
        }

        if (usageRecords && usageRecords.length > 0) {
          const processed = usageRecords.map((record: any) => ({
            date: new Date(record.created_at).toLocaleDateString(),
            messages: record.messages || 0,
            tokens: record.tokens || 0,
            apiCalls: record.api_calls || 0,
            dbReads: record.db_reads || 0,
            dbWrites: record.db_writes || 0,
          }))

          setUsageData(processed)

          const totalMessages = processed.reduce((sum, d) => sum + d.messages, 0)
          const totalTokens = processed.reduce((sum, d) => sum + d.tokens, 0)
          const totalApiCalls = processed.reduce((sum, d) => sum + d.apiCalls, 0)

          setStats({ totalMessages, totalTokens, totalApiCalls })
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUsageData()
  }, [timeRange])

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
            <h1 className="text-3xl font-bold text-foreground">Usage Analytics</h1>
            <p className="text-muted-foreground">Track your API usage and analytics</p>
          </div>

        {/* Time Range Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(["daily", "weekly", "monthly", "yearly"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? "default" : "outline"}
              className={
                timeRange === range ? "bg-black text-white" : "border-border/50 text-foreground hover:bg-white/10"
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.totalMessages.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tokens Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{(stats.totalTokens / 1000).toFixed(1)}K</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.totalApiCalls.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Messages & Tokens Trend</CardTitle>
              <CardDescription>Over selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="messages" stroke="#ffffff" name="Messages" />
                    <Line type="monotone" dataKey="tokens" stroke="#888888" name="Tokens" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>API Calls Distribution</CardTitle>
              <CardDescription>Over selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <Legend />
                    <Bar dataKey="apiCalls" fill="#ffffff" name="API Calls" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="border-border/50 bg-card/50 mt-6">
          <CardHeader>
            <CardTitle>Detailed Usage</CardTitle>
            <CardDescription>Day-by-day breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {usageData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Messages</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Tokens</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">API Calls</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">DB Reads</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">DB Writes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.map((row) => (
                      <tr key={row.date} className="border-b border-border/50 hover:bg-white/5">
                        <td className="py-3 px-4 text-foreground">{row.date}</td>
                        <td className="text-right py-3 px-4 text-foreground">{row.messages}</td>
                        <td className="text-right py-3 px-4 text-foreground">{row.tokens.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-foreground">{row.apiCalls}</td>
                        <td className="text-right py-3 px-4 text-foreground">{row.dbReads}</td>
                        <td className="text-right py-3 px-4 text-foreground">{row.dbWrites}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No usage data for this period</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
