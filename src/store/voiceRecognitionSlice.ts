import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionType } from '../../electron/services/QuestionClassifier';

interface VoiceRecognitionState {
  isActive: boolean;
  isSpeaking: boolean;
  transcript: string;
  questionType: QuestionType | string;
}

const initialState: VoiceRecognitionState = {
  isActive: false,
  isSpeaking: false,
  transcript: '',
  questionType: QuestionType.UNKNOWN
};

const voiceRecognitionSlice = createSlice({
  name: 'voiceRecognition',
  initialState,
  reducers: {
    startVoiceRecognition(state) {
      state.isActive = true;
    },
    stopVoiceRecognition(state) {
      state.isActive = false;
      state.isSpeaking = false;
    },
    setSpeakingState(state, action: PayloadAction<boolean>) {
      state.isSpeaking = action.payload;
    },
    setTranscript(state, action: PayloadAction<string>) {
      state.transcript = action.payload;
    },
    setQuestionType(state, action: PayloadAction<QuestionType | string>) {
      state.questionType = action.payload;
    },
    resetVoiceRecognition(state) {
      state.transcript = '';
      state.questionType = QuestionType.UNKNOWN;
    }
  }
});

export const {
  startVoiceRecognition,
  stopVoiceRecognition,
  setSpeakingState,
  setTranscript,
  setQuestionType,
  resetVoiceRecognition
} = voiceRecognitionSlice.actions;

export default voiceRecognitionSlice.reducer; 