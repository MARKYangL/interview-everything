import { desktopCapturer } from 'electron';
import { RealtimeTranscriptionManager } from './RealtimeTranscriptionManager';

/**
 * 负责捕获系统音频并发送到转录服务
 * 支持不同提供商的音频格式要求
 */
export class SystemAudioCapture {
  private transcriptionManager: RealtimeTranscriptionManager;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isCapturing: boolean = false;
  
  constructor(transcriptionManager: RealtimeTranscriptionManager) {
    this.transcriptionManager = transcriptionManager;
  }
  
  /**
   * 初始化音频捕获
   */
  async initialize(): Promise<boolean> {
    try {
      // 根据提供商选择不同的采样率
      // OpenAI要求24kHz，DeepSeek可能需要16kHz
      const provider = this.transcriptionManager.getProvider();
      const sampleRate = provider === 'deepseek' ? 16000 : 24000;
      
      console.log(`Initializing AudioContext with sample rate ${sampleRate}Hz for ${provider}`);
      this.audioContext = new AudioContext({ sampleRate });
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context', error);
      return false;
    }
  }
  
  /**
   * 开始捕获系统音频
   */
  async startCapturing(): Promise<boolean> {
    if (this.isCapturing) return true;
    
    try {
      // 获取可用的音频源
      const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
      
      if (sources.length === 0) {
        console.error('No screen or window sources found');
        return false;
      }
      
      // 获取媒体流，选择整个屏幕以捕获系统声音
      const streamId = sources[0].id;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          } as any
        } as any,
        video: false
      });
      
      this.mediaStream = stream;
      
      if (!this.audioContext) {
        await this.initialize();
      }
      
      if (!this.audioContext) {
        console.error('Failed to initialize AudioContext');
        return false;
      }
      
      // 创建音频源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      
      // 创建处理节点 - 缓冲区大小根据提供商可能需要调整
      const provider = this.transcriptionManager.getProvider();
      const bufferSize = provider === 'deepseek' ? 2048 : 4096; // DeepSeek可能需要更小的缓冲区
      
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      // 处理音频数据
      this.processorNode.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // 转换为16位PCM
        const pcmData = this.convertToPCM16(inputData);
        
        // 发送到转录服务
        this.transcriptionManager.sendAudioChunk(pcmData);
      };
      
      // 连接节点
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
      
      this.isCapturing = true;
      return true;
    } catch (error) {
      console.error('Error capturing system audio', error);
      return false;
    }
  }
  
  /**
   * 停止捕获系统音频
   */
  stopCapturing(): void {
    if (!this.isCapturing) return;
    
    // 停止媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // 断开音频节点
    if (this.processorNode && this.audioContext) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    this.isCapturing = false;
  }
  
  /**
   * 将Float32Array转换为16位PCM
   */
  private convertToPCM16(float32Array: Float32Array): Uint8Array {
    const pcm16 = new Int16Array(float32Array.length);
    
    // 将[-1.0, 1.0]的浮点值转换为[-32768, 32767]的整数
    for (let i = 0; i < float32Array.length; i++) {
      // 限制在[-1, 1]范围
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // 转换为16位整数
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // 转换为字节数组
    return new Uint8Array(pcm16.buffer);
  }
  
  /**
   * 检查是否正在捕获
   */
  isActive(): boolean {
    return this.isCapturing;
  }
} 