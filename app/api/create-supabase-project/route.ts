
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { organizationId, projectName, dbPassword, region, providerToken } = await req.json();

    if (!organizationId || !projectName || !dbPassword || !region || !providerToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const createProjectResponse = await fetch("https://api.supabase.com/v1/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        organization_id: organizationId,
        name: projectName,
        db_pass: dbPassword,
        region: region,
        plan: "free",
      }),
    });

    const newProject = await createProjectResponse.json();

    if (!createProjectResponse.ok) {
      return NextResponse.json(
        { error: `Failed to create Supabase project: ${newProject.message || JSON.stringify(newProject)}` },
        { status: createProjectResponse.status }
      );
    }

    return NextResponse.json(newProject);

  } catch (error) {
    console.error("Internal Server Error during project creation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
