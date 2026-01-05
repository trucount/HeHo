
import { NextRequest, NextResponse } from "next/server";
import { supabaseOAuthConfig } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const clientId = supabaseOAuthConfig.clientId;
  const clientSecret = supabaseOAuthConfig.clientSecret;

  // --- START: Enhanced Debug Logging ---
  if (!clientId || !clientSecret) {
    const errorMessage = "CRITICAL: Missing Supabase OAuth environment variables. Please check your Vercel project settings and ensure SUPABASE_OAUTH_CLIENT_ID and SUPABASE_OAUTH_CLIENT_SECRET are set, then redeploy.";
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  // Log non-sensitive parts of the credentials for debugging
  console.log("DEBUG: Supabase OAuth Config Loaded.");
  console.log(`DEBUG: Client ID (first 5): ${clientId.substring(0, 5)}`);
  console.log(`DEBUG: Client ID (last 5): ${clientId.substring(clientId.length - 5)}`);
  console.log(`DEBUG: Client Secret Length: ${clientSecret.length}`);
  // --- END: Enhanced Debug Logging ---

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const redirectUri = `${new URL(req.url).origin}/app/setup`;

  try {
    const tokenResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      const errorDescription = tokenData.error_description || "The response from Supabase did not include a valid access token. Please double-check the values in your Vercel environment variables and redeploy.";
      console.error("Error fetching token from Supabase:", tokenData);
      return NextResponse.json({ error: `Failed to fetch Supabase token: ${errorDescription}` }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

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
    console.error("Internal Server Error during token exchange:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
