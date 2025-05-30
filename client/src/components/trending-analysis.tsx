import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Lightbulb, Calendar, Trash2, CheckCircle } from 'lucide-react';

interface TrendingTopic {
  keyword: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'crypto' | 'trading' | 'defi' | 'nft' | 'general';
  relevanceScore: number;
}

interface ContentIdea {
  id: number;
  content: string;
  type: string;
  used: boolean;
  createdAt: string;
}

interface AnalysisResult {
  trendingTopics: TrendingTopic[];
  contentIdeas: ContentIdea[];
  scheduledPosts: number;
  analysisTimestamp: string;
}

const TrendingAnalysis: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('topics');

  // Fetch trending analysis
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['trending-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/trending/analysis');
      if (!response.ok) throw new Error('Failed to fetch trending analysis');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch content ideas
  const { data: ideasData, isLoading: ideasLoading } = useQuery({
    queryKey: ['content-ideas'],
    queryFn: async () => {
      const response = await fetch('/api/trending/content-ideas?limit=20');
      if (!response.ok) throw new Error('Failed to fetch content ideas');
      return response.json();
    },
  });

  // Run full analysis
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/trending/content-ideas/generate', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to run analysis');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `Found ${data.data.trendingTopics.length} trending topics and generated ${data.data.contentIdeas.length} content ideas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['trending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run trending analysis",
        variant: "destructive",
      });
    },
  });

  // Mark idea as used
  const useIdeaMutation = useMutation({
    mutationFn: async (ideaId: number) => {
      const response = await fetch(`/api/trending/content-ideas/${ideaId}/use`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark idea as used');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      toast({
        title: "Success",
        description: "Content idea marked as used",
      });
    },
  });

  // Delete idea
  const deleteIdeaMutation = useMutation({
    mutationFn: async (ideaId: number) => {
      const response = await fetch(`/api/trending/content-ideas/${ideaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete idea');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      toast({
        title: "Success",
        description: "Content idea deleted",
      });
    },
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crypto': return 'bg-orange-500';
      case 'defi': return 'bg-purple-500';
      case 'nft': return 'bg-pink-500';
      case 'trading': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trending Analysis</h2>
          <p className="text-muted-foreground">
            Real-time analysis of trending topics and automated content generation
          </p>
        </div>
        <Button 
          onClick={() => analysisMutation.mutate()}
          disabled={analysisMutation.isPending}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {analysisMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topics">Trending Topics</TabsTrigger>
          <TabsTrigger value="ideas">Content Ideas</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Topics
              </CardTitle>
              <CardDescription>
                Current trending topics based on social media and market analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : topicsData?.data?.trendingTopics?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topicsData.data.trendingTopics.map((topic: TrendingTopic, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">{topic.keyword}</h3>
                        <Badge className={getCategoryColor(topic.category)}>
                          {topic.category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Relevance Score</span>
                          <span className="font-medium">{Math.round(topic.relevanceScore)}</span>
                        </div>
                        <Progress value={topic.relevanceScore} className="h-2" />
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${getSentimentColor(topic.sentiment)} text-white border-0`}
                          >
                            {topic.sentiment}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Volume: {topic.volume.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No trending topics found. Run an analysis to get started.
                  {topicsData?.error && (
                    <p className="text-red-500 mt-2">Error: {topicsData.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Content Ideas
              </CardTitle>
              <CardDescription>
                AI-generated content ideas based on trending topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ideasLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : ideasData?.data?.length > 0 ? (
                <div className="space-y-4">
                  {ideasData.data.map((idea: ContentIdea) => (
                    <Card key={idea.id} className={`p-4 ${idea.used ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{idea.type}</Badge>
                            {idea.used && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Used
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {new Date(idea.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{idea.content}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!idea.used && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => useIdeaMutation.mutate(idea.id)}
                              disabled={useIdeaMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteIdeaMutation.mutate(idea.id)}
                            disabled={deleteIdeaMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No content ideas found. Run an analysis to generate ideas.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendingAnalysis;