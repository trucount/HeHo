
import { NextRequest, NextResponse } from "next/server";
import { supabaseOAuthConfig } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

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
        redirect_uri: new URL("/app/setup", req.url).origin,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Error fetching token:", tokenData.error_description);
      return NextResponse.json({ error: "Failed to fetch Supabase token" }, { status: 400 });
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
        return NextResponse.json({ error: "Failed to fetch Supabase projects" }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
