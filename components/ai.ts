import { BlockNoteEditor, Block } from "@blocknote/core";

export interface CompletionResponse {
  completion: string;
  error?: string;
}

export async function getAICompletion(
  prompt: string,
  query: string
): Promise<string | undefined> {
  try {
    const response = await fetch('/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let data: CompletionResponse;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      throw new Error('Invalid JSON response from server');
    }

    if (data.error) {
      throw new Error(data.error);
    }
    return data.completion;
  } catch (error) {
    console.error('[AI_COMPLETION_ERROR]', error);
    return undefined;
  }
}

export async function completeText(editor: BlockNoteEditor) {
  try {
    const currentBlock = editor.getTextCursorPosition().block;
    const textContent = currentBlock.content?.[0]?.text || '';
    
    if (!textContent) {
      console.log('No text content to complete');
      return;
    }

    const loadingId = addLoadingIndicator(editor, currentBlock);

    const completion = await getAICompletion(textContent);
    
    removeLoadingIndicator(editor, currentBlock, loadingId);

    if (!completion) {
      console.log('No completion received');
      return;
    }

    appendCompletion(editor, currentBlock, completion);

  } catch (error) {
    console.error('[COMPLETE_TEXT_ERROR]', error);
    handleCompletionError(editor, editor.getTextCursorPosition().block);
  }
}

function addLoadingIndicator(editor: BlockNoteEditor, block: Block): string {
  const loadingId = `loading-${Date.now()}`;
  const existingContent = Array.isArray(block.content) ? block.content : [];
  
  editor.updateBlock(block, {
    content: [
      ...existingContent,
      { type: "text", text: " ⌛", styles: {}, id: loadingId }
    ]
  });
  
  return loadingId;
}

function removeLoadingIndicator(editor: BlockNoteEditor, block: Block, loadingId: string) {
  const existingContent = Array.isArray(block.content) ? block.content : [];
  
  editor.updateBlock(block, {
    content: existingContent.filter(item => item.id !== loadingId)
  });
}

function appendCompletion(editor: BlockNoteEditor, block: Block, completion: string) {
  const existingContent = Array.isArray(block.content) ? block.content : [];
  const lastContentItem = existingContent[existingContent.length - 1];

  if (lastContentItem && lastContentItem.type === "text" && !lastContentItem.id?.startsWith('loading-')) {
    editor.updateBlock(block, {
      content: [
        ...existingContent.slice(0, -1),
        { 
          ...lastContentItem,
          text: lastContentItem.text + completion
        }
      ]
    });
  } else {
    const filteredContent = existingContent.filter(item => !item.id?.startsWith('loading-'));
    editor.updateBlock(block, {
      content: [
        ...filteredContent,
        { 
          type: "text", 
          text: completion,
          styles: {}
        }
      ]
    });
  }
}

function handleCompletionError(editor: BlockNoteEditor, block: Block) {
  const existingContent = Array.isArray(block.content) ? block.content : [];
  const filteredContent = existingContent.filter(item => !item.id?.startsWith('loading-'));

  editor.updateBlock(block, {
    content: [
      ...filteredContent,
      { 
        type: "text", 
        text: " [AI completion failed] ", 
        styles: { textColor: "red" }
      }
    ]
  });
}