
import { NextRequest, NextResponse } from "next/server";
import { supabaseOAuthConfig } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  // --- START: Environment Variable Check ---
  if (!supabaseOAuthConfig.clientId || !supabaseOAuthConfig.clientSecret) {
    const errorMessage = "Missing Supabase OAuth environment variables. Please check your `.env.local` file and ensure SUPABASE_OAUTH_CLIENT_ID and SUPABASE_OAUTH_CLIENT_SECRET are set, then restart your development server.";
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  // --- END: Environment Variable Check ---

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const redirectUri = `${new URL(req.url).origin}/app/setup`;

  try {
    // Exchange code for an access token
    const tokenResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: supabaseOAuthConfig.clientId,
        client_secret: supabaseOAuthConfig.clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      const errorDescription = tokenData.error_description || "The response from Supabase did not include a valid access token. Please verify your Client ID and Secret in your .env.local file.";
      console.error("Error fetching token:", tokenData);
      return NextResponse.json({ error: `Failed to fetch Supabase token: ${errorDescription}` }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Fetch projects using the access token
    const projectsResponse = await fetch("https://api.supabase.com/v1/projects", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const projects = await projectsResponse.json();
    
    if (!projectsResponse.ok) {
        console.error("Error fetching projects:", projects);
        const errorMessage = projects?.error_description || projects?.error?.message || JSON.stringify(projects);
        return NextResponse.json({ error: `Failed to fetch Supabase projects: ${errorMessage}` }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
