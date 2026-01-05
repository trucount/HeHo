
import { NextRequest, NextResponse } from "next/server";
import { supabaseOAuthConfig } from "@/lib/supabase/config";

async function getOrganizationId(accessToken: string): Promise<string | null> {
  const orgsResponse = await fetch("https://api.supabase.com/v1/organizations", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!orgsResponse.ok) {
    console.error("Failed to fetch organizations");
    return null;
  }
  const orgs = await orgsResponse.json();
  return orgs.length > 0 ? orgs[0].id : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let providerTokenToReturn: string | null = null;

  try {
    // Case 1: Initial connection with an authorization code
    if (code) {
      const redirectUri = `${new URL(req.url).origin}/app/setup`;
      const requestBody = {
        grant_type: "authorization_code",
        client_id: supabaseOAuthConfig.clientId,
        client_secret: supabaseOAuthConfig.clientSecret,
        code: code,
        redirect_uri: redirectUri,
      };

      const tokenResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(requestBody).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        const errorDescription = tokenData.error_description || `Supabase API error: ${JSON.stringify(tokenData)}`;
        console.error("Error fetching token:", errorDescription);
        return NextResponse.json({ error: `Failed to fetch Supabase token. ${errorDescription}` }, { status: 400 });
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      providerTokenToReturn = tokenData.access_token;
    } else {
      // Case 2: Refreshing project list with an existing provider token
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
      } else {
        return NextResponse.json({ error: "No code or authorization token provided" }, { status: 400 });
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Fetch projects, keys, and organization ID using the access token
    const projectsResponse = await fetch("https://api.supabase.com/v1/projects", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projects = await projectsResponse.json();

    if (!projectsResponse.ok) {
      const errorMessage = projects?.message || JSON.stringify(projects);
      console.error("Error fetching projects:", errorMessage);
      return NextResponse.json({ error: `Failed to fetch Supabase projects: ${errorMessage}` }, { status: 500 });
    }

    let organizationId = projects.length > 0 ? projects[0].organization_id : null;
    if (!organizationId) {
      organizationId = await getOrganizationId(accessToken);
    }

    const projectsWithKeys = await Promise.all(
      (projects || []).map(async (project: any) => {
        const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/api-keys`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const keysData = await keysResponse.json();
        const anonKey = (keysData || []).find((k: any) => k.name === 'anon')?.api_key;
        return { ...project, anonKey: anonKey || null };
      })
    );

    return NextResponse.json({
      projects: projectsWithKeys,
      provider_token: providerTokenToReturn,
      refresh_token: refreshToken,
      organization_id: organizationId,
    });

  } catch (error) {
    console.error("Internal Server Error in GET /api/supabase-projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
