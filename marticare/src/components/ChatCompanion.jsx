import React, { useState, useRef, useEffect } from 'react';
import './ChatCompanion.css';

export default function ChatCompanion() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hello Mama! 🌸 I'm your MaatriCare companion. How are you feeling today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const chatRef = useRef(null);

    // Close when clicking outside the chat box
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                // Optional: keep open or close on outside click. 
                // Leaving it manual via the toggle button prevents accidental closures.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch response');

            setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, { sender: 'ai', text: "I'm having a little trouble connecting right now, but I'm always here for you, Mama!" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mc-chat-wrapper" ref={chatRef}>
            {!isOpen ? (
                /* Stable Trigger Button (The Flower Icon) */
                <button
                    className="mc-chat-toggle-btn"
                    onClick={() => setIsOpen(true)}
                    title="Open AI Companion"
                >
                    🌸 <span>Chat with AI</span>
                </button>
            ) : (
                /* Expanded Chat Window */
                <div className="mc-chat-box">
                    <div className="mc-chat-header">
                        <span>🌸 Maatri Companion</span>
                        <button
                            className="mc-chat-close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mc-chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`mc-chat-bubble ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && <div className="mc-chat-bubble ai typing">Thinking...</div>}
                    </div>

                    <form onSubmit={handleSend} className="mc-chat-input-form">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask how you're feeling..."
                        />
                        <button type="submit" disabled={loading}>Send</button>
                    </form>
                </div>
            )}
        </div>
    );
}