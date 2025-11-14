import { NextRequest } from "next/server";
import { getAllProjectData } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  
  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  const data = await getAllProjectData(projectId);
  return Response.json(data);
}