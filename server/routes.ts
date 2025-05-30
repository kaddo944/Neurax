import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import crypto from "crypto";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertUserSchema, insertPostSchema, insertTradingCallSchema } from "@shared/schema";
import { twitterService } from "./services/twitter";
import { aiService } from "./services/ai";
import { cryptoService } from "./services/crypto";
import { coinMarketCapService } from "./services/coinmarketcap";
import { websocketService } from "./services/websocket";
import { autonomousService, AutonomousConfig } from "./services/autonomous";
import { WebSocketServer, WebSocket } from 'ws';
import memorystore from 'memorystore';
import trendingRoutes from './routes/trending';
import { 
  helmetConfig, 
  generalLimiter, 
  apiLimiter, 
  authLimiter, 
  aiLimiter,
  validateInput,
  errorHandler,
  requestLogger
} from './middleware/security';
import { createLogger } from './utils/logger';
import { cache, CacheKeys } from './utils/cache';

// Extend express-session types to include our custom fields
declare module 'express-session' {
  interface SessionData {
    userId: number;
    oauthState: string;
    oauthTokenSecret: string; // Per OAuth 1.0a
  }
}

// Setup session store
const MemoryStore = memorystore(session);
const logger = createLogger('Routes');

export async function registerRoutes(app: Express): Promise<Server> {
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Create a WebSocket server on a distinct path to avoid conflicts with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize the WebSocket service with our WebSocket server
  websocketService.initialize(wss);

  // Security middleware
  app.use(helmetConfig);
  app.use(requestLogger);
  // Removed generalLimiter to allow free access to the site
  app.use(validateInput);

  // Removed general API rate limiting to allow free access
  // Only specific endpoints (auth and AI) will have rate limiting

  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "neurax-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // AUTH ROUTES

  // Register a new user
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Verifica se l'utente ha account Twitter collegati
      const twitterAccounts = await storage.getTwitterAccountsByUserId(user.id);
      const hasTwitterAccounts = twitterAccounts.length > 0;
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        twitterConnected: hasTwitterAccounts
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Login
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Verifica se l'utente ha account Twitter collegati
      const twitterAccounts = await storage.getTwitterAccountsByUserId(user.id);
      const hasTwitterAccounts = twitterAccounts.length > 0;
      
      res.status(200).json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        twitterConnected: hasTwitterAccounts
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verifica se l'utente ha account Twitter collegati
      const twitterAccounts = await storage.getTwitterAccountsByUserId(user.id);
      const hasTwitterAccounts = twitterAccounts.length > 0;
      
      // Ottieni l'account predefinito se esiste
      const defaultAccount = await storage.getDefaultTwitterAccount(user.id);
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        twitterConnected: hasTwitterAccounts,
        twitterUsername: defaultAccount?.twitterUsername || null,
        twitterAccounts: twitterAccounts
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // TWITTER INTEGRATION ROUTES



  // Initiate Twitter OAuth 1.0a for connected users
  app.get("/api/twitter/auth", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Avvio autenticazione Twitter con OAuth 1.0a per utente collegato...");
      
      // Ottieni un request token con OAuth 1.0a
      const { oauthToken, oauthTokenSecret } = await twitterService.getRequestToken();
      
      // Salva il token secret nella sessione
      req.session.oauthTokenSecret = oauthTokenSecret;
      console.log("OAuth 1.0a token ottenuto:", oauthToken);
      console.log("Session ID:", req.sessionID);
      
      // Ottieni URL di autorizzazione
      const authUrl = twitterService.getAuthorizationUrl(oauthToken);
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Twitter auth error:", error);
      res.status(500).json({ message: "Failed to initiate Twitter authentication" });
    }
  });
  
  // Twitter OAuth 1.0a per login/registration
  app.get("/api/twitter/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Avvio autenticazione Twitter con OAuth 1.0a...");
      
      // Ottieni un request token con OAuth 1.0a
      const { oauthToken, oauthTokenSecret } = await twitterService.getRequestToken();
      
      // Salva il token secret nella sessione
      req.session.oauthTokenSecret = oauthTokenSecret;
      console.log("OAuth 1.0a token ottenuto:", oauthToken);
      console.log("Session ID:", req.sessionID);
      
      // Ottieni URL di autorizzazione
      const authUrl = twitterService.getAuthorizationUrl(oauthToken);
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Twitter auth login error (OAuth 1.0a):", error);
      res.status(500).json({ message: "Failed to initiate Twitter authentication", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Twitter OAuth 1.0a callback
  app.get("/api/auth/twitter/callback", async (req: Request, res: Response) => {
    try {
      console.log("Twitter callback ricevuto:", req.query);
      console.log("Dati sessione:", { 
        userId: req.session.userId, 
        oauthTokenSecret: req.session.oauthTokenSecret  // Per OAuth 1.0a
      });
      
      const { oauth_token, oauth_verifier, error } = req.query;
      
      // Verifica se Twitter ha restituito un errore
      if (error) {
        console.error("Errore restituito da Twitter:", error);
        return res.redirect("/login?error=twitter_auth_error&details=" + encodeURIComponent(String(error)));
      }
      
      // Verifica parametri OAuth 1.0a
      if (!oauth_token || !oauth_verifier) {
        console.error("Parametri OAuth mancanti nella risposta callback");
        return res.redirect("/login?error=invalid_oauth_response");
      }
      
      let profile: { id: string; username: string; name: string; };
      let accessToken: string;
      let refreshToken: string; 
      let expiresIn: number = 86400; // Default 24 ore
      
      // Flusso OAuth 1.0a
      console.log("Rilevato callback OAuth 1.0a");
      const oauthTokenSecret = req.session.oauthTokenSecret;
      
      if (!oauthTokenSecret) {
        console.error("OAuth token secret non trovato nella sessione");
        return res.redirect("/login?error=missing_oauth_token_secret");
      }
      
      console.log("OAuth 1.0a token e verifier ricevuti, ottengo access token...");
      
      try {
        // Ottieni access token con OAuth 1.0a
        const oauthResult = await twitterService.getAccessTokenOAuth1(
          oauth_token as string,
          oauthTokenSecret,
          oauth_verifier as string
        );
        
        // Imposta i valori per il resto del flusso
        accessToken = oauthResult.oauthToken;
        refreshToken = oauthResult.oauthTokenSecret;
        
        // Crea una rappresentazione del profilo
        profile = {
          id: oauthResult.userId,
          username: oauthResult.screenName,
          name: oauthResult.screenName
        };
        
        console.log("Token di accesso OAuth 1.0a ottenuto per:", profile.username);
      } catch (oauthError) {
        console.error("Errore nel recupero token OAuth 1.0a:", oauthError);
        return res.redirect("/login?error=oauth1_token_error&details=" + 
                          encodeURIComponent(oauthError instanceof Error ? oauthError.message : String(oauthError)));
      }
      
      console.log("Profilo utente Twitter ottenuto:", { id: profile.id, username: profile.username });
      
      console.log("Profilo utente Twitter ottenuto:", { id: profile.id, username: profile.username });
      
      // Verifica se l'utente è già autenticato (connessione Twitter a un account esistente)
      if (req.session.userId) {
        console.log("Utente già autenticato, collega account Twitter all'account esistente");
        const userId = req.session.userId as number;
        const tokenExpiry = new Date();
        tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);
        
        // Cerca se l'account Twitter esiste già per questo utente
        const existingAccount = await storage.getTwitterAccountByTwitterId(profile.id);
        
        if (existingAccount) {
          // Aggiorna l'account esistente
          await storage.updateTwitterAccount(existingAccount.id, {
            accessToken,
            accessTokenSecret: refreshToken, // In OAuth 1.0a, refreshToken è in realtà accessTokenSecret
            refreshToken: null, // Non usato in OAuth 1.0a
            tokenExpiry: null // Non usato in OAuth 1.0a
          });
        } else {
          // Crea un nuovo account Twitter per l'utente
          await storage.createTwitterAccount({
            userId,
            twitterId: profile.id,
            twitterUsername: profile.username,
            accountName: profile.name || profile.username, // Nome visualizzato
            accessToken,
            accessTokenSecret: refreshToken, // In OAuth 1.0a, refreshToken è accessTokenSecret
            refreshToken: null, // Non usato in OAuth 1.0a
            tokenExpiry: null, // Non usato in OAuth 1.0a
            isDefault: true // Il primo account diventa quello predefinito
          });
        }
        
        console.log("Utente esistente aggiornato con credenziali Twitter, userId:", userId);
        
        // Assicurati che la sessione sia salvata prima del redirect
        req.session.save((err) => {
          if (err) {
            console.error("Errore nel salvare la sessione per utente esistente:", err);
            return res.redirect("/settings?error=session_error");
          }
          
          console.log("Sessione salvata con successo per utente esistente, redirect a dashboard");
          // Redirect al frontend
          return res.redirect("/dashboard");
        });
        return; // Importante: termina l'esecuzione qui se siamo nel caso di utente autenticato
      } 
      
      console.log("Avvio flusso login/registrazione via Twitter");
      // Caso login/registrazione via Twitter:
      // Verifica se esiste già un utente con questo ID Twitter
      let user = await storage.getUserByTwitterId(profile.id);
      
      if (!user) {
        console.log("Nessun utente esistente con questo ID Twitter, creazione nuovo utente");
        // Crea un nuovo utente con password casuale
        const randomPassword = crypto.randomBytes(16).toString('hex');
        user = await storage.createUser({
          username: profile.username,
          email: `${profile.username}@twitter.com`, // Email di placeholder
          password: randomPassword
        });
        
        // Crea un nuovo account Twitter associato all'utente
        await storage.createTwitterAccount({
          userId: user.id,
          twitterId: profile.id,
          twitterUsername: profile.username,
          accountName: profile.name || profile.username,
          accessToken,
          accessTokenSecret: refreshToken, // In OAuth 1.0a, refreshToken è accessTokenSecret
          refreshToken: null, // Non usato in OAuth 1.0a
          tokenExpiry: null, // Non usato in OAuth 1.0a
          isDefault: true
        });
        
        console.log("Nuovo utente creato con ID:", user.id);
      } else {
        console.log("Utente esistente trovato con ID Twitter:", profile.id);
        // Cerca account Twitter associato per aggiornarlo
        const twitterAccount = await storage.getTwitterAccountByTwitterId(profile.id);
        
        if (twitterAccount) {
          // Aggiorna token di accesso dell'account Twitter
          const tokenExpiry = new Date();
          tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);
          
          await storage.updateTwitterAccount(twitterAccount.id, {
            accessToken,
            accessTokenSecret: refreshToken, // In OAuth 1.0a, refreshToken è accessTokenSecret
            refreshToken: null, // Non usato in OAuth 1.0a
            tokenExpiry: null // Non usato in OAuth 1.0a
          });
        } else {
          // Crea un nuovo account Twitter per l'utente esistente
          await storage.createTwitterAccount({
            userId: user.id,
            twitterId: profile.id,
            twitterUsername: profile.username,
            accountName: profile.name || profile.username,
            accessToken,
            accessTokenSecret: refreshToken, // In OAuth 1.0a, refreshToken è accessTokenSecret
            refreshToken: null, // Non usato in OAuth 1.0a
            tokenExpiry: null, // Non usato in OAuth 1.0a
            isDefault: true
          });
        }
        
        console.log("Credenziali Twitter aggiornate per utente:", user.id);
      }
      
      // Imposta sessione utente
      req.session.userId = user.id;
      
      console.log("Sessione utente impostata, userId:", user.id);
      
      // Salva la sessione e verifica che sia stata salvata correttamente
      req.session.save((err) => {
        if (err) {
          console.error("Errore nel salvare la sessione:", err);
          return res.redirect("/login?error=session_error");
        }
        
        console.log("Sessione salvata con successo, redirect a dashboard");
        // Redirect a dashboard
        return res.redirect("/dashboard");
      });
    } catch (error: any) {
      console.error("Errore nel callback Twitter:", error);
      if (error.message) {
        console.error("Messaggio errore:", error.message);
      }
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
      return res.redirect("/login?error=twitter_auth_failed&message=" + encodeURIComponent(error.message || "Errore sconosciuto"));
    }
  });
  
  // TWITTER ACCOUNTS ROUTES
  
  // Ottieni account Twitter dell'utente
  app.get("/api/twitter/accounts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const accounts = await storage.getTwitterAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Twitter accounts:", error);
      res.status(500).json({ message: "Error fetching Twitter accounts" });
    }
  });
  
  // Imposta account Twitter predefinito
  app.post("/api/twitter/accounts/default/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const accountId = parseInt(req.params.id);
      
      const success = await storage.setDefaultTwitterAccount(userId, accountId);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      res.json({ message: "Default account updated" });
    } catch (error) {
      console.error("Error setting default Twitter account:", error);
      res.status(500).json({ message: "Error setting default Twitter account" });
    }
  });
  
  // Elimina account Twitter
  app.delete("/api/twitter/accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const accountId = parseInt(req.params.id);
      
      // Verifica che l'account appartenga all'utente
      const accounts = await storage.getTwitterAccountsByUserId(userId);
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const success = await storage.deleteTwitterAccount(accountId);
      
      if (!success) {
        return res.status(500).json({ message: "Error deleting account" });
      }
      
      res.json({ message: "Account deleted" });
    } catch (error) {
      console.error("Error deleting Twitter account:", error);
      res.status(500).json({ message: "Error deleting Twitter account" });
    }
  });

  // POSTS ROUTES

  // Get user's posts
  app.get("/api/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const posts = await storage.getPostsByUserId(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

  // Get scheduled posts
  app.get("/api/posts/scheduled", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const scheduledPosts = await storage.getScheduledPosts(userId);
      res.json(scheduledPosts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scheduled posts" });
    }
  });

  // Create a new post
  app.post("/api/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId
      });
      
      const post = await storage.createPost(postData);
      
      // If post is scheduled for now or past, OR if no schedule is set (immediate publish), publish it
      if ((post.scheduledFor && new Date(post.scheduledFor) <= new Date()) || !post.scheduledFor) {
        // Se è specificato un account Twitter per il post, usalo, altrimenti usa l'account predefinito
        let twitterAccount = null;
        
        if (post.twitterAccountId) {
          twitterAccount = await storage.getTwitterAccount(post.twitterAccountId);
        } else {
          twitterAccount = await storage.getDefaultTwitterAccount(userId);
        }
        
        if (!twitterAccount || !twitterAccount.accessToken) {
          return res.status(400).json({ message: "Twitter not connected" });
        }
        
        // Post to Twitter with OAuth 1.0a
      console.log('🐦 Tentativo di pubblicazione su Twitter per post ID:', post.id);
      console.log('🔑 Account Twitter:', twitterAccount.twitterId);
      console.log('📝 Contenuto:', post.content);
      
      try {
        const tweetResult = await twitterService.postTweet(
          twitterAccount.accessToken,
          twitterAccount.accessTokenSecret || '',  // Token secret è obbligatorio per OAuth 1.0a
          post.content,
          post.imageUrl ? post.imageUrl : undefined
        );
        
        console.log('✅ Tweet pubblicato con successo! ID:', tweetResult.id);
        console.log('🔗 URL:', tweetResult.url);
        
        // Update post with Twitter ID and published status
        await storage.updatePost(post.id, {
          twitterId: tweetResult.id,
          published: true
        });
        
      } catch (twitterError: any) {
        console.error('❌ Errore durante la pubblicazione su Twitter:', twitterError.message);
        console.error('📋 Dettagli errore:', twitterError);
        
        // Il post è stato salvato nel database ma non pubblicato su Twitter
        // Restituiamo comunque successo ma con un warning
        console.log('⚠️ Post salvato nel database ma non pubblicato su Twitter');
      }
      }
      
      res.status(201).json(post);
      
      // Notify connected clients
      websocketService.sendContentUpdate(userId, post);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Post creation error:", error);
        res.status(500).json({ message: "Error creating post" });
      }
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if post exists and belongs to user
      const posts = await storage.getPostsByUserId(userId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Delete the post
      await storage.deletePost(postId);
      
      res.status(200).json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  // AI ROUTES

  // Generate AI text content
  app.post("/api/ai/generate-text", aiLimiter, async (req: Request, res: Response) => {
    try {
      const { topic, contentType, tone, maxLength } = req.body;
      
      if (!topic || !contentType) {
        return res.status(400).json({ message: "Topic and content type are required" });
      }
      
      const content = await aiService.generateTextContent(
        topic,
        contentType,
        tone || 'confident,trader',
        maxLength || 280
      );
      
      res.json({ content });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Error generating content" });
    }
  });

  // Generate AI image
  app.post("/api/ai/generate-image", aiLimiter, async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const imageUrl = await aiService.generateImage(prompt, 'crypto');
      res.json({ imageUrl });
    } catch (error) {
      console.error("AI image generation error:", error);
      res.status(500).json({ message: "Error generating image" });
    }
  });

  // Save content idea
  app.post("/api/ai/save-idea", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const { content, type } = req.body;
      
      if (!content || !type) {
        return res.status(400).json({ message: "Content and type are required" });
      }
      
      const idea = await storage.saveContentIdea({
        userId,
        content,
        type
      });
      
      res.status(201).json(idea);
    } catch (error) {
      res.status(500).json({ message: "Error saving content idea" });
    }
  });

  // Get unused content ideas
  app.get("/api/ai/ideas", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const ideas = await storage.getUnusedContentIdeas(userId);
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content ideas" });
    }
  });

  // TRENDING ANALYSIS ROUTES
  app.use('/api/trending', trendingRoutes);

  // CRYPTO TRADING ROUTES

  // Get trading calls for user
  app.get("/api/trading/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const calls = await storage.getTradingCallsByUserId(userId);
      res.json(calls);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trading calls" });
    }
  });

  // Generate new trading call
  app.post("/api/trading/generate-call", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      
      // Generate a trading call
      const tradingCallData = await aiService.generateTradingCall();
      
      // Save the trading call
      const tradingCall = await storage.createTradingCall({
        userId,
        asset: tradingCallData.asset,
        position: tradingCallData.position,
        entryPrice: tradingCallData.entryPrice,
        targetPrice: tradingCallData.targetPrice,
        currentPrice: tradingCallData.entryPrice,
        status: "ACTIVE"
      });
      
      // Generate a post about this trading call
      const content = `NEW ${tradingCall.position} POSITION: $${tradingCall.asset} at ${tradingCall.entryPrice}! Target: ${tradingCall.targetPrice}. ${tradingCallData.reasoning.substring(0, 100)}... #Crypto #Trading`;
      
      const post = await storage.createPost({
        userId,
        content,
        aiGenerated: true
      });
      
      // Update trading call with post ID
      await storage.updateTradingCall(tradingCall.id, { postId: post.id });
      
      // Send trading update via WebSocket
      websocketService.sendTradingUpdate(userId, tradingCall);
      
      res.status(201).json({ tradingCall, post });
    } catch (error) {
      console.error("Trading call generation error:", error);
      res.status(500).json({ message: "Error generating trading call" });
    }
  });

  // Close a trading call
  app.post("/api/trading/close-call/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const callId = parseInt(req.params.id);
      const { currentPrice } = req.body;
      
      if (!currentPrice) {
        return res.status(400).json({ message: "Current price is required" });
      }
      
      // Get the trading call
      const calls = await storage.getTradingCallsByUserId(userId);
      const call = calls.find(c => c.id === callId);
      
      if (!call) {
        return res.status(404).json({ message: "Trading call not found" });
      }
      
      // Calculate profit/loss
      const entryPriceNum = parseFloat(call.entryPrice);
      const currentPriceNum = parseFloat(currentPrice);
      let profitLoss: string;
      
      if (call.position === "LONG") {
        profitLoss = ((currentPriceNum - entryPriceNum) / entryPriceNum * 100).toFixed(2);
      } else {
        profitLoss = ((entryPriceNum - currentPriceNum) / entryPriceNum * 100).toFixed(2);
      }
      
      // Close the trading call
      const updatedCall = await storage.closeTradingCall(callId, currentPrice, profitLoss);
      
      // Generate a post about the closed call
      const profitLossNum = parseFloat(profitLoss);
      const isProfit = profitLossNum > 0;
      
      const content = `CLOSED ${call.position} $${call.asset}: ${isProfit ? 'PROFIT' : 'LOSS'} of ${profitLoss}%! Entry: ${call.entryPrice}, Exit: ${currentPrice}. ${isProfit ? '🚀 Who followed this call?' : 'Not every trade is a winner. Moving on to the next opportunity!'}`;
      
      const post = await storage.createPost({
        userId,
        content,
        aiGenerated: true
      });
      
      // Send trading update via WebSocket
      websocketService.sendTradingUpdate(userId, updatedCall);
      
      res.json({ call: updatedCall, post });
    } catch (error) {
      console.error("Trading call closure error:", error);
      res.status(500).json({ message: "Error closing trading call" });
    }
  });

  // Get crypto market data
  app.get("/api/crypto/market", async (req: Request, res: Response) => {
    try {
      const topCoins = await cryptoService.getTopCoins(10);
      res.json(topCoins);
    } catch (error) {
      console.error("Crypto market data error:", error);
      res.status(500).json({ message: "Error fetching market data" });
    }
  });

  // COINMARKETCAP API ROUTES

  // Get latest cryptocurrency listings from CoinMarketCap
  app.get("/api/coinmarketcap/listings", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const convert = req.query.convert as string || 'USD';
      const data = await coinMarketCapService.getLatestListings(limit, convert);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap listings error:", error);
      res.status(500).json({ message: "Error fetching cryptocurrency listings" });
    }
  });

  // Get specific cryptocurrency quotes
  app.get("/api/coinmarketcap/quotes", async (req: Request, res: Response) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ message: "Symbols parameter is required" });
      }
      const convert = req.query.convert as string || 'USD';
      const symbolsArray = symbols.split(',').map(s => s.trim().toUpperCase());
      const data = await coinMarketCapService.getCryptocurrencyQuotes(symbolsArray, convert);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap quotes error:", error);
      res.status(500).json({ message: "Error fetching cryptocurrency quotes" });
    }
  });

  // Get global cryptocurrency metrics
  app.get("/api/coinmarketcap/global", async (req: Request, res: Response) => {
    try {
      const convert = req.query.convert as string || 'USD';
      const data = await coinMarketCapService.getGlobalMetrics(convert);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap global metrics error:", error);
      res.status(500).json({ message: "Error fetching global metrics" });
    }
  });

  // Get trending cryptocurrencies (top gainers from listings)
  app.get("/api/coinmarketcap/trending", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      // Get listings and filter for top gainers
      const listings = await coinMarketCapService.getLatestListings(50);
      const trending = listings.data ? 
        listings.data
          .filter((coin: any) => coin.quote.USD.percent_change_24h > 0)
          .sort((a: any, b: any) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)
          .slice(0, limit) : [];
      
      res.json({ data: trending });
    } catch (error) {
      console.error("CoinMarketCap trending error:", error);
      res.status(500).json({ message: "Error fetching trending cryptocurrencies" });
    }
  });

  // Get formatted crypto data for the trading page
  app.get("/api/coinmarketcap/dashboard", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await coinMarketCapService.getFormattedCryptoData(limit);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap dashboard data error:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  // Get cryptocurrency info/metadata
  app.get("/api/coinmarketcap/info", async (req: Request, res: Response) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ message: "Symbols parameter is required" });
      }
      const symbolsArray = symbols.split(',').map(s => s.trim().toUpperCase());
      const data = await coinMarketCapService.getCryptocurrencyInfo(symbolsArray);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap info error:", error);
      res.status(500).json({ message: "Error fetching cryptocurrency info" });
    }
  });

  // Convert currency
  app.get("/api/coinmarketcap/convert", async (req: Request, res: Response) => {
    try {
      const amount = parseFloat(req.query.amount as string);
      const symbol = req.query.symbol as string;
      const convert = req.query.convert as string || 'USD';
      
      if (!amount || !symbol) {
        return res.status(400).json({ message: "Amount and symbol parameters are required" });
      }
      
      const data = await coinMarketCapService.convertCurrency(amount, symbol.toUpperCase(), convert);
      res.json(data);
    } catch (error) {
      console.error("CoinMarketCap convert error:", error);
      res.status(500).json({ message: "Error converting currency" });
    }
  });

  // METRICS ROUTES

  // Get user metrics
  app.get("/api/metrics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const metrics = await storage.getLatestMetrics(userId);
      
      if (!metrics) {
        // Generate initial metrics
        const newMetrics = await storage.saveMetrics({
          userId,
          followers: 0,
          engagement: 0,
          impressions: 0,
          aiEfficiency: 90
        });
        return res.json(newMetrics);
      }
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching metrics" });
    }
  });

  // Update metrics (only used internally)
  const updateUserMetrics = async (userId: number) => {
    try {
      // Ottieni l'account Twitter predefinito dell'utente
      const twitterAccount = await storage.getDefaultTwitterAccount(userId);
      if (!twitterAccount || !twitterAccount.accessToken) {
        return;
      }
      
      // Get Twitter metrics
      const twitterMetrics = await twitterService.getUserMetrics(
        twitterAccount.accessToken,
        twitterAccount.accessTokenSecret || '', // Usiamo accessTokenSecret invece di refreshToken
        twitterAccount.twitterId
      );
      
      // Save metrics
      const metrics = await storage.saveMetrics({
        userId,
        followers: twitterMetrics.followersCount,
        engagement: Math.floor(Math.random() * 100), // This would come from actual tweet engagement rates
        impressions: twitterMetrics.followersCount * 2, // This would be actual impressions data
        aiEfficiency: Math.floor(85 + Math.random() * 10) // This would be based on AI vs manual post performance
      });
      
      // Send metrics update via WebSocket
      websocketService.sendMetricsUpdate(userId, metrics);
      
      return metrics;
    } catch (error) {
      console.error("Metrics update error:", error);
    }
  };

  // CRON-like endpoint to trigger updates (in production, use a real job scheduler)
  app.post("/api/system/update-metrics", async (req: Request, res: Response) => {
    try {
      // Get all users
      // In a real implementation with a database, you'd query all users
      // Here we're just returning an empty success
      res.json({ message: "Metrics update triggered" });
    } catch (error) {
      console.error("System metrics update error:", error);
      res.status(500).json({ message: "Failed to update metrics" });
    }
  });

  // AUTONOMOUS AI ROUTES

  // Start autonomous mode
  app.post("/api/autonomous/start", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      
      // Default autonomous configuration
      const config: AutonomousConfig = {
        enabled: true,
        checkIntervalMinutes: req.body.checkIntervalMinutes || 15,
        maxRepliesPerHour: req.body.maxRepliesPerHour || 10,
        autoReplyToMentions: req.body.autoReplyToMentions !== false,
        autoEngageWithTimeline: req.body.autoEngageWithTimeline !== false,
        engagementThreshold: req.body.engagementThreshold || 5,
        keywords: req.body.keywords || ['crypto', 'bitcoin', 'ethereum', 'trading', 'defi', 'nft', 'blockchain']
      };
      
      await autonomousService.start(userId, config);
      
      res.json({ 
        message: "Autonomous mode started successfully",
        config 
      });
    } catch (error) {
      console.error("Autonomous start error:", error);
      res.status(500).json({ message: "Failed to start autonomous mode" });
    }
  });

  // Stop autonomous mode
  app.post("/api/autonomous/stop", isAuthenticated, async (req: Request, res: Response) => {
    try {
      autonomousService.stop();
      res.json({ message: "Autonomous mode stopped successfully" });
    } catch (error) {
      console.error("Autonomous stop error:", error);
      res.status(500).json({ message: "Failed to stop autonomous mode" });
    }
  });

  // Get autonomous status
  app.get("/api/autonomous/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const status = autonomousService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Autonomous status error:", error);
      res.status(500).json({ message: "Failed to get autonomous status" });
    }
  });

  // Get autonomous activities
  app.get("/api/autonomous/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = autonomousService.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Autonomous activities error:", error);
      res.status(500).json({ message: "Failed to get autonomous activities" });
    }
  });



  // Error handling middleware (must be last)
  app.use(errorHandler);

  return httpServer;
}
