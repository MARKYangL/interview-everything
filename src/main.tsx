import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import voiceRecognitionReducer from "./store/voiceRecognitionSlice"
import App from "./App"
import "./index.css"

// 创建Redux store
const store = configureStore({
  reducer: {
    voiceRecognition: voiceRecognitionReducer
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
