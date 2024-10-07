"use client";

import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import {
  BlockNoteEditor,
  PartialBlock,
  filterSuggestionItems,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback } from "react";
import { ImMagicWand } from "react-icons/im";
import { completeText } from "./ai";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  // 自定义 AI 完成项
  const completeWithAIItem = (editor: BlockNoteEditor): DefaultReactSuggestionItem => ({
    title: "Complete with AI",
    onItemClick: async () => {
      await completeText(editor);
      // 触发 onChange 事件以保存更改
      handleChange();
    },
    aliases: ["ai", "complete"],
    group: "AI",
    icon: <ImMagicWand size={18} />,
    subtext: "Use AI to complete your text",
  });

  // 获取自定义斜杠菜单项，将 AI 完成项放在最前面
  const getCustomSlashMenuItems = (
    editor: BlockNoteEditor
  ): DefaultReactSuggestionItem[] => [
    completeWithAIItem(editor),
    ...getDefaultReactSlashMenuItems(editor),
  ];

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    uploadFile: handleUpload,
  });

  const handleChange = useCallback(() => {
    const content = JSON.stringify(editor.document, null, 2);
    onChange(content);
  }, [editor, onChange]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;