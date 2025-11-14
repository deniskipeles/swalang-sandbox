"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveProject } from "@/lib/astra";
import { initialFileSystem } from "@/lib/constants"; // We'll use this as a template
import type { FileSystemNode } from "@/lib/types";

export default function HomePage() {
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name cannot be empty.");
      return;
    }

    // Basic validation for project ID (slug-like format)
    const projectId = projectName.toLowerCase().trim().replace(/\s+/g, "-");
    if (!/^[a-z0-9-]+$/.test(projectId)) {
        setError("Project name can only contain letters, numbers, and hyphens.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the initialFileSystem as a starter template for the new project
      await saveProject(projectId, initialFileSystem as unknown as FileSystemNode[]);
      // Redirect to the new project's IDE page
      router.push(`/project/${projectId}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError("Failed to create project. It might already exist or the server is unavailable.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="w-full max-w-md text-center bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <h1 className="text-4xl font-bold mb-2">Welcome to Swalang Sandbox</h1>
        <p className="text-gray-400 mb-8">
          Create a persistent project or jump into a temporary playground.
        </p>

        <form onSubmit={handleCreateProject} className="space-y-4">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="your-new-project-name"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            aria-label="Project Name"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </form>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="px-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <Link href="/play">
          <span className="inline-block w-full px-4 py-3 font-semibold bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300">
            Try the Live Playground
          </span>
        </Link>
      </div>
    </main>
  );
}