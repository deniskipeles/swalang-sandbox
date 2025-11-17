import { NextRequest, NextResponse } from "next/server";
import createSupabaseServerClient from "@/lib/supabase/server";
import { initialFileSystem } from "@/lib/constants";
import { ASTRA_API } from "@/lib/astra";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json(); // Destructure description
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const projectName = name.trim();
  let newProjectId: string | null = null;

  try {
    // 1. Create the project record in Supabase and get the new UUID
    const { data: newProject, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        owner_id: user.id,
        description: description, // Add description to the insert object
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    if (!newProject) throw new Error("Failed to create project and retrieve its ID.");
    
    newProjectId = newProject.id;

    // 2. Save initial snapshot to Astra via Go API using the new UUID
    const astraResponse = await fetch(`${ASTRA_API}/api/projects/${newProjectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tree: initialFileSystem }),
    });

    if (!astraResponse.ok) {
      const errorBody = await astraResponse.text();
      if (newProjectId) await supabase.from('projects').delete().eq('id', newProjectId);
      throw new Error(`Astra API error: ${errorBody}`);
    }

    const { version, size } = await astraResponse.json();

    // 3. Create the first version record in Supabase
    const { error: rpcError } = await supabase.rpc("create_project_version", {
      p_project_id: newProjectId,
      p_astra_version: version,
      p_size_bytes: size,
      p_version_label: "v1.0 - Initial Commit",
    });

    if (rpcError) {
      if (newProjectId) await supabase.from('projects').delete().eq('id', newProjectId);
      throw rpcError;
    }

    // 4. Return the new project ID for redirection
    return NextResponse.json({ projectId: newProjectId }, { status: 201 });

  } catch (err: any) {
    console.error("Project creation failed:", err);
    if (newProjectId) await supabase.from('projects').delete().eq('id', newProjectId);
    return NextResponse.json({ error: `Creation failed: ${err.message}` }, { status: 500 });
  }
}