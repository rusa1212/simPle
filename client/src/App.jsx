import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main>
      <h1>simPle</h1>
      <p>
        Server:{' '}
        {error ? `error (${error})` : health ? health.status : 'checking...'}
      </p>
    </main>
  )
}

export default App
