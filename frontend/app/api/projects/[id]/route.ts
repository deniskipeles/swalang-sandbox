import { NextRequest, NextResponse } from "next/server";
import createSupabaseServerClient from "@/lib/supabase/server";
import { ASTRA_API } from "@/lib/astra";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tree } = await req.json();
  if (!tree) {
    return NextResponse.json({ error: "File tree is required" }, { status: 400 });
  }
  
  try {
    // 1. Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
        return NextResponse.json({ error: "Project not found or you do not have permission" }, { status: 404 });
    }

    // 2. Save the new snapshot to Astra via Go API
    const astraResponse = await fetch(`${ASTRA_API}/api/projects/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tree }),
    });

    if (!astraResponse.ok) {
        const errorBody = await astraResponse.text();
        throw new Error(`Astra API error: ${errorBody}`);
    }

    const { version, size } = await astraResponse.json();
    
    // 3. Create a new version record in Supabase
    const { error: rpcError } = await supabase.rpc("create_project_version", {
      p_project_id: projectId,
      p_astra_version: version,
      p_size_bytes: size,
      p_version_label: `autosave-${new Date().toISOString()}`,
    });

    if (rpcError) {
      throw rpcError;
    }

    // 4. Return success
    return NextResponse.json({ success: true, version, size }, { status: 200 });

  } catch (err: any) {
    console.error(`Failed to save project ${projectId}:`, err);
    return NextResponse.json({ error: `Save failed: ${err.message}` }, { status: 500 });
  }
}
