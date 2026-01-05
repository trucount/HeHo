
import { NextRequest, NextResponse } from "next/server";
import { supabaseOAuthConfig } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const redirectUri = `${new URL(req.url).origin}/app/setup`;

  try {
    const requestBody = {
      grant_type: "authorization_code",
      client_id: supabaseOAuthConfig.clientId,
      client_secret: supabaseOAuthConfig.clientSecret,
      code: code,
      redirect_uri: redirectUri,
    };

    const tokenResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(requestBody).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      const errorDescription = tokenData.error_description || `The Supabase API responded with an error: ${JSON.stringify(tokenData)}`;
      console.error("Error fetching token from Supabase:", errorDescription);
      return NextResponse.json({ error: `Failed to fetch Supabase token. ${errorDescription}` }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const providerToken = tokenData.access_token; // Using access token as provider token

    const projectsResponse = await fetch("https://api.supabase.com/v1/projects", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const projects = await projectsResponse.json();
    
    if (!projectsResponse.ok) {
        console.error("Error fetching projects:", projects);
        const errorMessage = projects?.message || projects?.error_description || projects?.error || JSON.stringify(projects);
        return NextResponse.json({ error: `Failed to fetch Supabase projects: ${errorMessage}` }, { status: 500 });
    }

    const projectsWithKeys = await Promise.all(
      projects.map(async (project: { id: string; name: string; ref: string }) => {
        const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/api-keys`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const keysData = await keysResponse.json();

        if (!keysResponse.ok) {
            console.error(`Failed to fetch API keys for project ${project.ref}:`, keysData);
            return { ...project, anonKey: null, error: `Failed to fetch keys: ${keysData.message || "Unknown error"}` };
        }

        if (!Array.isArray(keysData)) {
            console.error(`API keys for project ${project.ref} is not an array:`, keysData);
            return { ...project, anonKey: null, error: "Unexpected response from Supabase API for keys." };
        }

        const anonKeyObject = keysData.find((k: any) => k.name === 'anon');

        if (!anonKeyObject || typeof anonKeyObject.api_key !== 'string') {
             console.error(`Anon key not found or invalid for project ${project.ref}`, anonKeyObject);
             return { ...project, anonKey: null, error: "Anon key not found for this project." };
        }

        return { ...project, anonKey: anonKeyObject.api_key };
      })
    );

    return NextResponse.json({
      projects: projectsWithKeys,
      provider_token: providerToken,
      refresh_token: refreshToken,
    });

  } catch (error) {
    console.error("Internal Server Error during token exchange:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
