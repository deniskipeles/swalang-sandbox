"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { ChevronDown } from "lucide-react";

// Types to handle the nested version data, now with astra_snapshot_version
interface ProjectVersion {
  id: string;
  version_label: string;
  created_at: string;
  astra_snapshot_version: string;
}

interface ProjectWithVersions {
  id: string;
  name: string;
  description: string | null;
  project_versions: ProjectVersion[];
}

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  
  const [projects, setProjects] = useState<ProjectWithVersions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState(""); // State for description
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user) return;
      setIsLoading(true);

      let query = supabase
        .from('projects')
        // Fetch the astra_snapshot_version needed for the links
        .select('id, name, description, project_versions(id, version_label, created_at, astra_snapshot_version)')
        .order('created_at', { foreignTable: 'project_versions', ascending: false });

      if (searchQuery.trim()) {
        query = query.textSearch('ts', searchQuery.trim(), { config: 'english', type: 'plain' });
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setError("Could not load your projects.");
      } else {
        setProjects(data as ProjectWithVersions[] || []);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [session, supabase, searchQuery]);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the description along with the name
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      router.push(`/project/${result.projectId}`);
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setError(`Creation failed: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!session) {
    return (
      <main className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md text-center bg-card border rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-card-foreground">Welcome to Swalang Sandbox</h1>
          <p className="text-foreground/80 mb-8">
            Please sign in to create and manage your projects.
          </p>
          <Link href="/auth/login" className="inline-block w-full px-4 py-3 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Projects</h1>
        
        <div className="mb-8 p-6 bg-card border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Create a New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
              placeholder="my-awesome-project" 
              required
              className="w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your project (optional)"
              rows={2}
              className="w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button 
              type="submit" 
              disabled={isCreating || !projectName.trim()} 
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </button>
          </form>
          {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
        </div>

        <div>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search projects by name..." 
            className="w-full px-4 py-2 bg-background border rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {isLoading ? <p className="text-center text-foreground/80">Loading projects...</p> : (
            <ul className="space-y-4">
              {projects.length === 0 && !searchQuery && (
                <p className="text-center text-foreground/80">You don't have any projects yet. Create one above to get started!</p>
              )}
              {projects.length === 0 && searchQuery && (
                <p className="text-center text-foreground/80">No projects found for "{searchQuery}".</p>
              )}
              {projects.map(p => (
                <li key={p.id} className="bg-card border rounded-lg overflow-hidden">
                  <div className="p-4 hover:bg-foreground/5 transition-colors">
                    <Link href={`/project/${p.id}`} className="block">
                      <h3 className="font-bold text-lg text-blue-500 dark:text-blue-400">{p.name}</h3>
                      <p className="text-sm text-foreground/70 mt-1">{p.description || 'No description'}</p>
                    </Link>

                    {p.project_versions && p.project_versions.length > 0 && (
                      <details className="mt-3 group">
                        <summary className="flex items-center cursor-pointer text-sm font-medium text-foreground/60 hover:text-foreground/90 list-none">
                          View Versions ({p.project_versions.length})
                          <ChevronDown className="h-4 w-4 ml-1 transition-transform group-open:rotate-180" />
                        </summary>
                        <ul className="mt-2 pl-4 border-l space-y-2">
                          {p.project_versions.map(v => (
                            <li key={v.id} className="text-xs text-foreground/70">
                              <Link 
                                href={`/project/${p.id}?version=${v.astra_snapshot_version}`} 
                                className="inline-block hover:underline"
                              >
                                <span className="font-mono bg-foreground/10 px-1.5 py-0.5 rounded-sm">{v.version_label}</span>
                                <span className="ml-2">
                                  {new Date(v.created_at).toLocaleString()}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}