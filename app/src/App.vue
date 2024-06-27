<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'

const ws = ref<WebSocket | null>(null)
const message = ref<{ message: string } | null>(null)
const isConnected = ref(false)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const reconnectInterval = 3000 // 3秒

const connectWebSocket = () => {
  ws.value = new WebSocket('wss://socket.cristallum.io?locationId=abcd1345')

  ws.value.onopen = () => {
    console.log('Connected')
    isConnected.value = true
    reconnectAttempts.value = 0
  }

  ws.value.onmessage = (e) => {
    console.log('onmessage:')
    message.value = JSON.parse(e.data)
  }

  ws.value.onclose = () => {
    console.log('Disconnected')
    isConnected.value = false
    reconnect()
  }

  ws.value.onerror = (e) => {
    console.error('Error:', e)
    isConnected.value = false
  }
}

const reconnect = () => {
  if (reconnectAttempts.value < maxReconnectAttempts) {
    reconnectAttempts.value++
    console.log(`Attempting to reconnect... (${reconnectAttempts.value}/${maxReconnectAttempts})`)
    setTimeout(connectWebSocket, reconnectInterval)
  } else {
    console.log('Max reconnect attempts reached. Please try again later.')
  }
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})

const close = () => {
  if (ws.value) {
    ws.value.close()
    isConnected.value = false
    reconnectAttempts.value = maxReconnectAttempts // 手動で閉じた場合は再接続を試みない
  }
}

const manualReconnect = () => {
  if (!isConnected.value) {
    reconnectAttempts.value = 0
    connectWebSocket()
  }
}
</script>

<template>
  <div>
    <p>接続状態: {{ isConnected ? '接続中' : '切断' }}</p>
    <p>メッセージ: {{ message }}</p>
  </div>
  <button @click="close">Close</button>
  <button @click="manualReconnect" :disabled="isConnected">再接続</button>
</template>
