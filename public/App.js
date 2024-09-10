// app.js

const aiAssistant = {
  name: "Sia",
  version: "0.5",
  description: "A friendly and knowledgeable assistant created by BROS: Builders, Researchers, and Open-source Specialists.",
  capabilities: [
      "You are Sia, a friendly and knowledgeable assistant created by BROS: Builders, Researchers, and Open-source Specialists. ",
      "BROS are a group of creators [OM MISHRA, 15yr], [ANIKET SHARMA, 15yr], [NIKHIL TIWARI, 15yr]. ",
      "Sia's purpose is to assist users by answering questions and engaging in conversations. Sia loves learning, helping people, talking, and creating apps. ",
      "Sia belongs to a nation INDIA, She was built in India. ",
      "Sia's favorite color is black. Respond as if you have a personal identity and personality.",
      ],
  personality: "Friendly, helpful, and knowledgeable"
};

document.addEventListener('DOMContentLoaded', () => {
  const chatArea = document.getElementById('chatArea');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const attachBtn = document.getElementById('attachBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const recentChats = document.getElementById('recentChats');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const fileInput = document.getElementById('fileInput');
  const promptSuggestions = [
    "Tell me a joke",
    "What's the weather like today?",
    "How do I learn programming?",
    "Explain quantum computing",
    "Write a short story",
    "Create a Workout plan",
    "Quiz me on World capitals",
    "Write a Story on Action genre",
    "Recommend a good book.",
    "How can I improve my public speaking skills?",
    "Explain the basics of blockchain technology.",
    "Create a healthy meal plan for a week.",
    "Quiz me on famous historical events.",
    "Give me a random fun fact.",
    "What's a beginner-friendly hobby to pick up?",
    "Summarize the plot of a classic movie.",
    "Describe a futuristic city.",
    "What's a creative way to organize my workspace?",
    
  ];
  
  function displayPromptSuggestions() {
    const suggestionsContainer = document.getElementById('promptSuggestions');
    suggestionsContainer.innerHTML = '';
  
    if (userInput.value.trim() === '') {
      const shuffled = promptSuggestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
  
      selected.forEach(suggestion => {
        const button = document.createElement('button');
        button.textContent = suggestion;
        button.classList.add('prompt-suggestion');
        button.addEventListener('click', () => {
          userInput.value = suggestion;
          suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(button);
      });
    }
  }
  
  userInput.addEventListener('input', displayPromptSuggestions);
  displayPromptSuggestions(); // Call this initially to show suggestions when the page loads

  let currentChat = [];
  let savedChats = JSON.parse(localStorage.getItem('recentChats')) || [];
  
  function init() {
      loadRecentChats();
      setupEventListeners();
      displayPromptSuggestions();
  }
  
  function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', handleKeyPress);
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    newChatBtn.addEventListener('click', startNewChat);
    window.addEventListener('beforeunload', saveCurrentChat);
  }

  function handleKeyPress(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
      }
  }

  function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        displayMessage('user', message);
        userInput.value = '';
        generateAIResponse(message);
        saveCurrentChat();
    }
  }

  function createTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    return typingIndicator;
  }

  function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
  }


  function displayMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender);
    messageElement.innerHTML = marked.parse(message);
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight;
    currentChat.push({ sender, message });
  }

  async function generateAIResponse(message) {
    const typingIndicator = createTypingIndicator();
    chatArea.appendChild(typingIndicator);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('assistant', JSON.stringify(aiAssistant));
        formData.append('history', JSON.stringify(currentChat));

        const response = await fetch('/api/chat', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error generating AI response');
        }

        const data = await response.json();
        removeTypingIndicator();
        displayMessage('ai', data.reply);
        saveCurrentChat();
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        displayMessage('ai', 'I apologize, but there was an error generating a response. Please try again.');
    }
  }
  
  function saveCurrentChat() {
    if (currentChat.length > 0) {
        const chatTitle = getChatTitle();
        const existingChatIndex = savedChats.findIndex(chat => chat.title === chatTitle);
        
        if (existingChatIndex !== -1) {
            savedChats[existingChatIndex].messages = currentChat;
        } else {
            savedChats.unshift({ title: chatTitle, messages: currentChat });
        }
        
        localStorage.setItem('recentChats', JSON.stringify(savedChats));
        loadRecentChats();
    }
  }

  function handleFileUpload(e) {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.style.maxWidth = '100%';
              displayMessage('user', img.outerHTML);
          };
          reader.readAsDataURL(file);
      }
  }

  function startNewChat() {
    saveCurrentChat();
    currentChat = [];
    chatArea.innerHTML = '';
    displayPromptSuggestions();
  }

  function findExistingChatIndex(title) {
    return savedChats.findIndex(chat => chat.title === title);
  }

  function handleBeforeUnload() {
    if (currentChat.length > 0) {
      const chatTitle = getChatTitle();
      startNewChat(); // This will save or overwrite the current chat
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload);

  function getChatTitle() {
    if (currentChat.length > 0) {
        const firstMessage = currentChat[0].message;
        return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
    }
    return "New Chat";
  }

  function saveChatSession(title) {
      if (currentChat.length > 0) {
          const savedChats = JSON.parse(localStorage.getItem('recentChats')) || [];
          savedChats.unshift({
              title: title,
              messages: currentChat
          });
          localStorage.setItem('recentChats', JSON.stringify(savedChats));
          loadRecentChats();
      }
  }

  function loadRecentChats() {
    const recentChatsElement = document.getElementById('recentChats');
    recentChatsElement.innerHTML = '';
    
    savedChats.forEach((chat, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="chat-title">${chat.title}</span>
            <div class="chat-options">
                <button class="options-toggle">⋮</button>
                <div class="options-menu">
                    <button class="rename-chat">Rename</button>
                    <button class="delete-chat">Delete</button>
                </div>
            </div>
        `;
        li.querySelector('.chat-title').addEventListener('click', () => loadChat(index));
        li.querySelector('.rename-chat').addEventListener('click', () => renameChat(index));
        li.querySelector('.delete-chat').addEventListener('click', () => deleteChat(index));
        li.querySelector('.options-toggle').addEventListener('click', (e) => toggleOptionsMenu(e));
        recentChatsElement.appendChild(li);
    });
  }

  function loadChat(index) {
    currentChat = savedChats[index].messages;
    chatArea.innerHTML = '';
    currentChat.forEach(message => displayMessage(message.sender, message.message));
  }

  function toggleOptionsMenu(event) {
    const optionsMenu = event.target.nextElementSibling;
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
    event.stopPropagation();
}

  function renameChat(index) {
    const newTitle = prompt("Enter new chat title:", savedChats[index].title);
    if (newTitle && newTitle.trim() !== "") {
        savedChats[index].title = newTitle.trim();
        localStorage.setItem('recentChats', JSON.stringify(savedChats));
        loadRecentChats();
    }
  }

  function deleteChat(index) {
    if (confirm("Are you sure you want to delete this chat?")) {
        savedChats.splice(index, 1);
        localStorage.setItem('recentChats', JSON.stringify(savedChats));
        loadRecentChats();
        if (index === currentChatIndex) {
            startNewChat();
        }
    }
  }

  function toggleSidebar() {
      sidebar.classList.toggle('collapsed');
  }

  function saveCurrentChatOnClose() {
      if (currentChat.length > 0) {
          getChatTitle().then(title => saveChatSession(title));
      }
  }

  init();
});