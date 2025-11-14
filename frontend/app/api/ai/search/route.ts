import { NextRequest } from "next/server";
// Import the necessary types and functions
import { VectorAI, AIResponse, getAllProjectData, AIContext } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { projectId, query } = await req.json();
  
  if (!projectId || !query) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }

  // 1. Fetch all project data to get the file tree
  const projectData = await getAllProjectData(projectId);

  // 2. Construct the complete AIContext object
  const context: AIContext = {
    projectId: projectId,
    fileTree: projectData.files, // Use the fetched files
    query: query,
  };

  // 3. Call analyze with the correct arguments
  const response: AIResponse = await VectorAI.analyze(projectId, context);
  return Response.json(response);
}