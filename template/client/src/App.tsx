import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios from 'axios'
import './App.css'

function App() {
  const [utcDatetime, setUtcDatetime] = useState<string>('')

  const fetchUtcDatetime = async () => {
    axios.get<{utc_datetime: string}>('/api/utc-datetime').then((response) => {
      setUtcDatetime(response.data.utc_datetime)
    })
  }

  useEffect(() => {
    fetchUtcDatetime()
  }, [])

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={fetchUtcDatetime}>
          The current date and time is {utcDatetime}.
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
