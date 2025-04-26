import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import WebSocket from 'ws';

/**
 * 管理与实时语音API的通信
 * 支持OpenAI和DeepSeek两种提供商
 */
export class RealtimeTranscriptionManager extends EventEmitter {
  private apiKey: string;
  private provider: string; // 'openai' | 'deepseek'
  private wsConnection: WebSocket | null = null;
  private sessionToken: string | null = null;
  private isConnected: boolean = false;
  
  constructor(apiKey: string, provider: string = 'openai') {
    super();
    this.apiKey = apiKey;
    this.provider = provider;
  }
  
  /**
   * 创建新的转录会话并获取连接token
   */
  async createTranscriptionSession(): Promise<boolean> {
    if (this.provider === 'deepseek') {
      return this.createDeepSeekSession();
    } else {
      return this.createOpenAISession();
    }
  }
  
  /**
   * 创建OpenAI转录会话
   */
  private async createOpenAISession(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/transcription_sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
            prompt: "This is a technical job interview about programming, system design, and algorithms."
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          input_audio_noise_reduction: {
            type: 'near_field'
          },
          input_audio_format: 'pcm16'
        })
      });
      
      const data = await response.json();
      
      if (data.client_secret && data.client_secret.value) {
        this.sessionToken = data.client_secret.value;
        return true;
      }
      
      console.error('Failed to obtain OpenAI session token', data);
      return false;
    } catch (error) {
      console.error('Error creating OpenAI transcription session', error);
      return false;
    }
  }
  
  /**
   * 创建DeepSeek转录会话
   */
  private async createDeepSeekSession(): Promise<boolean> {
    try {
      // DeepSeek接口可能与OpenAI不同，这里使用假设的端点和参数
      // 实际实现时需要根据DeepSeek的API文档调整
      const response = await fetch('https://api.deepseek.com/v1/audio/transcription_sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-speech',
          format: 'pcm16',
          sample_rate: 16000,
          language: 'en',
          task: 'transcribe',
          prompt: "This is a technical job interview about programming, system design, and algorithms."
        })
      });
      
      const data = await response.json();
      
      // 假设DeepSeek返回类似格式的会话token
      if (data.session_token) {
        this.sessionToken = data.session_token;
        return true;
      }
      
      console.error('Failed to obtain DeepSeek session token', data);
      return false;
    } catch (error) {
      console.error('Error creating DeepSeek transcription session', error);
      return false;
    }
  }
  
  /**
   * 通过WebSocket连接到实时API
   */
  connectToWebSocket(): boolean {
    if (!this.sessionToken) {
      console.error('No session token available');
      return false;
    }
    
    try {
      // 根据提供商选择不同的WebSocket端点
      const wsEndpoint = this.provider === 'deepseek' 
        ? 'wss://api.deepseek.com/v1/audio/realtime'
        : 'wss://api.openai.com/v1/audio/realtime';
      
      this.wsConnection = new WebSocket(wsEndpoint);
      
      this.wsConnection.on('open', () => {
        // 认证消息可能因提供商而异
        const authMessage = JSON.stringify({
          type: 'auth',
          token: this.sessionToken
        });
        this.wsConnection?.send(authMessage);
        this.isConnected = true;
        this.setupWebSocketListeners();
        this.emit('connected');
      });
      
      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error', error);
        this.emit('error', error);
      });
      
      this.wsConnection.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting to WebSocket', error);
      return false;
    }
  }
  
  /**
   * 设置WebSocket事件监听器
   */
  private setupWebSocketListeners(): void {
    if (!this.wsConnection) return;
    
    this.wsConnection.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (this.provider === 'deepseek') {
          this.handleDeepSeekMessage(message);
        } else {
          this.handleOpenAIMessage(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message', error);
      }
    });
  }
  
  /**
   * 处理OpenAI消息
   */
  private handleOpenAIMessage(message: any): void {
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.delta':
        this.emit('transcription-delta', {
          text: message.delta,
          itemId: message.item_id,
          contentIndex: message.content_index
        });
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        this.emit('transcription-completed', {
          text: message.transcript,
          itemId: message.item_id,
          contentIndex: message.content_index
        });
        break;
        
      case 'input_audio_buffer.speech_started':
        this.emit('speech-started', {
          audioStartMs: message.audio_start_ms,
          itemId: message.item_id
        });
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.emit('speech-stopped', {
          audioEndMs: message.audio_end_ms,
          itemId: message.item_id
        });
        break;
        
      case 'error':
        console.error('API error', message.error);
        this.emit('api-error', message.error);
        break;
        
      default:
        // 其他消息只记录不特别处理
        console.log('OpenAI WebSocket message', message);
    }
  }
  
  /**
   * 处理DeepSeek消息
   */
  private handleDeepSeekMessage(message: any): void {
    // 假设DeepSeek的消息格式，需要根据实际API调整
    switch (message.type) {
      case 'transcription.partial':
        this.emit('transcription-delta', {
          text: message.text,
          itemId: message.id || '0',
          contentIndex: 0
        });
        break;
        
      case 'transcription.final':
        this.emit('transcription-completed', {
          text: message.text,
          itemId: message.id || '0',
          contentIndex: 0
        });
        break;
        
      case 'speech.started':
        this.emit('speech-started', {
          audioStartMs: message.timestamp,
          itemId: message.id || '0'
        });
        break;
        
      case 'speech.stopped':
        this.emit('speech-stopped', {
          audioEndMs: message.timestamp,
          itemId: message.id || '0'
        });
        break;
        
      case 'error':
        console.error('DeepSeek API error', message.error);
        this.emit('api-error', message.error);
        break;
        
      default:
        // 其他消息只记录不特别处理
        console.log('DeepSeek WebSocket message', message);
    }
  }
  
  /**
   * 发送音频数据到WebSocket
   */
  sendAudioChunk(audioData: Uint8Array): boolean {
    if (!this.wsConnection || !this.isConnected) {
      return false;
    }
    
    try {
      // 音频数据格式可能因提供商而异
      const base64Audio = Buffer.from(audioData).toString('base64');
      
      const message = this.provider === 'deepseek'
        ? JSON.stringify({
            type: 'audio.chunk',
            audio: base64Audio,
            timestamp: Date.now()
          })
        : JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          });
      
      this.wsConnection.send(message);
      return true;
    } catch (error) {
      console.error('Error sending audio chunk', error);
      return false;
    }
  }
  
  /**
   * 关闭连接
   */
  close(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
      this.isConnected = false;
    }
  }
  
  /**
   * 检查是否已连接
   */
  isActive(): boolean {
    return this.isConnected;
  }
  
  /**
   * 获取当前使用的提供商
   */
  getProvider(): string {
    return this.provider;
  }
} 