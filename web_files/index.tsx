
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Session, Message } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import { 
    ThinkingIcon, 
    ArrowUpIcon, 
    MenuIcon,
    PlusIcon,
    CloseIcon,
    MicIcon,
    ToolsIcon,
    CopyIcon,
    SpeakIcon,
    SummarizeIcon,
    SourceIcon,
    CameraIcon,
    ImageIcon,
    FileIcon,
    DriveIcon,
    CalendarIcon,
    PhotosIcon,
    HomeIcon,
    TasksIcon,
    MapsIcon,
    YoutubeIcon
} from './components/Icons';

const GOOGLE_ICON = (
    <svg className="google-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

const GMAIL_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Updated Models Configuration
const MODELS = [
    { id: 'fast', name: 'מהיר', description: 'ברירת מחדל ותגובה מיידית', modelKey: 'gemini-3-flash-preview', icon: '⚡' },
    { id: 'plus', name: 'פלוס', description: 'שיפור ביכולות ואיזון מושלם', modelKey: 'gemini-3-flash-preview', icon: '✨' },
    { id: 'pro', name: 'פרו', description: 'ביצועים גבוהים למשימות מורכבות', modelKey: 'gemini-3-pro-preview', icon: '💎' },
    { id: 'smart', name: 'חכם', description: 'הכי טוב - יכולות חשיבה מעמיקות', modelKey: 'gemini-3-pro-preview', icon: '🧠', thinking: true },
    { id: 'creator', name: 'יוצר', description: 'יצירת תמונות, וידאו, קוד ותוכן יצירתי', modelKey: 'gemini-3-pro-image-preview', icon: '🎨' }
];

const EXTENSIONS = [
    { id: 'gmail', name: 'Gmail', icon: GMAIL_ICON, color: '#ea4335' },
    { id: 'drive', name: 'Google Drive', icon: <DriveIcon />, color: '#34a853' },
    { id: 'calendar', name: 'יומן גוגל', icon: <CalendarIcon />, color: '#4285f4' },
    { id: 'photos', name: 'גוגל תמונות', icon: <PhotosIcon />, color: '#ea4335' },
    { id: 'tasks', name: 'תזכורות גוגל', icon: <TasksIcon />, color: '#4285f4' },
    { id: 'home', name: 'בית חכם', icon: <HomeIcon />, color: '#34a853' },
    { id: 'docs', name: 'Google Docs', icon: <FileIcon />, color: '#4285f4' },
    { id: 'sheets', name: 'Google Sheets', icon: <FileIcon />, color: '#34a853' },
    { id: 'slides', name: 'Google Slides', icon: <FileIcon />, color: '#fbbc05' },
    { id: 'maps', name: 'גוגל מפות', icon: <MapsIcon />, color: '#34a853' },
    { id: 'meet', name: 'Google Meet', icon: <CameraIcon />, color: '#34a853' },
    { id: 'youtube', name: 'YouTube', icon: <YoutubeIcon />, color: '#ff0000' }
];

function App() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('ivan_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Starting as null (logged out)
  const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'floating' | 'docked'>('docked');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ivan_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, isLoading]);

  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % INITIAL_PLACEHOLDERS.length);
      }, 5000);
      return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const startNewChat = () => {
      setCurrentSessionId(null);
      setIsSidebarOpen(false);
      setInputValue('');
  };

  const handleLogin = () => {
    setUser({
        name: 'יובל',
        email: 'yuval@gmail.com'
    });
    setIsSidebarOpen(false);
  };

  const togglePlusMenu = () => {
      setIsPlusMenuOpen(!isPlusMenuOpen);
      setIsToolsMenuOpen(false);
      setIsModelMenuOpen(false);
  };

  const toggleToolsMenu = () => {
      setIsToolsMenuOpen(!isToolsMenuOpen);
      setShowLoginPrompt(false);
      setIsPlusMenuOpen(false);
      setIsModelMenuOpen(false);
  };

  const toggleModelMenu = () => {
      setIsModelMenuOpen(!isModelMenuOpen);
      setIsPlusMenuOpen(false);
      setIsToolsMenuOpen(false);
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;
    
    setInputValue('');
    setIsLoading(true);
    setIsPlusMenuOpen(false);
    setIsToolsMenuOpen(false);
    setIsModelMenuOpen(false);

    let activeSessionId = currentSessionId;
    let newSessions = [...sessions];

    if (!activeSessionId) {
        activeSessionId = generateId();
        setCurrentSessionId(activeSessionId);
        newSessions = [{
            id: activeSessionId,
            title: trimmedInput.substring(0, 30),
            timestamp: Date.now(),
            messages: []
        }, ...newSessions];
    }

    const userMsg: Message = { id: generateId(), role: 'user', content: trimmedInput };
    const botMsg: Message = { id: generateId(), role: 'bot', content: '', status: 'streaming' };

    newSessions = newSessions.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, userMsg, botMsg]
    } : s);
    setSessions(newSessions);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const isImageRequest = /תמונה|תצייר|תייצר תמונה|צייר|image|generate image|picture|תמונה אמיתית|צור|visualize/i.test(trimmedInput);

        if (activeModel.id === 'creator' || isImageRequest) {
            const imageModel = activeModel.id === 'creator' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
            const response = await ai.models.generateContent({
                model: imageModel,
                contents: [{ parts: [{ text: trimmedInput }], role: "user" }]
            });

            let imageUrl = '';
            let textResponse = '';
            for (const candidate of response.candidates || []) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    } else if (part.text) {
                        textResponse += part.text;
                    }
                }
            }

            setSessions(prev => prev.map(s => s.id === activeSessionId ? {
                ...s,
                messages: s.messages.map(m => m.id === botMsg.id ? { 
                    ...m, 
                    content: textResponse || (imageUrl ? 'הנה התמונה שיצרתי עבורך:' : 'לא הצלחתי ליצור תמונה.'), 
                    imageUrl: imageUrl || undefined,
                    status: 'complete' 
                } : m)
            } : s));
        } else {
            const modelConfig: any = {
                systemInstruction: "אתה אייבן, עוזר אישי בעברית. ענה תמיד בעברית טבעית ומרגיעה. אל תשתמש ביותר מדי עיצוב טקסט, שמור על תשובות ברורות וקצרות אלא אם התבקשת אחרת."
            };
            if (activeModel.thinking) modelConfig.thinkingConfig = { thinkingBudget: 1024 };
            if (activeModel.id === 'plus') modelConfig.systemInstruction += " תן תשובות מפורטות, חכמות ומאוזנות יותר ממצב רגיל.";

            const chat = ai.chats.create({ model: activeModel.modelKey, config: modelConfig });
            const responseStream = await chat.sendMessageStream({ message: trimmedInput });

            let fullText = '';
            for await (const chunk of responseStream) {
                fullText += chunk.text;
                setSessions(prev => prev.map(s => s.id === activeSessionId ? {
                    ...s,
                    messages: s.messages.map(m => m.id === botMsg.id ? { ...m, content: fullText } : m)
                } : s));
            }
            setSessions(prev => prev.map(s => s.id === activeSessionId ? {
                ...s,
                messages: s.messages.map(m => m.id === botMsg.id ? { ...m, status: 'complete' } : m)
            } : s));
        }
    } catch (e: any) {
        console.error(e);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === botMsg.id ? { ...m, content: `אירעה שגיאה: ${e.message}`, status: 'error' } : m)
        } : s));
    } finally {
        setIsLoading(false);
    }
  }, [inputValue, isLoading, currentSessionId, sessions, activeModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const activeSession = sessions.find(s => s.id === currentSessionId);
  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`app-container ${inputMode}`}>
        <DottedGlowBackground opacity={0.2} speedScale={0.3} color="rgba(100, 50, 200, 0.1)" glowColor="rgba(150, 100, 255, 0.4)" />

        <header className="app-header">
            <div className="header-left">
                <button className="icon-btn menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                    <MenuIcon />
                </button>
            </div>
            <div className="header-title">אייבן</div>
            <div className="header-right">
               {user && (
                   <div className="user-avatar-small" onClick={() => alert('מחובר: ' + user.email)}>
                       {user.name.charAt(0)}
                   </div>
               )}
            </div>
        </header>

        <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            <div className="sidebar-content" onClick={e => e.stopPropagation()}>
                <div className="sidebar-header-new">
                    <div className="sidebar-top-row">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="חיפוש בהיסטוריה..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="sidebar-close-btn-new" onClick={() => setIsSidebarOpen(false)}>
                            <CloseIcon />
                        </button>
                    </div>
                    <button className="ellipse-new-chat-new" onClick={startNewChat}>
                        <PlusIcon />
                        <span>שיחה חדשה</span>
                    </button>
                </div>
                <div className="sidebar-history-new">
                    <div className="history-label">היסטוריית שיחות</div>
                    <div className="history-items-container">
                        {filteredSessions.map(s => (
                            <div 
                                key={s.id} 
                                className={`history-item ${s.id === currentSessionId ? 'active' : ''}`}
                                onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }}
                            >
                                {s.title || "שיחה ללא כותרת"}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Login Button at the bottom */}
                {!user && (
                    <div className="sidebar-footer">
                        <button className="google-login-sidebar-btn" onClick={handleLogin}>
                            {GOOGLE_ICON}
                            <span>התחבר עם Google</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        <main className="chat-area" ref={scrollRef}>
            {!activeSession && !isLoading ? (
                <div className="empty-state">
                    <div className="greeting-container">
                        {user ? (
                            <>
                                <h2 className="greeting-text">שלום {user.name},</h2>
                                <div className="drive-status">
                                    <span className="drive-icon-small"><DriveIcon /></span>
                                    <span>האחסון נשמר בדרייב של {user.name}</span>
                                </div>
                            </>
                        ) : (
                            <h2 className="greeting-text guest">אייבן</h2>
                        )}
                        <h3 className="sub-greeting">איך אוכל לעזור?</h3>
                    </div>
                </div>
            ) : (
                <div className="messages-list">
                    {activeSession?.messages.map(m => (
                        <div key={m.id} className={`message-row ${m.role}`}>
                            <div className="message-container-inner">
                                <div className="message-bubble-wrapper">
                                    {m.role === 'bot' && <div className="bot-avatar">א</div>}
                                    <div className="message-bubble">
                                        {m.content && <div className="message-text">{m.content}</div>}
                                        {m.imageUrl && <img src={m.imageUrl} alt="Generated" className="generated-image" />}
                                    </div>
                                </div>
                                {m.role === 'bot' && !m.imageUrl && m.status === 'complete' && (
                                    <div className="bot-action-bar">
                                        <div className="action-divider"></div>
                                        <div className="action-buttons">
                                            <button className="action-btn" title="העתק"><CopyIcon /></button>
                                            <button className="action-btn" title="הקראה"><SpeakIcon /></button>
                                            <button className="action-btn" title="סיכום"><SummarizeIcon /></button>
                                            <button className="action-btn" title="חיפוש מקורות"><SourceIcon /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && activeSession?.messages[activeSession.messages.length - 1]?.status === 'streaming' && (
                        <div className="loading-indicator"><ThinkingIcon className="spin" /></div>
                    )}
                </div>
            )}
        </main>

        <div className={`input-section ${inputMode}`}>
            {/* Plus Menu Sheet */}
            <div className={`plus-menu-sheet ${isPlusMenuOpen ? 'active' : ''}`}>
                <div className="sheet-handle" onClick={() => setIsPlusMenuOpen(false)}><div className="handle-bar" /></div>
                <div className="plus-menu-content">
                    <button className="plus-menu-item" onClick={() => setIsPlusMenuOpen(false)}>
                        <div className="item-icon"><ImageIcon /></div>
                        <span>תמונה</span>
                    </button>
                    <button className="plus-menu-item" onClick={() => setIsPlusMenuOpen(false)}>
                        <div className="item-icon"><CameraIcon /></div>
                        <span>מצלמה</span>
                    </button>
                    <button className="plus-menu-item" onClick={() => setIsPlusMenuOpen(false)}>
                        <div className="item-icon"><FileIcon /></div>
                        <span>קובץ</span>
                    </button>
                    <button className="plus-menu-item" onClick={() => setIsPlusMenuOpen(false)}>
                        <div className="item-icon"><DriveIcon /></div>
                        <span>דרייב</span>
                    </button>
                </div>
            </div>

            {/* Model Selection Sheet */}
            <div className={`plus-menu-sheet model-menu-sheet ${isModelMenuOpen ? 'active' : ''}`}>
                <div className="sheet-handle" onClick={() => setIsModelMenuOpen(false)}><div className="handle-bar" /></div>
                <div className="plus-menu-content scrollable">
                    <div className="sheet-title-text">בחר מודל</div>
                    <div className="model-list-container">
                        {MODELS.map(m => (
                            <button 
                                key={m.id} 
                                className={`model-selection-item ${activeModel.id === m.id ? 'active' : ''}`}
                                onClick={() => { setActiveModel(m); setIsModelMenuOpen(false); }}
                            >
                                <div className="model-item-main">
                                    <span className="model-item-icon">{m.icon}</span>
                                    <div className="model-item-info">
                                        <span className="model-item-name">{m.name}</span>
                                        <span className="model-item-desc">{m.description}</span>
                                    </div>
                                </div>
                                {activeModel.id === m.id && <div className="selection-dot" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tools Menu Sheet */}
            <div className={`plus-menu-sheet tools-menu-sheet ${isToolsMenuOpen ? 'active' : ''}`}>
                <div className="sheet-handle" onClick={() => setIsToolsMenuOpen(false)}><div className="handle-bar" /></div>
                <div className="plus-menu-content scrollable">
                    {!showLoginPrompt ? (
                        <div className="connections-list">
                            {EXTENSIONS.map(ext => (
                                <div key={ext.id} className="connection-row">
                                    <div className="connection-info">
                                        <div className="connection-icon" style={{ color: ext.color }}>{ext.icon}</div>
                                        <span className="connection-name">{ext.name}</span>
                                    </div>
                                    <button className="connect-btn" onClick={() => setShowLoginPrompt(true)}>התחבר</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="login-prompt-view">
                            <div className="prompt-content">
                                <h3>נדרשת התחברות</h3>
                                <p>כדי להשתמש בשירות זה עליך להיכנס דרך גוגל</p>
                                <button className="google-signin-big" onClick={handleLogin}>
                                    {GOOGLE_ICON}
                                    <span>כניסה עם גוגל</span>
                                </button>
                            </div>
                            <button className="back-to-tools" onClick={() => setShowLoginPrompt(false)}>חזור לחיבורים</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="input-container">
                <div className="input-field-row">
                    {(!inputValue && !isLoading) && (
                        <div className="input-placeholder">
                            {inputMode === 'docked' ? 'שאל את אייבן' : INITIAL_PLACEHOLDERS[placeholderIndex]}
                        </div>
                    )}
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        autoComplete="off"
                    />
                </div>

                <div className="keyboard-actions-row">
                    <div className="right-actions">
                        <button className={`keyboard-icon-btn ${isPlusMenuOpen ? 'active' : ''}`} onClick={togglePlusMenu}>
                            <PlusIcon />
                        </button>
                        <button className={`keyboard-icon-btn ${isToolsMenuOpen ? 'active' : ''}`} onClick={toggleToolsMenu}>
                            <ToolsIcon />
                        </button>
                    </div>
                    
                    <button className={`model-selection-trigger ${isModelMenuOpen ? 'active' : ''}`} onClick={toggleModelMenu}>
                        <span className="model-trigger-name">{activeModel.name}</span>
                    </button>
                    
                    <div className="left-actions">
                        <button className="keyboard-icon-btn"><MicIcon /></button>
                        <button className="send-btn circular-send" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                            {isLoading ? <ThinkingIcon className="spin" /> : <ArrowUpIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {(isPlusMenuOpen || isToolsMenuOpen || isModelMenuOpen) && <div className="plus-menu-overlay" onClick={() => { setIsPlusMenuOpen(false); setIsToolsMenuOpen(false); setIsModelMenuOpen(false); }} />}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
