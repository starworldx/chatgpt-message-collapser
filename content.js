// ===========================================
// ChatGPT Message Collapser - Content Script
// ===========================================

(function() {
  'use strict';

  // Track processed messages to avoid duplicates
  const PROCESSED_ATTR = 'data-cgpt-collapse-processed';
  
  // Selectors - update these if ChatGPT changes their DOM
  const SELECTORS = {
    // Each message turn
    messageTurn: 'article[data-testid^="conversation-turn-"]',
    // The main conversation container (for observing)
    conversationContainer: 'main',
  };

  // State
  let toolbar = null;
  let observer = null;

  // ===========================================
  // Toolbar
  // ===========================================

  function createToolbar() {
    if (toolbar) return toolbar;

    toolbar = document.createElement('div');
    toolbar.className = 'cgpt-collapse-toolbar';
    toolbar.innerHTML = `
      <button id="cgpt-collapse-all" title="Collapse all messages">
        <span>▼</span> Collapse All
      </button>
      <button id="cgpt-expand-all" title="Expand all messages">
        <span>▲</span> Expand All
      </button>
      <button id="cgpt-scroll-top" title="Scroll to top">
        <span>⤒</span> Top
      </button>
      <button id="cgpt-scroll-bottom" title="Scroll to bottom">
        <span>⤓</span> Bottom
      </button>
      <span class="cgpt-collapse-counter" id="cgpt-counter"></span>
    `;

    document.body.appendChild(toolbar);

    // Event listeners
    document.getElementById('cgpt-collapse-all').addEventListener('click', collapseAll);
    document.getElementById('cgpt-expand-all').addEventListener('click', expandAll);
    document.getElementById('cgpt-scroll-top').addEventListener('click', scrollToTop);
    document.getElementById('cgpt-scroll-bottom').addEventListener('click', scrollToBottom);

    updateCounter();
    return toolbar;
  }

  function updateCounter() {
    const counter = document.getElementById('cgpt-counter');
    if (!counter) return;

    const total = document.querySelectorAll(SELECTORS.messageTurn).length;
    const collapsed = document.querySelectorAll('.cgpt-message-content.collapsed').length;
    
    if (total > 0) {
      counter.textContent = `${collapsed}/${total} collapsed`;
    } else {
      counter.textContent = '';
    }
  }

  // ===========================================
  // Collapse/Expand Logic
  // ===========================================

  function collapseMessage(article) {
    const contentWrapper = article.querySelector('.cgpt-message-content');
    const toggle = article.querySelector('.cgpt-collapse-toggle');
    
    if (contentWrapper && !contentWrapper.classList.contains('collapsed')) {
      contentWrapper.classList.add('collapsed');
      if (toggle) toggle.classList.add('collapsed');
    }
    updateCounter();
  }

  function expandMessage(article) {
    const contentWrapper = article.querySelector('.cgpt-message-content');
    const toggle = article.querySelector('.cgpt-collapse-toggle');
    
    if (contentWrapper && contentWrapper.classList.contains('collapsed')) {
      contentWrapper.classList.remove('collapsed');
      if (toggle) toggle.classList.remove('collapsed');
    }
    updateCounter();
  }

  function toggleMessage(article) {
    const contentWrapper = article.querySelector('.cgpt-message-content');
    if (!contentWrapper) return;

    if (contentWrapper.classList.contains('collapsed')) {
      expandMessage(article);
    } else {
      collapseMessage(article);
    }
  }

  function collapseAll() {
    const articles = document.querySelectorAll(SELECTORS.messageTurn);
    articles.forEach(article => collapseMessage(article));
  }

  function expandAll() {
    const articles = document.querySelectorAll(SELECTORS.messageTurn);
    articles.forEach(article => expandMessage(article));
  }

  function getScrollContainer() {
    // Try multiple selectors to find ChatGPT's scroll container
    // ChatGPT's DOM changes, so we try several approaches
    
    // Method 1: Find by overflow-y-auto class (most reliable)
    const candidates = document.querySelectorAll('[class*="overflow-y-auto"]');
    for (const el of candidates) {
      // Must be scrollable (content taller than container)
      if (el.scrollHeight > el.clientHeight + 10) {
        // Must contain conversation turns
        if (el.querySelector('article[data-testid^="conversation-turn-"]')) {
          return el;
        }
      }
    }
    
    // Method 2: Find parent of conversation turns that's scrollable
    const firstTurn = document.querySelector('article[data-testid^="conversation-turn-"]');
    if (firstTurn) {
      let parent = firstTurn.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') 
            && parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    
    // Method 3: Fallback to scrollbar-gutter element
    const gutter = document.querySelector('[class*="scrollbar-gutter"]');
    if (gutter && gutter.scrollHeight > gutter.clientHeight) {
      return gutter;
    }
    
    // Final fallback
    return null;
  }

  function scrollToTop() {
    const scrollContainer = getScrollContainer();
    
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback to window scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function scrollToBottom() {
    const scrollContainer = getScrollContainer();
    
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    } else {
      // Fallback to window scroll  
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  // ===========================================
  // Process Messages
  // ===========================================

  function processMessage(article) {
    // Skip if already processed
    if (article.hasAttribute(PROCESSED_ATTR)) return;
    article.setAttribute(PROCESSED_ATTR, 'true');

    // Find the content area - this is the tricky part
    // ChatGPT structure: article > div > div (with the actual content)
    // We want to wrap the content, not the whole article
    
    // The content is typically in the second child div of the article
    // But we need to find the actual message content, not metadata
    const contentDiv = findContentDiv(article);
    if (!contentDiv) return;

    // Wrap content in our collapsible container
    wrapContent(article, contentDiv);

    // Add toggle button
    addToggleButton(article);
  }

  function findContentDiv(article) {
    // ChatGPT's structure varies, but generally:
    // - There's a container with the avatar/role indicator
    // - Then the actual message content
    
    // Try to find the prose content (markdown rendered area)
    // or the main content div
    
    // First, try finding the markdown/prose container
    let content = article.querySelector('.markdown');
    if (content) return content.parentElement || content;

    // Alternative: find the main inner content area
    // Usually it's a nested div structure
    const innerDivs = article.querySelectorAll(':scope > div > div');
    if (innerDivs.length > 0) {
      // Usually the last div contains the actual content
      return innerDivs[innerDivs.length - 1];
    }

    // Fallback: just use the first child div
    return article.querySelector(':scope > div');
  }

  function wrapContent(article, contentDiv) {
    // Check if already wrapped
    if (contentDiv.classList.contains('cgpt-message-content')) return;
    if (contentDiv.parentElement?.classList.contains('cgpt-message-content')) return;

    // Add class to existing element rather than wrapping
    // This is less invasive and less likely to break ChatGPT's JS
    contentDiv.classList.add('cgpt-message-content');
  }

  function addToggleButton(article) {
    // Check if toggle already exists
    if (article.querySelector('.cgpt-collapse-toggle')) return;

    const toggle = document.createElement('button');
    toggle.className = 'cgpt-collapse-toggle';
    toggle.innerHTML = '<span class="chevron">▼</span>';
    toggle.title = 'Click to collapse/expand this message';
    
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMessage(article);
    });

    // Find a good insertion point - try to place at the top of the message
    // Look for the author/role indicator area or the first div
    const firstDiv = article.querySelector(':scope > div');
    
    if (firstDiv) {
      // Create a wrapper to hold toggle + existing content header
      const wrapper = document.createElement('div');
      wrapper.className = 'cgpt-toggle-wrapper';
      wrapper.appendChild(toggle);
      
      // Insert wrapper at the start of the first div
      firstDiv.insertBefore(wrapper, firstDiv.firstChild);
    } else {
      // Fallback: just prepend to article
      article.insertBefore(toggle, article.firstChild);
    }
  }

  function processAllMessages() {
    const articles = document.querySelectorAll(SELECTORS.messageTurn);
    articles.forEach(article => processMessage(article));
    updateCounter();
  }

  // ===========================================
  // Observer
  // ===========================================

  function setupObserver() {
    if (observer) return;

    const container = document.querySelector(SELECTORS.conversationContainer) || document.body;

    observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check added nodes for message turns
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches?.(SELECTORS.messageTurn)) {
                shouldProcess = true;
                break;
              }
              if (node.querySelector?.(SELECTORS.messageTurn)) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
        if (shouldProcess) break;
      }

      if (shouldProcess) {
        // Debounce to handle rapid updates during streaming
        clearTimeout(window._cgptProcessTimeout);
        window._cgptProcessTimeout = setTimeout(() => {
          processAllMessages();
        }, 100);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }

  // ===========================================
  // Navigation Handling
  // ===========================================

  // ChatGPT is a SPA - handle navigation between conversations
  function setupNavigationHandler() {
    let lastUrl = location.href;

    // Check for URL changes
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Small delay to let new content load
        setTimeout(() => {
          processAllMessages();
          updateCounter();
        }, 500);
      }
    }, 500);
  }

  // ===========================================
  // Initialization
  // ===========================================

  function init() {
    // Wait a moment for ChatGPT to fully render
    setTimeout(() => {
      createToolbar();
      processAllMessages();
      setupObserver();
      setupNavigationHandler();
      console.log('[ChatGPT Collapser] Initialized');
    }, 1000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
