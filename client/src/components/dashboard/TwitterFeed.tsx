import React from 'react';
import { useTwitter } from '@/hooks/use-twitter';
import { formatDate, timeAgo } from '@/lib/utils';
import { CyberButton } from '@/components/ui/cyber-button';
import { Link } from 'wouter';

interface TwitterFeedProps {
  maxPosts?: number;
  showHeader?: boolean;
  className?: string;
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ 
  maxPosts = 10, 
  showHeader = true, 
  className = '' 
}) => {
  const { posts, isLoadingPosts, isTwitterConnected } = useTwitter();

  // Filtra solo i post pubblicati e ordinali per data di creazione
  const publishedPosts = posts
    .filter(post => post.published && post.twitterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxPosts);

  if (!isTwitterConnected) {
    return (
      <div className={`bg-gradient-to-br from-spaceBlack/80 to-cyberBlue/10 backdrop-blur border border-cyberBlue/30 rounded-lg p-6 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-future text-cyberBlue flex items-center">
              <i className="fab fa-x-twitter mr-2"></i>
              Twitter Feed
            </h3>
          </div>
        )}
        
        <div className="text-center py-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyberBlue/10 to-neonGreen/10 border border-cyberBlue/30 mb-4">
            <i className="fab fa-x-twitter text-cyberBlue text-3xl"></i>
          </div>
          <h4 className="text-lg font-future text-cyberBlue mb-2">Twitter Not Connected</h4>
          <p className="text-matrixGreen/70 mb-6">Connect your Twitter account to see your posts feed</p>
          <Link href="/settings">
            <CyberButton
              iconLeft={<i className="fas fa-plug-circle-plus"></i>}
              className="bg-gradient-to-r from-cyberBlue/20 to-cyberBlue/30 hover:from-cyberBlue/30 hover:to-cyberBlue/40"
            >
              CONNECT TWITTER
            </CyberButton>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingPosts) {
    return (
      <div className={`bg-gradient-to-br from-spaceBlack/80 to-cyberBlue/10 backdrop-blur border border-cyberBlue/30 rounded-lg p-6 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-future text-cyberBlue flex items-center">
              <i className="fab fa-x-twitter mr-2"></i>
              Twitter Feed
            </h3>
          </div>
        )}
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-cyberBlue/20 rounded mb-2"></div>
              <div className="h-16 bg-cyberBlue/10 rounded mb-2"></div>
              <div className="flex space-x-4">
                <div className="h-3 bg-cyberBlue/20 rounded w-16"></div>
                <div className="h-3 bg-cyberBlue/20 rounded w-20"></div>
                <div className="h-3 bg-cyberBlue/20 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (publishedPosts.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-spaceBlack/80 to-cyberBlue/10 backdrop-blur border border-cyberBlue/30 rounded-lg p-6 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-future text-cyberBlue flex items-center">
              <i className="fab fa-x-twitter mr-2"></i>
              Twitter Feed
            </h3>
          </div>
        )}
        
        <div className="text-center py-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyberBlue/10 to-neonGreen/10 border border-cyberBlue/30 mb-4">
            <i className="fas fa-rss text-cyberBlue text-3xl"></i>
          </div>
          <h4 className="text-lg font-future text-cyberBlue mb-2">No Posts Published</h4>
          <p className="text-matrixGreen/70 mb-6">Your published Twitter posts will appear here</p>
          <Link href="/manual-post">
            <CyberButton
              iconLeft={<i className="fas fa-pen-to-square"></i>}
              className="bg-gradient-to-r from-cyberBlue/20 to-neonGreen/20 hover:from-cyberBlue/30 hover:to-neonGreen/30"
            >
              CREATE FIRST POST
            </CyberButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-spaceBlack/80 to-cyberBlue/10 backdrop-blur border border-cyberBlue/30 rounded-lg p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-future text-cyberBlue flex items-center">
            <i className="fab fa-x-twitter mr-2"></i>
            Twitter Feed
            <span className="ml-2 px-2 py-1 bg-neonGreen/20 text-neonGreen text-xs rounded-md font-mono">
              {publishedPosts.length} POST{publishedPosts.length !== 1 ? 'S' : ''}
            </span>
          </h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-neonGreen animate-pulse"></div>
            <span className="text-xs text-neonGreen font-mono">LIVE</span>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {publishedPosts.map((post) => (
          <div
            key={post.id}
            className="border border-cyberBlue/20 rounded-lg bg-gradient-to-br from-spaceBlack/90 to-cyberBlue/5 p-4 hover:border-cyberBlue/40 transition-all duration-300 shadow-sm"
          >
            {/* Header del post */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyberBlue/30 to-neonGreen/30 flex items-center justify-center border border-cyberBlue/40">
                  <i className="fab fa-x-twitter text-cyberBlue text-sm"></i>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-techWhite">@neurax_ai</span>
                    {post.aiGenerated && (
                      <span className="text-xs px-2 py-0.5 bg-electricPurple/20 text-electricPurple rounded-md font-mono flex items-center">
                        <i className="fas fa-microchip mr-1"></i>
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-matrixGreen/70">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
              <div className="text-xs text-matrixGreen/50 font-mono">
                ID: {post.id.toString().padStart(4, '0')}
              </div>
            </div>

            {/* Contenuto del post */}
            <div className="mb-3">
              <p className="text-sm text-matrixGreen leading-relaxed">{post.content}</p>
              {post.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-cyberBlue/20">
                  <img 
                    src={post.imageUrl} 
                    alt="Post media" 
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Engagement metrics */}
            {post.engagement && (
              <div className="flex items-center justify-between text-xs border-t border-cyberBlue/20 pt-3">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-matrixGreen/70">
                    <i className="fas fa-heart text-red-400 mr-1"></i>
                    {post.engagement.likes || 0}
                  </span>
                  <span className="flex items-center text-matrixGreen/70">
                    <i className="fas fa-retweet text-neonGreen mr-1"></i>
                    {post.engagement.retweets || 0}
                  </span>
                  <span className="flex items-center text-matrixGreen/70">
                    <i className="fas fa-comment text-cyberBlue mr-1"></i>
                    {post.engagement.replies || 0}
                  </span>
                  <span className="flex items-center text-matrixGreen/70">
                    <i className="fas fa-eye text-electricPurple mr-1"></i>
                    {post.engagement.impressions || 0}
                  </span>
                </div>
                <div className="text-matrixGreen/50">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            )}

            {/* Link al tweet originale */}
            {post.twitterId && (
              <div className="mt-3 pt-3 border-t border-cyberBlue/20">
                <a
                  href={`https://twitter.com/neurax_ai/status/${post.twitterId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-cyberBlue hover:text-neonGreen transition-colors duration-200"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Visualizza su Twitter
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer con link alle analytics */}
      <div className="mt-6 pt-4 border-t border-cyberBlue/20 flex items-center justify-between">
        <div className="text-xs text-matrixGreen/60">
          Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <Link href="/analytics">
          <CyberButton
            size="sm"
            iconLeft={<i className="fas fa-chart-bar"></i>}
            className="bg-gradient-to-r from-cyberBlue/20 to-electricPurple/20 hover:from-cyberBlue/30 hover:to-electricPurple/30 text-xs"
          >
            ANALYTICS COMPLETI
          </CyberButton>
        </Link>
      </div>
    </div>
  );
};

export default TwitterFeed;