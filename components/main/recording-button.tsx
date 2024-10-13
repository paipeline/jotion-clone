"use client"

import { Mic } from "lucide-react";
import React, { useRef, useState } from "react";
import { useEdgeStore } from "@/lib/edgestore";

export const RecordingButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);  // 持久化变量用来存储 MediaRecorder实例 不会因为组件重新渲染而丢失
  const audioChunkRef = useRef<Blob[]>([]);   // audioChunksRef 是一个数组，用来存储录音时生成的音频数据块
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);  // 这个是 动态存储
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false)
  const recordButtonRef = useRef<HTMLDivElement | null>(null);
  const sendToBackendRef = useRef<HTMLDivElement | null>(null);
  const downloadButtonRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { edgestore } = useEdgeStore();

  const handleRecordingClick = () => {
    if (isRecording) {
      setIsRecording(false)
      stopRecording();
    } else {
      setIsRecording(true);
      startRecording();
    }
    triggerButtonAnimation(recordButtonRef);
  }

  const triggerButtonAnimation = (buttonRef: React.RefObject<HTMLDivElement | null>) => {
    if (buttonRef.current) {
      let timer: NodeJS.Timeout;
      buttonRef.current.style.transition = 'width 0.5s ease';
      setTimeout(() => {
        if (buttonRef.current && isRecording) {
          buttonRef.current.style.width = '40px';
          setIsExpanded(false)
        }
        if ((buttonRef.current && !isRecording)) {
          clearTimeout(timer)  // 使用 timer 变量清除定时器 -- 还是有bug，bug是如果用户疯狂点击录音，1秒点5次这个按钮，文字会出问题，因为回调函数地狱
          buttonRef.current.style.width = '200px';
          timer = setTimeout(() => setIsExpanded(true), 250)
        }
      }, 0);
    }
  }

  // 开始录音
  const startRecording = async () => {
    console.log("开始录音");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunkRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
      audioChunkRef.current.push(event.data);
    }

    mediaRecorderRef.current.start();
    setIsRecording(true);
  }

  // 结束录音
  const stopRecording = () => {
    console.log("停止录音");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = async () => {   // 检测录音截止的监听事件，然后把这个目前的 audioChunk这个原始数组给到audioBlob里面with the type of wav格式
        const audioBlob = new Blob(audioChunkRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);

        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);

        // // 自动下载录音文件 -- 临时测试功能，到时候可以删除
        // const downloadLink = document.createElement("a");
        // downloadLink.href = audioURL;
        // downloadLink.download = "recording.wav";
        // downloadLink.click();  // 自动触发点击事件，开始下载

        // 上传录音文件到 EdgeStore
        await uploadRecordingToEdgeStore(audioBlob); // 调用上传函数
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  // 这个函数负责将录音文件上传到 EdgeStore
  const uploadRecordingToEdgeStore = async (audioBlob: Blob) => {
    const file = new File([audioBlob], "recording.wav", { type: "audio/wav" });    // 将 Blob 转换为 File 对象

    if (file) {
      setIsSubmitting(true); 
      try {
        const res = await edgestore.publicFiles.upload({
          file
        });
        console.log("上传成功，文件URL:", res.url);
      } catch (error) {
        console.error("上传失败:", error);
      } finally {
        setIsSubmitting(false); 
      }
    }
  };

  return (
    <div>
      {/* 录音按钮 */}
      <div
        ref={recordButtonRef}
        className={`fixed right-5 bottom-5 text-sm h-10 w-10 font-bold bg-red-700 opacity-90 rounded-[50px] space-y-3 flex justify-center items-center shadow-lg`}
        role="button"
        onClick={handleRecordingClick}
      >
        <Mic className="text-white" size={20} />
        {isExpanded && (
          <span className="text-white ml-2 pb-3">
            {isRecording ? "stop recording" : "start recording"}
          </span>
        )}
      </div>
    </div>
  );
}
