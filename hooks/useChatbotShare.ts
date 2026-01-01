import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/provider'
import { useEffect, useState } from 'react'

interface Share {
  share_token: string
  expires_at: string | null
}

export const useChatbotShare = (chatbotId: string) => {
  const { user } = useAuth()
  const supabase = createClient()
  const [share, setShare] = useState<Share | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShare = async () => {
      if (!user) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('chatbot_shares')
          .select('share_token, expires_at')
          .eq('chatbot_id', chatbotId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No share link found, which is a valid state
            setShare(null)
          } else {
            throw error
          }
        } else {
          setShare(data)
        }
      } catch (error) {
        console.error('Error fetching share link:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShare()
  }, [chatbotId, user])

  const generateShareToken = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    )
  }

  const createShareLink = async (expires_at: Date | null) => {
    if (!user) return null

    try {
      const share_token = generateShareToken()
      const { data, error } = await supabase
        .from('chatbot_shares')
        .insert([
          {
            chatbot_id: chatbotId,
            user_id: user.id,
            share_token,
            expires_at: expires_at ? expires_at.toISOString() : null,
          },
        ])
        .select('share_token, expires_at')
        .single()

      if (error) throw error
      
      setShare(data)
      return data
    } catch (error) {
      console.error('Error creating share link:', error)
      return null
    }
  }

  const deleteShareLink = async () => {
    if (!user || !share?.share_token) return

    try {
      const { error } = await supabase
        .from('chatbot_shares')
        .delete()
        .eq('share_token', share.share_token)

      if (error) throw error
      setShare(null)
    } catch (error) {
      console.error('Error deleting share link:', error)
    }
  }

  return { share, loading, createShareLink, deleteShareLink }
}
