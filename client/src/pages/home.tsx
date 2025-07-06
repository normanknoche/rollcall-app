import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Layers, CheckCircle, Code, Table, History, Github, HelpCircle } from "lucide-react";

interface Filament {
  id: number;
  name: string;
  material: string;
  color: string;
  diameter: string;
  price: string;
  brand?: string;
  description?: string;
  temperature_range?: string;
  properties?: string;
}

interface SearchResult {
  filaments: Filament[];
  llmResponse: string;
  query: string;
}

interface ServiceStatus {
  flowise: { running: boolean };
  database: { connected: boolean };
  server: { running: boolean };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Filament[]>([]);
  const [llmResponse, setLlmResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service status
  const { data: status } = useQuery<ServiceStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  // Fetch all filaments
  const { data: filaments = [], isLoading: filamentsLoading } = useQuery<Filament[]>({
    queryKey: ["/api/filaments"],
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search", { query });
      return response.json() as Promise<SearchResult>;
    },
    onSuccess: (data) => {
      setSearchResults(data.filaments);
      setLlmResponse(data.llmResponse);
      
      // Update recent queries
      setRecentQueries(prev => {
        const updated = [data.query, ...prev.filter(q => q !== data.query)].slice(0, 5);
        return updated;
      });
      
      toast({
        title: "Search completed",
        description: `Found ${data.filaments.length} filaments matching your query.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery);
  };

  const handleRecentQueryClick = (query: string) => {
    setSearchQuery(query);
    searchMutation.mutate(query);
  };

  // Load recent queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentQueries");
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }
  }, []);

  // Save recent queries to localStorage
  useEffect(() => {
    localStorage.setItem("recentQueries", JSON.stringify(recentQueries));
  }, [recentQueries]);

  const displayResults = searchResults.length > 0 ? searchResults : filaments;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Layers className="text-primary text-2xl mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Flowise Filament Search</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${status?.flowise.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Flowise</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${status?.database.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Search Filaments</h2>
              <p className="text-gray-600">Query your filament database using natural language powered by Flowise LLM</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <Input
                type="text"
                placeholder="Search filaments by name, material, color, or properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-12 py-4 text-lg"
              />
              <Button
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="absolute inset-y-0 right-0 mr-1 my-1"
              >
                {searchMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "→"
                )}
              </Button>
            </div>
            
            {/* Loading state */}
            {searchMutation.isPending && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                  Querying Flowise LLM...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="text-primary mr-2" size={20} />
                Search Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filamentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayResults.map((filament) => (
                    <div key={filament.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{filament.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">Material: {filament.material}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <Badge variant="secondary">{filament.color}</Badge>
                            <span className="text-sm text-gray-500">{filament.diameter}mm</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-900">${filament.price}</span>
                          <p className="text-sm text-gray-500">per spool</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="text-primary mr-2" size={20} />
                API Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Available Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100 text-green-800">GET</Badge>
                      <code className="text-gray-600">/api/filaments</code>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800">POST</Badge>
                      <code className="text-gray-600">/api/search</code>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Database Tables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Table className="mr-2" size={16} />
                      <span>filaments</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Table className="mr-2" size={16} />
                      <span>projects</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Table className="mr-2" size={16} />
                      <span>project_filaments</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Service Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Flowise Backend</span>
                      <Badge variant={status?.flowise.running ? "default" : "destructive"} className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1" size={12} />
                        {status?.flowise.running ? "Running" : "Stopped"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Supabase Connection</span>
                      <Badge variant={status?.database.connected ? "default" : "destructive"} className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1" size={12} />
                        {status?.database.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Express Server</span>
                      <Badge variant={status?.server.running ? "default" : "destructive"} className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1" size={12} />
                        {status?.server.running ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Queries */}
        {recentQueries.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="text-primary mr-2" size={20} />
                Recent Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentQueryClick(query)}
                    className="text-sm"
                  >
                    "{query}"
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Powered by Flowise & Supabase</span>
              <span className="text-gray-300">|</span>
              <span>Node.js Express Server</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <Github size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <HelpCircle size={16} />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
